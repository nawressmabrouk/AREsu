package tn.sousse.univ.reservation_app.services;

//import java.io.IOException;
//import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;

@Service
public class ResponsableEspaceService {

    @Autowired
    private ReservationRepository reservationRepository;

    // @Autowired
    // private ReservationService reservationService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SecretaireGeneraleService secretaireGeneraleService;

    // Notification pour le responsable espace
    public void notifyResponsable(String responsableId, Reservation reservation) {
        String message = "Nouvelle réservation assignée : " + reservation.getIntituleAction();
        notificationService.sendNotification(message, responsableId, reservation.getId());
    }

    /*
     * Vérifier la disponibilité d'une salle
     * public void verifierDisponibilite() {
     * // Implémentation pour vérifier la disponibilité
     * }
     * 
     * 
     * // Approuver une réservation
     * public void approveReservation(String reservationId) throws IOException {
     * Optional<Reservation> optionalReservation =
     * reservationRepository.findById(reservationId);
     * 
     * if (optionalReservation.isPresent()) {
     * Reservation reservation = optionalReservation.get();
     * reservation.setStatut(StatusReservation.ACCEPTÉE);
     * 
     * // Save the updated status in the database
     * reservationRepository.save(reservation);
     * 
     * try {
     * // Add the reservation to Google Calendar
     * reservationService.addReservationToCalendar(reservation);
     * } catch (IOException e) {
     * e.printStackTrace(); // This prints the exact cause of failure in logs
     * throw new IOException("Failed to add reservation to Google Calendar: " +
     * e.getMessage(), e);
     * }
     * }
     * }
     * 
     * // Rejeter une réservation
     * public void rejeterReservation(String idReservation) {
     * Reservation reservation = reservationRepository.findById(idReservation)
     * .orElseThrow(() -> new RuntimeException("Request not found"));
     * ;
     * reservation.setStatut(StatusReservation.REFUSÉE);
     * 
     * reservationRepository.save(reservation);
     * }
     */

    public void processDecision(String reservationId, boolean accepted) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

        // Check if the espace has a responsable
        if (!secretaireGeneraleService.hasResponsable(reservation.getEspaceId())) {
            throw new IllegalStateException(
                    "Cet espace n'a pas de responsable assigné. Le Secrétaire Général doit prendre la décision.");
        }

        reservation.setStatut(accepted ? StatusReservation.ACCEPTÉE : StatusReservation.REFUSÉE);
        reservation.setDecideePar("Responsable");
        reservationRepository.save(reservation);

        notificationService.sendNotification(
                reservation.getDemandeurId(),
                "Votre demande a été " + (accepted ? "acceptée" : "refusée") + " par le Responsable de salle.",
                reservation.getId());
    }
}