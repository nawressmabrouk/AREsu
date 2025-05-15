package tn.sousse.univ.reservation_app.services;

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
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
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

    public boolean isEspaceDisponible(ObjectId espaceId, Date startDate, Date endDate) {
        Espace espace = espaceRepository.findById(espaceId.toString())
                .orElseThrow(() -> new RuntimeException("Espace not found"));

        // Use the espace's calendar ID if available, otherwise fall back to default
        String calendarId = espace.getGoogleCalendarId() != null ? espace.getGoogleCalendarId()
                : googleCalendarConfig.getCalendarId();

        return true;
    }

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




/*method nourhen */

// New version with same parameters as Method 2
public void processDecision(String reservationId, boolean accepted, 
                          List<String> approvedEquipments, String decidedBy) {
    // Original logic preserved exactly
    Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new RuntimeException("Reservation not found"));
    
    if (reservation.getStatut() != StatusReservation.EN_ATTENTE) {
        throw new IllegalStateException("Only pending reservations can be processed");
    }

    // NEW: Equipment handling (added without modifying existing flow)
    if (approvedEquipments == null) {
        approvedEquipments = Collections.emptyList();
    }
    if (accepted && !reservation.getEquipements().containsAll(approvedEquipments)) {
        throw new IllegalArgumentException("Approved equipment not in requested list");
    }

    // Original Google Calendar logic - completely unchanged
    if (accepted) {
        try {
            Espace espace = espaceRepository.findById(reservation.getEspaceId())
                    .orElseThrow(() -> new RuntimeException("Espace not found"));
            
            String calendarId = espace.getGoogleCalendarId() != null 
                    ? espace.getGoogleCalendarId()
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

    // NEW: Set equipment (added after original status setting)
    reservation.setApprovedEquipements(approvedEquipments);
    
    // Original updates - unchanged
    reservation.setDecideePar(decidedBy);
    reservationRepository.save(reservation);
    
    // NEW: Add notifications (after original save)
    sendNotificationsAndEmails(reservation, reservation.getStatut());
    
    // Original logging - unchanged
    logger.info("Reservation {} processed by {} - Decision: {}",
            reservationId,
            decidedBy,
            accepted ? "ACCEPTED" : "REJECTED");
}

// Keep original method for backward compatibility
public void processDecision(String reservationId, boolean accepted, String decidedBy) {
    processDecision(reservationId, accepted, Collections.emptyList(), decidedBy);
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
                String calendarId = espaceRepository.findById(reservation.getEspaceId())
                        .map(espace -> espace.getGoogleCalendarId() != null ? espace.getGoogleCalendarId()
                                : googleCalendarConfig.getCalendarId())
                        .orElse(googleCalendarConfig.getCalendarId());

                googleCalendarService.getGoogleCalendarClient()
                        .events()
                        .delete(calendarId, reservation.getGoogleCalendarEventId())
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