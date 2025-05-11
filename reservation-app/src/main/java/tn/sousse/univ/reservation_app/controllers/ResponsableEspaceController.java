package tn.sousse.univ.reservation_app.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.sousse.univ.reservation_app.security.CustomUserDetails;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.services.ResponsableEspaceService;
import tn.sousse.univ.reservation_app.models.Reservation;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/responsable")
@PreAuthorize("hasRole('RESPONSABLE_SALLE')")
public class ResponsableEspaceController {

    @Autowired
    private ResponsableEspaceService responsableEspaceService;

    /**
     * Endpoint pour obtenir toutes les réservations ou filtrer par statut
     * GET /api/responsable/reservations
     * GET /api/responsable/reservations?statut=EN_ATTENTE
     */
    @GetMapping("/reservations")
    public ResponseEntity<?> getReservations(
            @RequestParam(required = false) StatusReservation statut,
            Authentication authentication) {
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String responsableId = userDetails.getUserId();
        
        try {
            List<Reservation> reservations = (statut != null)
                ? responsableEspaceService.getReservationsByResponsableAndStatus(responsableId, statut)
                : responsableEspaceService.getAllReservationsByResponsable(responsableId);
            
            return ResponseEntity.ok(reservations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors de la récupération des réservations");
        }
    }

    /**
     * Endpoint pour prendre une décision sur une réservation
     * POST /api/responsable/decision/{reservationId}?accepted=true|false
     */
    @PostMapping("/decision/{reservationId}")
    public ResponseEntity<String> prendreDecision(
            @PathVariable String reservationId,
            @RequestParam boolean accepted,
            Authentication authentication) {
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String responsableId = userDetails.getUserId();
        
        try {
            responsableEspaceService.processDecision(reservationId, accepted, responsableId);
            return ResponseEntity.ok("Décision enregistrée avec succès");
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors du traitement de la décision");
        }
    }

    /**
     * Endpoint supplémentaire pour voir les réservations acceptées
     * GET /api/responsable/reservations/acceptees
     */
    @GetMapping("/reservations/acceptees")
    public ResponseEntity<?> getReservationsAcceptees(Authentication authentication) {
        return getReservationsByStatus(authentication, StatusReservation.ACCEPTÉE);
    }

    /**
     * Endpoint supplémentaire pour voir les réservations refusées
     * GET /api/responsable/reservations/refusees
     */
    @GetMapping("/reservations/refusees")
    public ResponseEntity<?> getReservationsRefusees(Authentication authentication) {
        return getReservationsByStatus(authentication, StatusReservation.REFUSÉE);
    }

    /**
     * Endpoint supplémentaire pour voir les réservations en attente
     * GET /api/responsable/reservations/en-attente
     */
    @GetMapping("/reservations/en-attente")
    public ResponseEntity<?> getReservationsEnAttente(Authentication authentication) {
        return getReservationsByStatus(authentication, StatusReservation.EN_ATTENTE);
    }

    private ResponseEntity<?> getReservationsByStatus(Authentication authentication, StatusReservation status) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String responsableId = userDetails.getUserId();
        
        try {
            List<Reservation> reservations = responsableEspaceService
                .getReservationsByResponsableAndStatus(responsableId, status);
            return ResponseEntity.ok(reservations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors de la récupération des réservations");
        }
    }


@PostMapping("/reservations/cancel/{reservationId}")
public ResponseEntity<String> annulerReservation(
        @PathVariable String reservationId,
        @RequestParam(required = false) String reason,
        Authentication authentication) {
    
    try {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String responsableId = userDetails.getUserId();
        
        responsableEspaceService.annulerReservation(reservationId, responsableId, reason);
        return ResponseEntity.ok("Réservation annulée avec succès");
        
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }
}

}