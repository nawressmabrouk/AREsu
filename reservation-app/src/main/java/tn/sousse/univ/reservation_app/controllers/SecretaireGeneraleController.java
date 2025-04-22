package tn.sousse.univ.reservation_app.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.services.SecretaireGeneraleService;

@RestController
@RequestMapping("/api/secretaire")
@PreAuthorize("hasRole('SECRETAIRE_GENERALE')") // Only for SECRETAIRE_GENERALE
public class SecretaireGeneraleController {

    @Autowired
    private SecretaireGeneraleService secretaireGeneraleService;

    /*
     * Transmettre une demande de réservation
     * 
     * @PostMapping("/transmettreReservation/{reservationId}")
     * public ResponseEntity<String> transmettreReservation(@PathVariable String
     * reservationId) {
     * try {
     * String result =
     * secretaireGeneraleService.transmettreReservation(reservationId);
     * 
     * switch (result) {
     * case "DISPATCHED":
     * return ResponseEntity.
     * ok("La réservation a été transmise au responsable de l’espace avec succès.");
     * case "NO_RESPONSABLE":
     * return ResponseEntity.ok(
     * "Aucun responsable trouvé pour l'espace. Le Secrétaire Général prendra en charge la demande."
     * );
     * case "ESPACE_NOT_FOUND":
     * return
     * ResponseEntity.status(HttpStatus.NOT_FOUND).body("Espace introuvable.");
     * default:
     * return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).
     * body("Erreur inattendue.");
     * }
     * 
     * } catch (RuntimeException e) {
     * return ResponseEntity.status(HttpStatus.NOT_FOUND)
     * .body("Réservation introuvable : " + e.getMessage());
     * }
     * }
     */

    // Suivre toutes les réservations
    @GetMapping("/suivreReservations")
    public List<Reservation> suivreReservations() {
        return secretaireGeneraleService.suivreReservations();
    }

    // Suivre les réservations par statut
    @GetMapping("/suivreReservationsParStatut/{statut}")
    public List<Reservation> suivreReservationsParStatut(@PathVariable String statut) {
        return secretaireGeneraleService.suivreReservationsParStatut(statut);
    }

    /*
     * Approuver une demande de réservation
     * 
     * @PostMapping("/approverReservation/{reservationId}")
     * public ResponseEntity<String> approuverReservation(@PathVariable String
     * reservationId) {
     * try {
     * secretaireGeneraleService.approuverReservation(reservationId);
     * return ResponseEntity.ok("Reservation approved successfully.");
     * } catch (RuntimeException e) {
     * return ResponseEntity.status(HttpStatus.NOT_FOUND)
     * .body("Reservation not found: " + e.getMessage());
     * }
     * }
     * 
     * // Rejeter une demande de réservation
     * 
     * @PostMapping("/rejeterReservation/{reservationId}")
     * public ResponseEntity<String> rejeterReservation(@PathVariable String
     * reservationId) {
     * try {
     * secretaireGeneraleService.rejeterReservation(reservationId);
     * return ResponseEntity.ok("Reservation rejected successfully.");
     * } catch (RuntimeException e) {
     * return ResponseEntity.status(HttpStatus.NOT_FOUND)
     * .body("Reservation not found: " + e.getMessage());
     * }
     * }
     */
    @GetMapping("/reservations/viewed")
    public List<Reservation> getViewed() {
        return secretaireGeneraleService.getReservationsViewedBySG();
    }

    @GetMapping("/reservations/toView")
    public List<Reservation> getToVisa() {
        return secretaireGeneraleService.getReservationsToViewBySG();
    }

    @GetMapping("/reservations/toHandle")
    public List<Reservation> getToHandle() {
        return secretaireGeneraleService.getReservationsToHandleBySG();
    }

    @PostMapping("/reservations/view/{reservationId}")
    public ResponseEntity<String> visaReservation(@PathVariable String reservationId) {
        Reservation reservation = secretaireGeneraleService.findReservationById(reservationId);
        secretaireGeneraleService.viewReservation(reservation);
        return ResponseEntity.ok("Vu par le Secrétaire Général.");
    }

    @PostMapping("/decision/{id}")
    public ResponseEntity<String> secretaireDecision(
            @PathVariable String id,
            @RequestParam boolean accepted) {

        Reservation reservation = secretaireGeneraleService.findReservationById(id);

        // Check if the espace had a responsable
        boolean hadResponsable = secretaireGeneraleService.hasResponsable(reservation.getEspaceId());

        // Enforce logic: if there was no responsable, SG is primary decision-maker
        if (!hadResponsable) {
            // vueParSecretaire should NOT be set; it's a direct decision
            secretaireGeneraleService.processDecision(id, accepted, "SecretaireGenerale");
        } else {
            // Responsable existed: SG is handling post-responsable; so vueParSecretaire =
            // true
            secretaireGeneraleService.viewReservation(reservation); // sets vueParSecretaire = true
            secretaireGeneraleService.processDecision(id, accepted, "SecretaireGenerale");
        }

        return ResponseEntity.ok("Décision traitée avec succès.");
    }

}