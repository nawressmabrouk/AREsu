package tn.sousse.univ.reservation_app.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.sousse.univ.reservation_app.security.CustomUserDetails;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;
import tn.sousse.univ.reservation_app.services.ResponsableEspaceService;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.dto.DecisionDTO;

import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/responsable")
@PreAuthorize("hasRole('RESPONSABLE_SALLE')")
public class ResponsableEspaceController {
    
 @Autowired
    private EspaceRepository espaceRepository;

     @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private ResponsableEspaceService responsableEspaceService;
private static final Logger logger = LoggerFactory.getLogger(ResponsableEspaceController.class);
  
    // get all reservations for the responsible
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

// Processes a decision (accept/reject) for a specific reservation
@PostMapping("/decision/{reservationId}")
public ResponseEntity<?> prendreDecision(
        @PathVariable String reservationId,
        @RequestBody DecisionDTO decisionDTO,
        Authentication authentication) {
  logger.info("Processing decision for reservation: {}", reservationId);
    logger.info("Decision data: accepted={}, equipements={}", 
        decisionDTO.isAccepted(), decisionDTO.getApprovedEquipements());
    CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
    String responsableId = userDetails.getUserId();
       logger.info("Responsable ID: {}", responsableId);
    
     try {
        // Get reservation first to log establishment info
        Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new RuntimeException("Reservation not found"));
        
        logger.info("Reservation details - Space ID: {}, Establishment ID: {}", 
            reservation.getEspaceId(), 
            espaceRepository.findById(reservation.getEspaceId())
                .map(Espace::getEtablissementId)
                .orElse("NOT FOUND"));
        
        responsableEspaceService.processDecision(
            reservationId, 
            decisionDTO.isAccepted(), 
            decisionDTO.getApprovedEquipements() != null ? 
                decisionDTO.getApprovedEquipements() : Collections.emptyList(),
            responsableId
        );
        
        return ResponseEntity.ok("Décision enregistrée avec succès");
    
    } catch (NoSuchElementException e) {
        logger.error("Reservation not found: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    } catch (SecurityException e) {
        logger.error("Authorization error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
    } catch (Exception e) {
        logger.error("Error processing decision: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Erreur lors du traitement de la décision: " + e.getMessage());
    }
}





    //Get all the accepted reservations for the responsible endpoint
    @GetMapping("/reservations/acceptees")
    public ResponseEntity<?> getReservationsAcceptees(Authentication authentication) {
        return getReservationsByStatus(authentication, StatusReservation.ACCEPTÉE);
    }

    //Get all the rejected reservations for the responsible
    @GetMapping("/reservations/refusees")
    public ResponseEntity<?> getReservationsRefusees(Authentication authentication) {
        return getReservationsByStatus(authentication, StatusReservation.REFUSÉE);
    }

    // Get all the pending reservations for the responsible
    @GetMapping("/reservations/en-attente")
    public ResponseEntity<?> getReservationsEnAttente(Authentication authentication) {
    CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
    String responsableId = userDetails.getUserId();
    
    logger.debug("Fetching pending reservations for responsable: {}", responsableId);
    List<String> espaceIds = espaceRepository.findByResponsableId(responsableId)
        .stream()
        .map(Espace::getId)
        .toList();
    logger.debug("Responsable manages these spaces: {}", espaceIds);
    
    List<Reservation> reservations = responsableEspaceService
        .getReservationsByResponsableAndStatus(responsableId, StatusReservation.EN_ATTENTE);
    logger.debug("Found {} pending reservations", reservations.size());
    
    return ResponseEntity.ok(reservations);
}

    // Helper method to fetch reservations for the current responsable, filtered by status (used internally by public endpoints)
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

// Cancel a specific reservation (with optional reason) endpoint
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


// Get all the spaces managed by the responsible
@GetMapping("/espaces")
public ResponseEntity<?> getEspacesByResponsable(Authentication authentication) {
    CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
    String responsableId = userDetails.getUserId();
    
    try {
        List<Espace> espaces = responsableEspaceService.getEspacesByResponsable(responsableId);
        return ResponseEntity.ok(espaces);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors de la récupération des espaces: " + e.getMessage());
    }
}


// Update the details of a specific space (administered by the responsible) endpoint
@PutMapping("/espaces/{espaceId}")
public ResponseEntity<?> updateEspace(
        @PathVariable String espaceId,
        @RequestBody Espace updatedEspace,
        Authentication authentication) {
    
    CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
    String responsableId = userDetails.getUserId();
    
    try {
        Espace espace = responsableEspaceService.updateEspace(espaceId, updatedEspace, responsableId);
        return ResponseEntity.ok(espace);
    } catch (NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    } catch (SecurityException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors de la mise à jour de l'espace: " + e.getMessage());
    }
}

//Delete a specific space (administered by the responsible) endpoint
@DeleteMapping("/espaces/{espaceId}")
public ResponseEntity<?> deleteEspace(
        @PathVariable String espaceId,
        Authentication authentication) {
    
    CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
    String responsableId = userDetails.getUserId();
    
    try {
        responsableEspaceService.deleteEspace(espaceId, responsableId);
        return ResponseEntity.ok("Espace supprimé avec succès");
    } catch (NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    } catch (SecurityException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors de la suppression de l'espace: " + e.getMessage());
    }
}
}


