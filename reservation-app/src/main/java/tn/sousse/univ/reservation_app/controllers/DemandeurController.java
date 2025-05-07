package tn.sousse.univ.reservation_app.controllers;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tn.sousse.univ.reservation_app.dto.ReservationRequestDTO;
import tn.sousse.univ.reservation_app.dto.ReservationResponseDTO;
import tn.sousse.univ.reservation_app.services.DemandeurService;
import tn.sousse.univ.reservation_app.services.ReservationService;

@RestController
@RequestMapping("/api/demandeur")
@PreAuthorize("hasAnyRole('ROLE_DEMANDEUR_INTERNE', 'ROLE_DEMANDEUR_EXTERNE')")
public class DemandeurController {

    @Autowired
    private DemandeurService demandeurService;

    @Autowired
    private ReservationService reservationService;

    // Demander une réservation
    @PostMapping("/demanderReservation")
public ResponseEntity<Map<String, Object>> reserveSpace(@RequestBody ReservationRequestDTO reservationDTO) {
    try {
        ReservationResponseDTO response = reservationService.creerReservation(reservationDTO);
        
        return ResponseEntity.ok()
            .body(Map.of(
                "status", "success",
                "message", "Reservation request submitted",
                "id", response.getId()
            ));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of(
                "status", "error",
                "message", "Error creating reservation: " + e.getMessage()
            ));
    }
}

    /* 
    @PostMapping("/annulerReservation")
    public ResponseEntity<String> annulerReservation(
            @RequestParam String reservationId,
            @RequestParam Long demandeurId,
            @RequestParam(required = false) String raison) {
        try {
            reservationService.annulerReservation(reservationId, demandeurId);
            return ResponseEntity.ok(
                    "La réservation a été annulée avec succès et l'événement a été mis à jour dans Google Calendar.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Erreur : " + e.getMessage());
        }
    }

@GetMapping("/{demandeurId}/reservations")
    public ResponseEntity<List<ReservationResponseDTO>> getReservationsByDemandeur(@PathVariable String demandeurId) {
        List<ReservationResponseDTO> reservations = demandeurService.getReservationsByDemandeur(demandeurId);
        return ResponseEntity.ok(reservations);
    }*/
    @PostMapping("/annulerReservation")
    @PreAuthorize("#demandeurId == authentication.principal.getUserId()")
    public ResponseEntity<Map<String, String>> annulerReservation(
            @RequestParam String reservationId,
            @RequestParam String demandeurId,
            @RequestParam(required = false) String raison) {
        try {
            reservationService.annulerReservation(reservationId, demandeurId);
            return ResponseEntity.ok(
                Collections.singletonMap("message", "Réservation annulée avec succès.")
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                Collections.singletonMap("error", "Erreur : " + e.getMessage())
            );
        }
    }

@GetMapping("/{demandeurId}/reservations")
@PreAuthorize("#demandeurId == authentication.principal.userId")
    public ResponseEntity<List<ReservationResponseDTO>> getReservationsByDemandeur(@PathVariable String demandeurId) {
        List<ReservationResponseDTO> reservations = demandeurService.getReservationsByDemandeur(demandeurId);
        return ResponseEntity.ok(reservations);
    }


    

    @GetMapping("/reservation/{reservationId}")
    public ResponseEntity<ReservationResponseDTO> getReservationById(@PathVariable String reservationId) {
        ReservationResponseDTO reservation = demandeurService.getReservationDtoById(reservationId);
        return ResponseEntity.ok(reservation);
    }
    
}