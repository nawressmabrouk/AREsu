
package tn.sousse.univ.reservation_app.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ResponsableEspaceService {

    @Autowired
    private ReservationRepository reservationRepository;

     @Autowired
    private NotificationService notificationService;

     @Autowired
    private GoogleCalendarService googleCalendarService;

    @Autowired
    private EspaceRepository espaceRepository;
 private static final Logger logger = LoggerFactory.getLogger(SecretaireGeneraleService.class);
    public void processDecision(String reservationId, boolean accepted, String responsableId) {
        Reservation reservation = getReservationWithAuthorization(reservationId, responsableId);
        
        StatusReservation newStatus = accepted ? StatusReservation.ACCEPTÉE : StatusReservation.REFUSÉE;
        reservation.setStatut(newStatus);
        reservation.setDecideePar(responsableId);
        
        reservationRepository.save(reservation);
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
}
