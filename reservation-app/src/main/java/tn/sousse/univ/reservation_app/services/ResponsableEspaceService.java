package tn.sousse.univ.reservation_app.services;

import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.config.GoogleCalendarConfig;
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
public class ResponsableEspaceService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private EtablissementRepository etablissementRepository;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private GoogleCalendarService googleCalendarService;

    @Autowired
    private EspaceRepository espaceRepository;

    @Autowired
    private GoogleCalendarConfig googleCalendarConfig;
    @Autowired
    private EmailService emailService;

    private static final Logger logger = LoggerFactory.getLogger(ResponsableEspaceService.class);

    public void processDecision(String reservationId,
            boolean accepted,
            List<String> approvedEquipements,
            String decidedBy) {
        // 1) load the reservation
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable: " + reservationId));
        // Ajoutez cette validation des équipements
        if (accepted && approvedEquipements != null) {
            if (!reservation.getEquipements().containsAll(approvedEquipements)) {
                throw new IllegalArgumentException("Équipements approuvés non inclus dans la demande");
            }
            reservation.setApprovedEquipements(approvedEquipements); // ← Ligne manquante
        } else {
            reservation.setApprovedEquipements(Collections.emptyList());
        }
        // 2) ensure établissementId is populated
        if (reservation.getEtablissementId() == null) {
            Espace espace = espaceRepository.findById(reservation.getEspaceId())
                    .orElseThrow(() -> new RuntimeException("Espace introuvable: " + reservation.getEspaceId()));
            reservation.setEtablissementId(espace.getEtablissementId());
            reservationRepository.save(reservation);
        }

        // 3) fetch the établissement’s calendar
        Etablissement etab = etablissementRepository.findById(reservation.getEtablissementId())
                .orElseThrow(
                        () -> new RuntimeException("Établissement introuvable: " + reservation.getEtablissementId()));
        String calendarId = etab.getGoogleCalendarId();
        if (calendarId == null || calendarId.isEmpty()) {
            throw new IllegalStateException("Pas de calendrier Google configuré pour: " + etab.getNom());
        }
        if (accepted) {
            if (approvedEquipements == null) {
                approvedEquipements = Collections.emptyList();
            }
            reservation.setApprovedEquipements(approvedEquipements);
        } else {
            reservation.setApprovedEquipements(Collections.emptyList());
        }
        // 4) if accepted, push to Google Calendar & make visible
        if (accepted) {
            try {
                googleCalendarService.confirmReservation(reservation.getId());
                googleCalendarService.forceCalendarDisplay(calendarId);
            } catch (Exception e) {
                logger.error("Échec sync réservation {} → calendrier {}", reservationId, calendarId, e);
                throw new RuntimeException("Erreur lors de l’ajout au calendrier Google", e);
            }
            reservation.setStatut(StatusReservation.ACCEPTÉE);
        } else {
            reservation.setStatut(StatusReservation.REFUSÉE);
        }

        // 5) record who decided and save
        reservation.setDecideePar(decidedBy);
        reservationRepository.save(reservation);

        sendNotificationsAndEmails(reservation, reservation.getStatut());
    }

    private void sendNotificationsAndEmails(Reservation reservation, StatusReservation status) {
        // Récupération des données
        User demandeur = userRepository.findById(reservation.getDemandeurId())
                .orElseThrow(() -> new NoSuchElementException("Demandeur non trouvé"));

        Espace espace = espaceRepository.findById(reservation.getEspaceId())
                .orElseThrow(() -> new NoSuchElementException("Espace non trouvé"));

        Etablissement etablissement = etablissementRepository.findById(reservation.getEtablissementId())
                .orElseThrow(() -> new NoSuchElementException("Établissement non trouvé"));

        // Formatage des messages
        String statusMessage = status == StatusReservation.ACCEPTÉE ? "acceptée" : "refusée";
        String formattedDate = new SimpleDateFormat("dd/MM/yyyy 'à' HH:mm").format(reservation.getHeureDebut());

        // 1. Notification au demandeur
        notificationService.sendNotification(
                reservation.getDemandeurId(),
                "Décision sur votre réservation - " + espace.getNom(),
                "Votre demande pour le " + formattedDate + " a été " + statusMessage + " par le responsable");

        // 2. Email au demandeur
        String demandeurSubject = "Décision sur votre réservation - " + espace.getNom();
        String demandeurBody = String.format(
                "Bonjour,\n\n" +
                        "Nous avons le plaisir de vous informer que votre demande de réservation pour l'espace \"%s\" a été %s.\n\n"
                        +
                        "- Équipements approuvés : %s\n\n" +
                        "Cordialement,\n" +
                        "Le Responsable d'Espace demandée\n%s",
                espace.getNom(),
                statusMessage,
                reservation.getApprovedEquipements().isEmpty() ? "Aucun équipement approuvé"
                        : String.join(", ", reservation.getApprovedEquipements()),
                etablissement.getNom());
        emailService.sendEmail(demandeur.getEmail(), demandeurSubject, demandeurBody);

        // 3. Notification au secrétaire général
        notificationService.sendNotification(
                etablissement.getSecretaireGeneraleId(),
                "Décision prise sur réservation #" + reservation.getId(),
                "Le responsable a " + statusMessage + " une réservation pour " + espace.getNom());

    }

    public List<Reservation> getAllReservationsByResponsable(String responsableId) {
        List<String> espaceIds = getEspaceIdsByResponsable(responsableId);
        return reservationRepository.findByEspaceIdIn(espaceIds);
    }

    public List<Reservation> getReservationsByResponsableAndStatus(String responsableId, StatusReservation status) {
        List<String> espaceIds = getEspaceIdsByResponsable(responsableId);
        return reservationRepository.findByEspaceIdInAndStatut(espaceIds, status);
    }

    private Reservation getReservationWithAuthorization(String reservationId, String responsableId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new NoSuchElementException("Réservation non trouvée"));

        Espace espace = espaceRepository.findById(reservation.getEspaceId())
                .orElseThrow(() -> new NoSuchElementException("Espace non trouvé"));

        if (!espace.getResponsableId().equals(responsableId)) {
            throw new SecurityException("Accès non autorisé à cette réservation");
        }
        if (new Date().after(reservation.getHeureDebut())) {
            throw new IllegalStateException("Impossible de modifier une réservation passée");
        }
        return reservation;
    }

    private List<String> getEspaceIdsByResponsable(String responsableId) {
        return espaceRepository.findByResponsableId(responsableId)
                .stream()
                .map(Espace::getId)
                .toList();
    }

    public void annulerReservation(String reservationId, String responsableId, String reason) {
        Reservation reservation = getReservationWithAuthorization(reservationId, responsableId);

        if (reservation.getStatut() != StatusReservation.ACCEPTÉE) {
            throw new IllegalStateException("Seules les réservations acceptées peuvent être annulées");
        }

        if (new Date().after(reservation.getHeureDebut())) {
            throw new IllegalStateException("Impossible d'annuler après la date de début");
        }

        reservation.setStatut(StatusReservation.ANNULÉE);
        reservation.setAnnulationReason(reason);
        reservation.setDecideePar(responsableId);

        reservationRepository.save(reservation);
        notificationService.sendNotification(
                reservation.getDemandeurId(),
                "Annulation de réservation",
                "Votre réservation a été annulée par le responsable. Raison : " + reason);

    }

    public List<Espace> getEspacesByResponsable(String responsableId) {
        return espaceRepository.findByResponsableId(responsableId);
    }

    public Espace updateEspace(String espaceId, Espace updatedEspace, String responsableId) {
        Espace espace = espaceRepository.findById(espaceId)
                .orElseThrow(() -> new NoSuchElementException("Espace non trouvé"));

        if (!espace.getResponsableId().equals(responsableId)) {
            throw new SecurityException("Vous n'êtes pas autorisé à modifier cet espace");
        }

        // Update only allowed fields
        espace.setNom(updatedEspace.getNom());
        espace.setDisponibilite(updatedEspace.isDisponibilite());
        espace.setCapacite(updatedEspace.getCapacite());
        espace.setEquipement(updatedEspace.getEquipement());
        espace.setType(updatedEspace.getType());
        espace.setCategorie(updatedEspace.getCategorie());
        espace.setEquipementsDisponibles(updatedEspace.getEquipementsDisponibles());

        return espaceRepository.save(espace);
    }

    public void deleteEspace(String espaceId, String responsableId) {
        Espace espace = espaceRepository.findById(espaceId)
                .orElseThrow(() -> new NoSuchElementException("Espace non trouvé"));

        if (!espace.getResponsableId().equals(responsableId)) {
            throw new SecurityException("Vous n'êtes pas autorisé à supprimer cet espace");
        }

        espaceRepository.delete(espace);
    }

}