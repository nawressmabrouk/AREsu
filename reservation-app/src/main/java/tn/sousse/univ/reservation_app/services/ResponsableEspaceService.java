
package tn.sousse.univ.reservation_app.services;

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

import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;

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






    @Autowired
    private CalendarIntegrationService calendarIntegrationService;

 private static final Logger logger = LoggerFactory.getLogger(SecretaireGeneraleService.class);

 /* 
    public void processDecision(String reservationId, boolean accepted, String responsableId) {
        Reservation reservation = getReservationWithAuthorization(reservationId, responsableId);
        
        StatusReservation newStatus = accepted ? StatusReservation.ACCEPTÉE : StatusReservation.REFUSÉE;
        reservation.setStatut(newStatus);
        reservation.setDecideePar(responsableId);
        
        reservationRepository.save(reservation);
    }*/
 /*endpoint nawress  
       public void processDecision(String reservationId, boolean accepted, String decidedBy) {
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
   }*/




   //methode nourhen 

   // Updated method signature to include approvedEquipments
public void processDecision(String reservationId, boolean accepted, 
                          List<String> approvedEquipments, String decidedBy) {
    Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new RuntimeException("Reservation not found"));
    
    if (reservation.getStatut() != StatusReservation.EN_ATTENTE) {
        throw new IllegalStateException("Only pending reservations can be processed");
    }

    // Handle equipment validation (like Method 2)
    if (accepted) {
        try {
            // Equipment validation
            if (approvedEquipments == null) {
                approvedEquipments = Collections.emptyList();
            }
            if (!reservation.getEquipements().containsAll(approvedEquipments)) {
                throw new IllegalArgumentException("Approved equipment not in requested list");
            }

            Espace espace = espaceRepository.findById(reservation.getEspaceId())
                    .orElseThrow(() -> new RuntimeException("Espace not found"));
            
            // Google Calendar integration
            String calendarId = espace.getGoogleCalendarId() != null 
                    ? espace.getGoogleCalendarId()
                    : googleCalendarConfig.getCalendarId();
            
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
            reservation.setApprovedEquipements(approvedEquipments); // Set approved equipment
            
        } catch (Exception e) {
            logger.error("Failed to process reservation acceptance", e);
            throw new RuntimeException("Failed to process reservation acceptance", e);
        }
    } else {
        reservation.setStatut(StatusReservation.REFUSÉE);
        reservation.setApprovedEquipements(Collections.emptyList()); // Empty list on rejection
    }

    reservation.setDecideePar(decidedBy);
    reservationRepository.save(reservation);
    
    // Reuse notification logic from Method 2
    sendNotificationsAndEmails(reservation, reservation.getStatut());
    
    logger.info("Reservation {} processed by {} - Decision: {}",
            reservationId,
            decidedBy,
            accepted ? "ACCEPTED" : "REJECTED");
}



private void sendNotificationsAndEmails(Reservation reservation, StatusReservation status) {
    // Récupération des données nécessaires
    User demandeur = userRepository.findById(reservation.getDemandeurId()).orElseThrow();
    Espace espace = espaceRepository.findById(reservation.getEspaceId()).orElseThrow();
    Etablissement etablissement = etablissementRepository.findById(espace.getEtablissementId())
                                  .orElseThrow();

    // Notification au demandeur
    String statusMessage = status == StatusReservation.ACCEPTÉE ? "acceptée" : "refusée";
    notificationService.sendNotification(
        reservation.getDemandeurId(),
        "Votre réservation a été " + statusMessage + " par le responsable",
        reservation.getId()
    );

    // Email au demandeur avec les équipements approuvés
    emailService.sendStatusEmailWithEquipment(
        demandeur.getEmail(),
        demandeur.getNom(),
        espace.getNom(),
        status.toString(),
        reservation.getApprovedEquipements()
    );

    // Notification au secrétaire
    String sgId = etablissement.getSecretaireGeneraleId();
    notificationService.sendNotification(
        sgId,
        "Réservation " + statusMessage + " par le responsable",
        reservation.getId()
    );

    // Email au secrétaire
    User secretaire = userRepository.findById(sgId).orElseThrow();
    emailService.sendEmail(
        secretaire.getEmail(),
        "Décision sur une réservation",
        "Une réservation a été " + statusMessage + " par un responsable. " +
        "ID Réservation: " + reservation.getId()
    );
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
          if(new Date().after(reservation.getHeureDebut())) {
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
    
    if(reservation.getStatut() != StatusReservation.ACCEPTÉE) {
        throw new IllegalStateException("Seules les réservations acceptées peuvent être annulées");
    }
    
    if(new Date().after(reservation.getHeureDebut())) {
        throw new IllegalStateException("Impossible d'annuler après la date de début");
    }
    
    reservation.setStatut(StatusReservation.ANNULÉE);
    reservation.setAnnulationReason(reason);
    reservation.setDecideePar(responsableId);
    
   
   
   
   
   
   
   
   
    
    reservationRepository.save(reservation);
    notificationService.sendNotification(
        reservation.getDemandeurId(),
        "Annulation de réservation",
        "Votre réservation a été annulée par le responsable. Raison : " + reason
    );




}
 /*  public Reservation findReservationById(String reservationId) {
      return reservationRepository.findById(reservationId)
              .orElseThrow(() -> new RuntimeException("Reservation not found"));
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
  }*/




  
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
