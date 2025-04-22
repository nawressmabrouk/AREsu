package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.util.Date;
import java.util.List;

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

    /*
     * @Autowired
     * private UserRepository userRepository;
     */

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private GoogleCalendarService googleCalendarService;

    @Autowired
    private EspaceRepository espaceRepository;

    /*
     * public void rejeterReservation(String reservationId) {
     * Reservation reservation = reservationRepository.findById(reservationId)
     * .orElseThrow(() -> new RuntimeException("Réservation introuvable"));
     * 
     * reservation.setStatut(StatusReservation.REFUSÉE);
     * reservationRepository.save(reservation);
     * 
     * Optional<User> demandeur =
     * userRepository.findById(reservation.getDemandeurId());
     * String demandeurEmail =
     * demandeur.map(User::getEmail).orElse("Email inconnu");
     * 
     * notificationService.sendNotification(demandeurEmail,
     * "Réservation rejetée",
     * "Votre réservation a été rejetée car l'espace n'est pas disponible.");
     * }
     * 
     * public void approuverReservation(String reservationId) {
     * Reservation reservation = reservationRepository.findById(reservationId)
     * .orElseThrow(() -> new RuntimeException("Réservation introuvable"));
     * 
     * reservation.setStatut(StatusReservation.ACCEPTÉE);
     * reservationRepository.save(reservation);
     * 
     * Optional<User> demandeur =
     * userRepository.findById(reservation.getDemandeurId());
     * String demandeurEmail =
     * demandeur.map(User::getEmail).orElse("Email inconnu");
     * 
     * notificationService.sendNotification(demandeurEmail,
     * "Réservation approuvée",
     * "Votre réservation a été approuvée par le Secrétaire Général.");
     * }
     */

     
     public List<Reservation> getReservationsViewedBySG() {
        return reservationRepository.findAll().stream()
                .filter(reservation -> hasResponsable(reservation.getEspaceId()) &&
                        reservation.getStatut().equals(StatusReservation.ATTRIBUÉE) &&
                        Boolean.TRUE.equals(reservation.getVueParSecretaire()))
                .toList();
    }
    
    public List<Reservation> getReservationsToViewBySG() {
        return reservationRepository.findAll().stream()
                .filter(reservation -> hasResponsable(reservation.getEspaceId()) &&
                        reservation.getStatut().equals(StatusReservation.ATTRIBUÉE) &&
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

}
