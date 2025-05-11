
package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;

@Service
public class SecretaireGeneraleService {

    @Autowired
    private ReservationRepository reservationRepository;

   

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private GoogleCalendarService googleCalendarService;

    @Autowired
    private EspaceRepository espaceRepository;

   
      private static final Logger logger = LoggerFactory.getLogger(SecretaireGeneraleService.class);
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
        try {
            return googleCalendarService.isEspaceDisponible(espaceId, startDate, endDate);
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
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
    System.out.println("Visa effectué pour la réservation ID : " + reservation.getId());
}

    public void handleReservation(Reservation reservation) {
        // logique de décision du SG (ex. manuellement ou automatiquement)
        boolean accepted = true; // ou false selon le contexte

        reservation.setStatut(accepted ? StatusReservation.ACCEPTÉE : StatusReservation.REFUSÉE);
        reservation.setDecideePar("SecretaireGenerale");
        reservation.setVueParSecretaire(true); // Si SG traite, il fait aussi le visa
        reservationRepository.save(reservation);

        notificationService.sendNotification(
                reservation.getDemandeurId(),
                "Votre demande a été " + (accepted ? "acceptée" : "refusée") + " par le Secrétaire Général.",
                reservation.getId());
    }

    public void processDecision(String reservationId, boolean accepted, String decidedBy) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

        reservation.setStatut(accepted ? StatusReservation.ACCEPTÉE : StatusReservation.REFUSÉE);
        reservation.setDecideePar(decidedBy);
        reservationRepository.save(reservation);

        String message = accepted ? "acceptée" : "refusée";
        notificationService.sendNotification(
                reservation.getDemandeurId(),
                "Votre demande a été " + message + " par le " + decidedBy + ".",
                reservation.getId());
    }

    public Reservation findReservationById(String reservationId) {
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));
    }

public List<Reservation> getReservationsAcceptedBySG() {
    return reservationRepository.findByStatut(StatusReservation.ACCEPTÉE.name())
            .stream()
            .filter(reservation -> 
                "SecretaireGenerale".equals(reservation.getDecideePar()) &&
                !hasResponsable(reservation.getEspaceId())
            )
            .toList();
}

public List<Reservation> getReservationsRefusedBySG() {
    return reservationRepository.findByStatut(StatusReservation.REFUSÉE.name())
            .stream()
            .filter(reservation -> 
                "SecretaireGenerale".equals(reservation.getDecideePar()) &&
                !hasResponsable(reservation.getEspaceId())
            )
            .toList();
}


public void annulerReservation(String reservationId, String reason) {
    Reservation reservation = findReservationById(reservationId);
    
    if(reservation.getStatut() != StatusReservation.ACCEPTÉE) {
        throw new IllegalStateException("Seules les réservations acceptées peuvent être annulées");
    }
    
    if(new Date().after(reservation.getHeureDebut())) {
        throw new IllegalStateException("Impossible d'annuler après la date de début");
    }
    
    reservation.setStatut(StatusReservation.ANNULÉE);
    reservation.setAnnulationReason(reason);
    reservation.setDecideePar("SecretaireGenerale");
    
   
   
   
   
   
   
   
   
    
    reservationRepository.save(reservation);
    notificationService.sendNotification(
        reservation.getDemandeurId(),
        "Annulation de réservation",
        "Votre réservation a été annulée par le secrétaire général. Raison : " + reason
    );
}

public boolean canCancelReservation(Reservation reservation) {
    return reservation.getStatut() == StatusReservation.ACCEPTÉE 
           && new Date().before(reservation.getHeureDebut());
}

}

