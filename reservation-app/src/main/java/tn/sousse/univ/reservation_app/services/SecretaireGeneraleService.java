package tn.sousse.univ.reservation_app.services;

import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;

import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.config.GoogleCalendarConfig;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.EtablissementRepository;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;
import tn.sousse.univ.reservation_app.repositories.UserRepository;

@Service
public class SecretaireGeneraleService {

    private static final Logger logger = LoggerFactory.getLogger(SecretaireGeneraleService.class);

    @Autowired
    private ReservationRepository reservationRepository;


 @Autowired
    private UserRepository userRepository; 
    
    
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private GoogleCalendarService googleCalendarService;
   @Autowired
    private EmailService emailService;
    @Autowired
    private EspaceRepository espaceRepository;
    
    @Autowired
    private GoogleCalendarConfig googleCalendarConfig;

    @Autowired
private EtablissementRepository etablissementRepository;
    
    // Getter methods
    public List<Reservation> getReservationsViewedBySG() {
        return reservationRepository.findAll().stream()
                .filter(reservation -> hasResponsable(reservation.getEspaceId()) &&
                        Boolean.TRUE.equals(reservation.getVueParSecretaire()))
                .toList();
    }

    public List<Reservation> getReservationsToViewBySG() {
        return reservationRepository.findAll().stream()
                .filter(reservation -> hasResponsable(reservation.getEspaceId()) &&
                        Boolean.FALSE.equals(reservation.getVueParSecretaire()))
                .toList();
    }

    public List<Reservation> getReservationsToHandleBySG() {
        return reservationRepository.findAll().stream()
                .filter(reservation -> !hasResponsable(reservation.getEspaceId()) &&
                        reservation.getStatut().equals(StatusReservation.EN_ATTENTE))
                .toList();
    }
 
/* public boolean isEspaceDisponible(ObjectId espaceId, Date startDate, Date endDate) {
    Espace espace = espaceRepository.findById(espaceId.toString())
            .orElseThrow(() -> new RuntimeException("Espace not found"));

    // Get the establishment's calendar ID
    Etablissement etab = etablissementRepository.findById(espace.getEtablissementId())
            .orElseThrow(() -> new RuntimeException("Etablissement not found"));
    
    if (etab.getGoogleCalendarId() == null) {
        throw new IllegalStateException("Etablissement has no calendar assigned");
    }

    try {
        Calendar service = getCalendarService();
        Events events = service.events().list(etab.getGoogleCalendarId())
                .setTimeMin(new DateTime(startDate))
                .setTimeMax(new DateTime(endDate))
                .setSingleEvents(true)
                .execute();
        
        return events.getItems().isEmpty();
    } catch (GeneralSecurityException | IOException e) {
        logger.error("Error checking space availability", e);
        throw new RuntimeException("Failed to check availability", e);
    }
}*/ 
 

    public List<Reservation> suivreReservationsParStatut(String statut) {
        return reservationRepository.findByStatut(statut);
    }

    public List<Reservation> suivreReservations() {
        return reservationRepository.findAll();
    }

    public boolean hasResponsable(String espaceId) {
        return espaceRepository.findById(espaceId)
                .map(espace -> espace.getResponsableId() != null)
                .orElse(false);
    }

    public void viewReservation(Reservation reservation) {
        reservation.setVueParSecretaire(true);
        reservationRepository.save(reservation);
        logger.info("Reservation viewed by SG: {}", reservation.getId());
    }

    public void handleReservation(Reservation reservation, boolean accepted) {
        reservation.setStatut(accepted ? StatusReservation.ACCEPTÉE : StatusReservation.REFUSÉE);
        reservation.setDecideePar("SecretaireGenerale");
        reservation.setVueParSecretaire(true);
        reservationRepository.save(reservation);

        notificationService.sendNotification(
                reservation.getDemandeurId(),
                "Votre demande a été " + (accepted ? "acceptée" : "refusée") + " par le Secrétaire Général.",
                reservation.getId());
    }

 /*methode nawress    public void processDecision(String reservationId, boolean accepted, String decidedBy) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (reservation.getStatut() != StatusReservation.EN_ATTENTE) {
            throw new IllegalStateException("Only pending reservations can be processed");
        }

        if (accepted) {
            try {
                Espace espace = espaceRepository.findById(reservation.getEspaceId())
                        .orElseThrow(() -> new RuntimeException("Espace not found"));

                // Determine which calendar to use
                String calendarId = espace.getGoogleCalendarId() != null ? espace.getGoogleCalendarId()
                        : googleCalendarConfig.getCalendarId();

                if (!isEspaceDisponible(new ObjectId(reservation.getEspaceId()),
                        reservation.getHeureDebut(),
                        reservation.getHeureFin())) {
                    throw new IllegalStateException("Space is not available for the requested time");
                }

                Event event = new Event()
                        .setSummary(reservation.getIntituleAction())
                        .setDescription(reservation.getDescription())
                        .setStart(new EventDateTime().setDateTime(new DateTime(reservation.getHeureDebut())))
                        .setEnd(new EventDateTime().setDateTime(new DateTime(reservation.getHeureFin())));

                Event createdEvent = googleCalendarService.getGoogleCalendarClient()
                        .events()
                        .insert(calendarId, event)
                        .execute();

                reservation.setStatut(StatusReservation.ACCEPTÉE);
                reservation.setGoogleCalendarEventId(createdEvent.getId());

            } catch (Exception e) {
                logger.error("Failed to create calendar event", e);
                throw new RuntimeException("Failed to process reservation acceptance", e);
            }
        } else {
            reservation.setStatut(StatusReservation.REFUSÉE);
        }

        reservation.setDecideePar(decidedBy);

        reservationRepository.save(reservation);

        String message = accepted ? "Your reservation has been accepted by " + decidedBy
                : "Your reservation has been rejected by " + decidedBy;

        logger.info("Reservation {} processed by {} - Decision: {}",
                reservationId,
                decidedBy,
                accepted ? "ACCEPTED" : "REJECTED");
    }
*/




public void ensureEtablissementIdExists(Reservation reservation) {
    if (reservation.getEtablissementId() == null) {
        Espace espace = espaceRepository.findById(reservation.getEspaceId())
                .orElseThrow(() -> new RuntimeException("Espace not found"));
        reservation.setEtablissementId(espace.getEtablissementId());
        reservationRepository.save(reservation);
    }
}

public void processDecision(String reservationId, boolean accepted, 
                         List<String> approvedEquipments, String decidedBy) {
    // Debug 1: Log input parameters
    logger.debug("Starting processDecision with params - reservationId: {}, accepted: {}, decidedBy: {}, approvedEquipments: {}", 
                reservationId, accepted, decidedBy, approvedEquipments);

    Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> {
                logger.error("Reservation not found for ID: {}", reservationId);
                return new RuntimeException("Reservation not found");
            });
    
    // Debug 2: Log basic reservation info
    logger.debug("Found reservation - ID: {}, Status: {}, EtablissementId: {}, EspaceId: {}", 
               reservation.getId(), 
               reservation.getStatut(),
               reservation.getEtablissementId(),
               reservation.getEspaceId());

    if (reservation.getStatut() != StatusReservation.EN_ATTENTE) {
        logger.warn("Reservation {} is not in EN_ATTENTE status. Current status: {}", 
                   reservationId, reservation.getStatut());
        throw new IllegalStateException("Only pending reservations can be processed");
    }

    if (approvedEquipments == null) {
        approvedEquipments = Collections.emptyList();
        logger.debug("Approved equipments was null, set to empty list");
    }
    
    if (accepted && !reservation.getEquipements().containsAll(approvedEquipments)) {
        logger.error("Equipment validation failed. Requested: {}, Approved: {}", 
                   reservation.getEquipements(), approvedEquipments);
        throw new IllegalArgumentException("Approved equipment not in requested list");
    }

    if (accepted) {
        try {
            logger.info("Processing acceptance for reservation: {}", reservationId);
            
            // Debug 3: Before etablissement lookup
            String etablissementId = reservation.getEtablissementId();
            logger.debug("Looking up etablissement with ID: {}", etablissementId);
            
            if (etablissementId == null) {
                logger.error("Reservation {} has null etablissementId", reservationId);
                throw new IllegalStateException("Reservation has no etablissementId assigned");
            }

            Etablissement etab = etablissementRepository.findById(etablissementId)
                    .orElseThrow(() -> {
                        logger.error("Etablissement not found for id: {}", etablissementId);
                        return new RuntimeException("Etablissement not found for id: " + etablissementId);
                    });
            
            // Debug 4: Etablissement found
            logger.debug("Found etablissement - ID: {}, Name: {}, CalendarID: {}", 
                         etab.getId(), etab.getNom(), etab.getGoogleCalendarId());
            
            if (etab.getGoogleCalendarId() == null || etab.getGoogleCalendarId().isEmpty()) {
                logger.error("No calendar ID configured for etablissement: {}", etab.getId());
                throw new IllegalStateException("Etablissement has no calendar assigned");
            }
            
            // Debug 5: Before event creation
            logger.debug("Creating calendar event for reservation {} with times: {} to {}", 
                        reservationId, reservation.getHeureDebut(), reservation.getHeureFin());
            
            Event event = new Event()
                    .setSummary(reservation.getIntituleAction())
                    .setDescription(reservation.getDescription())
                    .setStart(new EventDateTime().setDateTime(new DateTime(reservation.getHeureDebut())))
                    .setEnd(new EventDateTime().setDateTime(new DateTime(reservation.getHeureFin())));
            
            // Debug 6: Before Google Calendar API call
            logger.debug("Inserting event into calendar: {}", etab.getGoogleCalendarId());
            
            Event createdEvent = googleCalendarService.getGoogleCalendarClient()
                    .events()
                    .insert(etab.getGoogleCalendarId(), event)
                    .setFields("id")
                    .execute();
            
            if (createdEvent == null || createdEvent.getId() == null) {
                logger.error("Google Calendar returned null event or null event ID");
                throw new RuntimeException("Failed to create calendar event - no event ID returned");
            }
            
            logger.info("Successfully created calendar event with ID: {}", createdEvent.getId());
            
            reservation.setStatut(StatusReservation.ACCEPTÉE);
            reservation.setGoogleCalendarEventId(createdEvent.getId());
            
        } catch (Exception e) {
            logger.error("Failed to process reservation acceptance for ID: {}", reservationId, e);
            throw new RuntimeException("Failed to process reservation acceptance: " + e.getMessage(), e);
        }
    } else {
        reservation.setStatut(StatusReservation.REFUSÉE);
        logger.debug("Reservation {} set to REFUSÉE status", reservationId);
    }

    // Debug 7: Before saving reservation
    logger.debug("Updating reservation with approved equipments: {} and decidedBy: {}", 
                approvedEquipments, decidedBy);
    
    reservation.setApprovedEquipements(approvedEquipments);
    reservation.setDecideePar(decidedBy);
    reservationRepository.save(reservation);
    
    try {
        logger.debug("Sending notifications for reservation {}", reservationId);
        sendNotificationsAndEmails(reservation, reservation.getStatut());
    } catch (Exception e) {
        logger.error("Failed to send notifications for reservation: {}", reservationId, e);
    }
    
    logger.info("Reservation {} processed by {} - Decision: {}",
            reservationId,
            decidedBy,
            accepted ? "ACCEPTED" : "REJECTED");
}

    
private void sendNotificationsAndEmails(Reservation reservation, StatusReservation status) {
    User demandeur = userRepository.findById(reservation.getDemandeurId()).orElseThrow();
    Espace espace = espaceRepository.findById(reservation.getEspaceId())
            .orElseThrow(() -> new NoSuchElementException("Espace non trouvé"));

    // Notification
    String statusMessage = status == StatusReservation.ACCEPTÉE ? "acceptée" : "refusée";
    notificationService.sendNotification(
            reservation.getDemandeurId(),
            "Votre réservation a été " + statusMessage + " par le secrétaire général",
            reservation.getId()
    );

    // Email avec équipements
    emailService.sendStatusEmailWithEquipment(
            demandeur.getEmail(),
            demandeur.getNom(),
            espace.getNom(),
            status.toString(),
            reservation.getApprovedEquipements()
    );
}

    public Reservation findReservationById(String reservationId) {
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
    }

    public List<Reservation> getReservationsAcceptedBySG() {
        return reservationRepository.findByStatut(StatusReservation.ACCEPTÉE)
                .stream()
                .filter(reservation -> "SecretaireGenerale".equals(reservation.getDecideePar()) &&
                        !hasResponsable(reservation.getEspaceId()))
                .toList();
    }

    public List<Reservation> getReservationsRefusedBySG() {
        return reservationRepository.findByStatut(StatusReservation.REFUSÉE)
                .stream()
                .filter(reservation -> "SecretaireGenerale".equals(reservation.getDecideePar()) &&
                        !hasResponsable(reservation.getEspaceId()))
                .toList();
    }

public void annulerReservation(String reservationId, String reason) {
    Reservation reservation = findReservationById(reservationId);
    if (reservation.getStatut() != StatusReservation.ACCEPTÉE) {
        throw new IllegalStateException("Only accepted reservations can be cancelled");
    }
    if (new Date().after(reservation.getHeureDebut())) {
        throw new IllegalStateException("Cannot cancel after start time");
    }
    
    try {
        if (reservation.getGoogleCalendarEventId() != null) {
            // Get the establishment's calendar ID
            Etablissement etab = etablissementRepository.findById(reservation.getEtablissementId())
                    .orElseThrow(() -> new RuntimeException("Etablissement not found"));
            
            if (etab.getGoogleCalendarId() == null) {
                throw new IllegalStateException("Etablissement has no calendar assigned");
            }
            
            googleCalendarService.getGoogleCalendarClient()
                    .events()
                    .delete(etab.getGoogleCalendarId(), reservation.getGoogleCalendarEventId())
                    .execute();
        }
    } catch (Exception e) {
        logger.error("Failed to delete calendar event", e);
    }
    
    reservation.setStatut(StatusReservation.ANNULÉE);
    reservation.setAnnulationReason(reason);
    reservation.setDecideePar("SecretaireGenerale");
    reservationRepository.save(reservation);
    
    notificationService.sendNotification(
            reservation.getDemandeurId(),
            "Annulation de réservation",
            "Votre réservation a été annulée par le secrétaire général. Raison : " + reason);
}

    public boolean canCancelReservation(Reservation reservation) {
        return reservation.getStatut() == StatusReservation.ACCEPTÉE
                && new Date().before(reservation.getHeureDebut());
    }
    
}