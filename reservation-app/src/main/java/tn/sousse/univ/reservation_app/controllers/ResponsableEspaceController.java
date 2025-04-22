package tn.sousse.univ.reservation_app.controllers;

//import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tn.sousse.univ.reservation_app.services.ResponsableEspaceService;

@RestController
@RequestMapping("/api/responsable")
@PreAuthorize("hasRole('RESPONSABLE_SALLE')")
public class ResponsableEspaceController {

    @Autowired
    private ResponsableEspaceService responsableEspaceService;

    /*
     * Vérifier la disponibilité d'une salle
     * 
     * @GetMapping("/verifierDisponibilite")
     * public void verifierDisponibilite() {
     * responsableSalleService.verifierDisponibilite();
     * }
     * 
     * 
     * // Approuver une réservation
     * 
     * @PutMapping("/{id}/approveReservation")
     * public ResponseEntity<String> approveReservation(@PathVariable String id) {
     * try {
     * responsableSalleService.approveReservation(id);
     * return
     * ResponseEntity.ok("Reservation approved and added to Google Calendar.");
     * } catch (IOException e) {
     * return ResponseEntity.status(500).
     * body("Error adding reservation to Google Calendar.");
     * }
     * }
     * 
     * // Rejeter une réservation
     * 
     * @PostMapping("/{id}/rejeterReservation")
     * public void rejeterReservation(@PathVariable String id) {
     * responsableSalleService.rejeterReservation(id);
     * }
     */

    @PostMapping("/decision/{reservationId}")
    public ResponseEntity<String> prendreDecision(
            @PathVariable String reservationId,
            @RequestParam boolean accepted) {
        try {
            responsableEspaceService.processDecision(reservationId, accepted);
            return ResponseEntity.ok("Décision prise par le Responsable.");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}