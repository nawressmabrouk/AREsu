package tn.sousse.univ.reservation_app.services;

import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
public class SecretaireGeneraleService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;
 

    @Autowired
    private GoogleCalendarService googleCalendarService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private EspaceRepository espaceRepository;
    

    @Autowired
    private EtablissementRepository etablissementRepository;
    private static final Logger logger = LoggerFactory.getLogger(SecretaireGeneraleService.class);

  

    //Retrieves reservations already viewed by the secretary general for an establishment.
public List<Reservation> getReservationsViewedBySG(String etablissementId) {
    return reservationRepository.findAll().stream()
            .filter(reservation -> 
                hasResponsable(reservation.getEspaceId()) &&
                Boolean.TRUE.equals(reservation.getVueParSecretaire()) &&
                etablissementId.equals(reservation.getEtablissementId())
            )
            .toList();
}


// Gets reservations not yet viewed by the secretary general for an establishment.
public List<Reservation> getReservationsToViewBySG(String etablissementId) {
    return reservationRepository.findAll().stream()
            .filter(reservation -> 
                hasResponsable(reservation.getEspaceId()) &&
                Boolean.FALSE.equals(reservation.getVueParSecretaire()) &&
                etablissementId.equals(reservation.getEtablissementId())
            )
            .toList();
}


// Fetches pending reservations without a responsible that need SG handling.
public List<Reservation> getReservationsToHandleBySG(String etablissementId) {
    return reservationRepository.findAll().stream()
            .filter(reservation -> 
                !hasResponsable(reservation.getEspaceId()) &&
                reservation.getStatut().equals(StatusReservation.EN_ATTENTE) &&
                etablissementId.equals(reservation.getEtablissementId())
            )
            .toList();
}
   


//Returns reservations filtered by status.
    public List<Reservation> suivreReservationsParStatut(String statut) {
        return reservationRepository.findByStatut(statut);
    }
  
  //Checks if a space has an assigned responsible.
    public boolean hasResponsable(String espaceId) {
        return espaceRepository.findById(espaceId)
                .map(espace -> espace.getResponsableId() != null)
                .orElse(false);
    }


    //Marks a reservation as viewed by the secretary general.
    public void viewReservation(Reservation reservation) {
        reservation.setVueParSecretaire(true);
        reservationRepository.save(reservation);
        logger.info("Reservation viewed by SG: {}", reservation.getId());
    }


    //Processes reservation acceptance/rejection by the secretary general.
    public void handleReservation(Reservation reservation, boolean accepted) {
        reservation.setStatut(accepted ? StatusReservation.ACCEPTÉE : StatusReservation.REFUSÉE);
        reservation.setDecideePar("SecretaireGenerale");
        reservation.setVueParSecretaire(true);
        reservationRepository.save(reservation);
    
    }

  // Ensures a reservation has an associated establishment ID.
    public void ensureEtablissementIdExists(Reservation reservation) {
        if (reservation.getEtablissementId() == null) {
            Espace espace = espaceRepository.findById(reservation.getEspaceId())
                    .orElseThrow(() -> new RuntimeException("Espace not found"));
            reservation.setEtablissementId(espace.getEtablissementId());
            reservationRepository.save(reservation);
        }
    }
// Handles reservation decision with Google Calendar integration.
    public void processDecision(String reservationId,
            boolean accepted,
            List<String> approvedEquipements,
            String decidedBy) {
        //  Load the reservation
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found: " + reservationId));
        if (accepted && approvedEquipements != null) {
            if (!reservation.getEquipements().containsAll(approvedEquipements)) {
                throw new IllegalArgumentException("Équipements approuvés non inclus dans la demande");
            }
            reservation.setApprovedEquipements(approvedEquipements); // ← Ligne manquante
        } else {
            reservation.setApprovedEquipements(Collections.emptyList());
        }

        //  Ensure the établissementId is set on the reservation
        if (reservation.getEtablissementId() == null) {
            Espace espace = espaceRepository.findById(reservation.getEspaceId())
                    .orElseThrow(() -> new RuntimeException("Espace not found: " + reservation.getEspaceId()));
            reservation.setEtablissementId(espace.getEtablissementId());
            reservationRepository.save(reservation);
        }

        //  Load the établissement and its Google Calendar ID
        Etablissement etab = etablissementRepository.findById(reservation.getEtablissementId())
                .orElseThrow(
                        () -> new RuntimeException("Etablissement not found: " + reservation.getEtablissementId()));
        String calendarId = etab.getGoogleCalendarId();
        if (calendarId == null || calendarId.isEmpty()) {
            throw new IllegalStateException("No Google Calendar configured for établissement: " + etab.getNom());
        }
        if (accepted) {
            if (approvedEquipements == null) {
                approvedEquipements = Collections.emptyList();
            }
            reservation.setApprovedEquipements(approvedEquipements);
        } else {
            reservation.setApprovedEquipements(Collections.emptyList());
        }
        //  If accepted, push into the calendar and make it visible
        if (accepted) {
            try {
                // confirmReservation will wrap any checked exceptions in a RuntimeException
                googleCalendarService.confirmReservation(reservation.getId());
                // forceCalendarDisplay may throw checked exceptions internally—caught below
                googleCalendarService.forceCalendarDisplay(calendarId);
            } catch (Exception e) {
                logger.error("Failed to sync reservation {} into Google Calendar {}", reservationId, calendarId, e);
                throw new RuntimeException("Error while pushing to Google Calendar", e);
            }
            reservation.setStatut(StatusReservation.ACCEPTÉE);
        } else {
            reservation.setStatut(StatusReservation.REFUSÉE);
        }

        //  Record the decision and save
        reservation.setDecideePar(decidedBy);
        reservationRepository.save(reservation);
        sendNotificationsAndEmails(reservation, reservation.getStatut());

    }


    //Sends email notifications about reservation status.
    private void sendNotificationsAndEmails(Reservation reservation, StatusReservation status) {
        User demandeur = userRepository.findById(reservation.getDemandeurId()).orElseThrow();
        Espace espace = espaceRepository.findById(reservation.getEspaceId())
                .orElseThrow(() -> new NoSuchElementException("Espace non trouvé"));

        // Get the establishment
        Etablissement etab = etablissementRepository.findById(reservation.getEtablissementId())
                .orElseThrow(() -> new NoSuchElementException("Établissement non trouvé"));

       
       

        String subject = "Confirmation de votre demande de réservation";
        String body = String.format(
                "Bonjour,\n\n" +
                        "Nous avons le plaisir de vous informer que votre demande de réservation pour l'espace \"%s\" a été %s.\n\n"
                        +
                        "Équipements approuvés : %s\n\n" +
                        "Cordialement,\nLe Secrétariat Général\n%s",
                espace.getNom(),
                (status == StatusReservation.ACCEPTÉE ? "acceptée" : "refusée"),
                reservation.getApprovedEquipements().isEmpty() ? "Aucun équipement approuvé"
                        : String.join(", ", reservation.getApprovedEquipements()),
                etab.getNom() 
        );

        emailService.sendEmail(demandeur.getEmail(), subject, body);
    }


    // Finds a reservation by ID or throws exception.
    public Reservation findReservationById(String reservationId) {
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
    }


    //Gets reservations accepted by the secretary general.
    public List<Reservation> getReservationsAcceptedBySG() {
        return reservationRepository.findByStatut(StatusReservation.ACCEPTÉE)
                .stream()
                .filter(reservation -> "SecretaireGenerale".equals(reservation.getDecideePar()) &&
                        !hasResponsable(reservation.getEspaceId()))
                .toList();
    }
  
    //Gets reservations refused by the secretary general.
    public List<Reservation> getReservationsRefusedBySG() {
        return reservationRepository.findByStatut(StatusReservation.REFUSÉE)
                .stream()
                .filter(reservation -> "SecretaireGenerale".equals(reservation.getDecideePar()) &&
                        !hasResponsable(reservation.getEspaceId()))
                .toList();
    }


    // Cancels a reservation and removes its Google Calendar event.
    public void annulerReservation(String reservationId, String reason) {
        Reservation reservation = findReservationById(reservationId);
        if (reservation.getStatut() != StatusReservation.ACCEPTÉE) {
            throw new IllegalStateException("Only accepted reservations can be cancelled");
        }
        if (new Date().after(reservation.getHeureDebut())) {
            throw new IllegalStateException("Cannot cancel after start time");
        }

        try {
            if (reservation.getGoogleEventId() != null) {
                // Get the establishment's calendar ID
                Etablissement etab = etablissementRepository.findById(reservation.getEtablissementId())
                        .orElseThrow(() -> new RuntimeException("Etablissement not found"));

                if (etab.getGoogleCalendarId() == null) {
                    throw new IllegalStateException("Etablissement has no calendar assigned");
                }

                googleCalendarService.getGoogleCalendarClient()
                        .events()
                        .delete(etab.getGoogleCalendarId(), reservation.getGoogleEventId())
                        .execute();
            }
        } catch (Exception e) {
            logger.error("Failed to delete calendar event", e);
        }

        reservation.setStatut(StatusReservation.ANNULÉE);
        reservation.setAnnulationReason(reason);
        reservation.setDecideePar("SecretaireGenerale");
        reservationRepository.save(reservation);

     

        // Get establishment for email
        Etablissement etab = etablissementRepository.findById(reservation.getEtablissementId())
                .orElseThrow(() -> new RuntimeException("Etablissement not found"));

        // Send email
        String subject = "Annulation de votre réservation";
        String body = String.format(
                "Bonjour,\n\n" +
                        "Votre réservation pour l'espace \"%s\" a été annulée par le secrétaire général.\n\n" +
                        "Raison : %s\n\n" +
                        "Cordialement,\nLe Secrétariat Général\n%s",
                espaceRepository.findById(reservation.getEspaceId()).orElseThrow().getNom(),
                reason,
                etab.getNom());

        emailService.sendEmail(
                userRepository.findById(reservation.getDemandeurId()).orElseThrow().getEmail(),
                subject,
                body);

    }


    //Checks if a reservation is eligible for cancellation.
    public boolean canCancelReservation(Reservation reservation) {
        return reservation.getStatut() == StatusReservation.ACCEPTÉE
                && new Date().before(reservation.getHeureDebut());
    }

}