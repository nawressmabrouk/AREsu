
package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Map;

import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;

import tn.sousse.univ.reservation_app.dto.ReservationRequestDTO;
import tn.sousse.univ.reservation_app.dto.ReservationResponseDTO;
import tn.sousse.univ.reservation_app.mappers.ReservationMapper;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.EtablissementRepository;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;
import tn.sousse.univ.reservation_app.repositories.UserRepository;

@Service
public class ReservationService {
    private static final Logger logger = LoggerFactory.getLogger(SecretaireGeneraleService.class);
    @Autowired
    private Calendar googleCalendar;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GoogleCalendarService googleCalendarService;

    @Autowired
    private EspaceRepository espaceRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SecretaireGeneraleService secretaireGeneraleService;

    @Autowired
    private EtablissementRepository etablissementRepository;

    @Autowired
    private EmailService emailService;

    private static final String CALENDAR_ID = "REDACTED_OLD_APP_EMAIL";

    public ReservationResponseDTO creerReservation(ReservationRequestDTO reservationDTO) {
        logger.debug("Début de creerReservation avec DTO: {}", reservationDTO);

        // 1. Fetch demandeur
        User demandeur = userRepository.findById(reservationDTO.getDemandeurId())
                .orElseThrow(() -> new RuntimeException("Demandeur introuvable"));

        // 2. Fetch espace and verify etablissementId
        Espace espace = espaceRepository.findById(reservationDTO.getEspaceId())
                .orElseThrow(() -> new RuntimeException("Espace introuvable"));

        Etablissement etab = etablissementRepository.findById(espace.getEtablissementId())
                .orElseThrow(() -> new RuntimeException("Establishment not found"));

        if (etab.getGoogleCalendarId() == null) {
            logger.error("Establishment {} has no Google Calendar configured", etab.getId());
            throw new IllegalStateException("This establishment has no calendar configured");
        }

        if (espace.getEtablissementId() == null || espace.getEtablissementId().isEmpty()) {
            logger.error("L'espace {} n'a pas d'etablissementId associé", espace.getId());
            throw new IllegalStateException("L'espace n'est associé à aucun établissement");
        }

        // 3. Create reservation with ALL required fields
        Reservation reservation = ReservationMapper.toEntity(reservationDTO, demandeur.getId());
        reservation.setEspaceNom(espace.getNom());
        reservation.setDemandeurRole(demandeur.getRole().toString());
        reservation.setStatut(StatusReservation.EN_ATTENTE);
        reservation.setEtablissementId(espace.getEtablissementId()); // CRITICAL: Set etablissementId

        // 4. Save reservation
        Reservation savedReservation = reservationRepository.save(reservation);
        logger.info("Réservation créée avec ID: {}", savedReservation.getId());

        // 5. Verify transmission data
        logger.debug("Transmission data - ReservationID: {}, EspaceID: {}, EtablissementID: {}",
                savedReservation.getId(),
                savedReservation.getEspaceId(),
                savedReservation.getEtablissementId());

        try {
            transmettreReservation(savedReservation.getId());
        } catch (Exception e) {
            logger.error("Échec transmission pour réservation {}", savedReservation.getId(), e);
            throw new RuntimeException("Erreur de transmission: " + e.getMessage(), e);
        }

        // ... (email sending code remains the same)

        return ReservationMapper.toResponseDTOFull(
                savedReservation,
                demandeur.getEmail(),
                demandeur.getNom(),
                espace.getNom(),
                demandeur.getRole().toString());
    }

    public void addReservationToCalendar(Reservation reservation) throws IOException {
        // 1. Get the establishment's calendar ID
        Etablissement etab = etablissementRepository.findById(reservation.getEtablissementId())
                .orElseThrow(() -> new RuntimeException("Establishment not found"));

        // ADDED STRICT VALIDATION
        if (etab.getGoogleCalendarId() == null || etab.getGoogleCalendarId().isEmpty()) {
            throw new IllegalStateException("No Google Calendar configured for establishment: " + etab.getNom());
        }

        logger.info("Adding reservation to calendar {} for establishment {}",
                etab.getGoogleCalendarId(), etab.getNom());

        // 2. Create event with proper timezone handling
        Event event = new Event()
                .setSummary(reservation.getIntituleAction())
                .setDescription(reservation.getDescription())
                .setStart(new EventDateTime()
                        .setDateTime(new DateTime(reservation.getHeureDebut())))
                .setEnd(new EventDateTime()
                        .setDateTime(new DateTime(reservation.getHeureFin())))
                // ADDED RESERVATION ID AS EXTENDED PROPERTY
                .setExtendedProperties(new Event.ExtendedProperties()
                        .setPrivate(Map.of("reservationId", reservation.getId())));

        // 3. Insert into the SPECIFIC establishment calendar
        Event createdEvent = googleCalendar.events()
                .insert(etab.getGoogleCalendarId(), event)
                .execute();

        // 4. Store event ID in reservation
        reservation.setGoogleEventId(createdEvent.getId());
        reservationRepository.save(reservation);

        logger.info("Successfully added event {} to calendar {}",
                createdEvent.getId(), etab.getGoogleCalendarId());
    }

    public void supprimerReservation(String id) {
        reservationRepository.deleteById(id);
    }

    public List<Reservation> trouverReservationsParStatut(String statut) {
        return reservationRepository.findByStatut(statut);
    }

    public List<Reservation> trouverReservationsParEspaceId(ObjectId espaceId) {
        return reservationRepository.findByEspaceId(espaceId);
    }

    public Reservation trouverReservationParId(String id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée avec ID: " + id));
    }

    public List<Reservation> trouverReservationsParDemandeurId(String demandeurId) {
        return reservationRepository.findByDemandeurId(demandeurId);
    }

    public void annulerReservation(String reservationId, String demandeurId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée avec l'ID : " + reservationId));

        if (!reservation.getDemandeurId().equals(demandeurId)) {
            throw new RuntimeException("Vous n'avez pas le droit d'annuler cette réservation.");
        }

        if (reservation.getStatut() == StatusReservation.ANNULÉE) {
            throw new RuntimeException("Cette réservation est déjà annulée.");
        }

        reservation.setStatut(StatusReservation.ANNULÉE);
        reservationRepository.save(reservation);

    }

    // endpoint nourhen :
    @Transactional
    public String transmettreReservation(String reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

        Espace espace = espaceRepository.findById(reservation.getEspaceId())
                .orElseThrow(() -> new RuntimeException("Espace non trouvé"));

        Etablissement etablissement = etablissementRepository.findById(espace.getEtablissementId())
                .orElseThrow(() -> new RuntimeException("Etablissement non trouvé"));

        try {
            // Mise à jour du statut
            reservation.setVueParSecretaire(false);
            reservation.setStatut(StatusReservation.EN_ATTENTE);

            String resultMessage;
            String formattedDate = new SimpleDateFormat("dd/MM/yyyy 'à' HH:mm").format(reservation.getHeureDebut());

            if (espace.getResponsableId() != null) {
                // Cas avec responsable d'espace
                reservation.setResponsableEspaceId(espace.getResponsableId());
                reservationRepository.save(reservation);

                // Email au responsable
                User responsable = userRepository.findById(espace.getResponsableId())
                        .orElseThrow(() -> new RuntimeException("Responsable non trouvé"));

                String emailBodyResponsable = String.format(
                        "Madame, Monsieur,\n\n" +
                                "Une nouvelle demande de réservation nécessite votre examen :\n\n" +
                                "Détails de la demande :\n" +
                                "- Espace : %s\n" +
                                "- Demandeur : %s\n" +
                                "- Date demandée : %s\n" +
                                "- Motif : %s\n" +
                                "- Équipements demandés : %s\n\n" +
                                "Veuillez traiter cette demande dans les plus brefs délais.\n\n" +
                                "Cordialement,\n" +
                                "Le Service des Réservations\n" +
                                "%s",
                        espace.getNom(),
                        userRepository.findById(reservation.getDemandeurId()).orElseThrow().getNom(),
                        formattedDate,
                        reservation.getIntituleAction(),
                        reservation.getEquipements().isEmpty() ? "Aucun"
                                : String.join(", ", reservation.getEquipements()),
                        etablissement.getNom());

                emailService.sendEmail(
                        responsable.getEmail(),
                        "Nouvelle demande de réservation - Action requise",
                        emailBodyResponsable);

                // Notification au secrétaire général
                if (etablissement.getSecretaireGeneraleId() != null) {
                    User secretaire = userRepository.findById(etablissement.getSecretaireGeneraleId())
                            .orElseThrow(() -> new RuntimeException("Secrétaire général non trouvé"));

                    String emailBodySG = String.format(
                            "Madame, Monsieur,\n\n" +
                                    "Pour information, une nouvelle demande a été transmise à un responsable :\n\n" +
                                    "- Espace : %s\n" +
                                    "- Responsable assigné : %s\n" +
                                    "- Demandeur : %s\n" +
                                    "- Date demandée : %s\n\n" +
                                    "Cordialement,\n" +
                                    "Système de Gestion des Réservations\n" +
                                    "%s",
                            espace.getNom(),
                            responsable.getNom(),
                            userRepository.findById(reservation.getDemandeurId()).orElseThrow().getNom(),
                            formattedDate,
                            etablissement.getNom());

                    emailService.sendEmail(
                            secretaire.getEmail(),
                            "Notification : Demande transmise à un responsable",
                            emailBodySG);
                }

                resultMessage = "ENVOYÉ_RESPONSABLE_ET_SG";
            } else {
                // Cas sans responsable - envoi direct au secrétaire général
                reservationRepository.save(reservation);

                if (etablissement.getSecretaireGeneraleId() != null) {
                    User secretaire = userRepository.findById(etablissement.getSecretaireGeneraleId())
                            .orElseThrow(() -> new RuntimeException("Secrétaire général non trouvé"));

                    String emailBodySG = String.format(
                            "Madame, Monsieur,\n\n" +
                                    "Une nouvelle demande de réservation nécessite votre examen :\n\n" +
                                    "Détails de la demande :\n" +
                                    "- Espace : %s\n" +
                                    "- Demandeur : %s\n" +
                                    "- Date demandée : %s\n" +
                                    "- Motif : %s\n" +
                                    "- Équipements demandés : %s\n\n" +
                                    "Veuillez traiter cette demande dans les plus brefs délais.\n\n" +
                                    "Cordialement,\n" +
                                    "Système de Gestion des Réservations\n" +
                                    "%s",
                            espace.getNom(),
                            userRepository.findById(reservation.getDemandeurId()).orElseThrow().getNom(),
                            formattedDate,
                            reservation.getIntituleAction(),
                            reservation.getEquipements().isEmpty() ? "Aucun"
                                    : String.join(", ", reservation.getEquipements()),
                            etablissement.getNom());

                    emailService.sendEmail(
                            secretaire.getEmail(),
                            "Nouvelle demande de réservation - Action requise",
                            emailBodySG);
                }

                resultMessage = "ENVOYÉ_SG_SEUL";
            }

            return resultMessage;
        } catch (Exception e) {
            logger.error("Erreur lors de la transmission de la réservation: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur de transmission: " + e.getMessage());
        }
    }

    public String determineRecipient(String espaceId) {
        // 1. Récupération de l'espace
        Espace espace = espaceRepository.findById(espaceId)
                .orElseThrow(() -> new RuntimeException("Espace non trouvé"));

        // 2. Priorité au responsable d'espace
        if (espace.getResponsableId() != null && !espace.getResponsableId().isEmpty()) {
            return espace.getResponsableId();
        }

        // 3. Fallback au secrétaire d'établissement
        Etablissement etablissement = etablissementRepository.findById(espace.getEtablissementId())
                .orElseThrow(() -> new RuntimeException("Etablissement non trouvé"));

        if (etablissement.getSecretaireGeneraleId() == null) {
            throw new RuntimeException("Secrétaire général non configuré");
        }

        return etablissement.getSecretaireGeneraleId();
    }

    private void verifyCalendarAccess(String calendarId) throws IOException {
        try {
            // This will throw if calendar doesn't exist or isn't accessible
            googleCalendar.calendars().get(calendarId).execute();
        } catch (GoogleJsonResponseException e) {
            if (e.getStatusCode() == 404) {
                throw new IOException("Calendar not found: " + calendarId);
            }
            throw new IOException("Calendar access error: " + e.getMessage());
        }
    }
}
