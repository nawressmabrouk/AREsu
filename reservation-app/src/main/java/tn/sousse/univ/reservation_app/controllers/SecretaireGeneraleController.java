
package tn.sousse.univ.reservation_app.controllers;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;
import tn.sousse.univ.reservation_app.repositories.UserRepository;
import tn.sousse.univ.reservation_app.security.CustomUserDetails;
import tn.sousse.univ.reservation_app.services.SecretaireGeneraleService;
import tn.sousse.univ.reservation_app.dto.DecisionDTO;

@RestController
@RequestMapping("/api/secretaire")
// Only for SECRETAIRE_GENERALE
public class SecretaireGeneraleController {
    @Autowired
private UserRepository userRepository;
    @Autowired
    private SecretaireGeneraleService secretaireGeneraleService;

    @Autowired
    private EspaceRepository espaceRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    // Get reservations filtered by specific status endpoint
    @GetMapping("/suivreReservationsParStatut/{statut}")
    public List<Reservation> suivreReservationsParStatut(@PathVariable String statut) {

        System.out.println("Statut reçu: " + statut);
        return secretaireGeneraleService.suivreReservationsParStatut(statut);
    }

    // Retrieve the reservations already viewed by the secretary general endpoint
    @GetMapping("/reservations/viewed")
    public ResponseEntity<?> getViewed(@AuthenticationPrincipal CustomUserDetails userDetails) {
    if (userDetails == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    try {
        User currentUser = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> new UsernameNotFoundException("Secrétaire non trouvé"));

        if (currentUser.getEtablissementId() == null) {
            return ResponseEntity.badRequest().body("Aucun établissement associé à ce compte");
        }

        List<Reservation> reservations = secretaireGeneraleService.getReservationsViewedBySG(
            currentUser.getEtablissementId()
        );

        return ResponseEntity.ok(reservations);

    } catch (UsernameNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body("Erreur lors du traitement");
    }
}


    // Get reservations needing review from the secretary 
    @GetMapping("/reservations/toView")
    public ResponseEntity<?> getToVisa(@AuthenticationPrincipal CustomUserDetails userDetails) {
    if (userDetails == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    
    try {
        User currentUser = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));
        
        List<Reservation> reservations = secretaireGeneraleService.getReservationsToViewBySG(currentUser.getEtablissementId());
        
        return ResponseEntity.ok(reservations);
        
    } catch (UsernameNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Utilisateur non trouvé");
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur serveur");
    }
    }

    // Get reservations needing handling from the secretary general
    @GetMapping("/reservations/toHandle")
    public ResponseEntity<?> getToHandle(@AuthenticationPrincipal CustomUserDetails userDetails) {
    if (userDetails == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    
    // Get the actual User entity from the database
    User currentUser = userRepository.findById(userDetails.getUserId())
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    
    return ResponseEntity.ok(
        secretaireGeneraleService.getReservationsToHandleBySG(currentUser.getEtablissementId())
    );
    }

    // Marks a reservation as viewed by the secretary
    @PostMapping("/reservations/view/{reservationId}")
    public ResponseEntity<Map<String, String>> visaReservation(@PathVariable String reservationId) {
        Reservation reservation = secretaireGeneraleService.findReservationById(reservationId);
        secretaireGeneraleService.viewReservation(reservation);
        return ResponseEntity.ok(Collections.singletonMap("message", "Vu par le Secrétaire Général."));
    }

    //Processes secretary's decision on a reservation (accept/reject)
    @PostMapping("/decision/{id}")
    public ResponseEntity<Map<String, String>> secretaireDecision(
            @PathVariable String id,
            @RequestParam(required = false) Boolean accepted,
            @RequestBody(required = false) DecisionDTO decisionDTO) {

        try {
            // Validate input
            if (decisionDTO == null && accepted == null) {
                return ResponseEntity.badRequest()
                        .body(Collections.singletonMap("erreur",
                                "Either accepted parameter or decisionDTO must be provided"));
            }

            Reservation reservation = secretaireGeneraleService.findReservationById(id);
            if (reservation == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("erreur", "Réservation introuvable"));
            }

            boolean hadResponsable = secretaireGeneraleService.hasResponsable(reservation.getEspaceId());
            boolean isAccepted = decisionDTO != null ? decisionDTO.isAccepted() : accepted;
            List<String> approvedEquipments = decisionDTO != null ? decisionDTO.getApprovedEquipements()
                    : Collections.emptyList();

            if (reservation.getEtablissementId() == null) {
                // Get etablissementId from espace
                Espace espace = espaceRepository.findById(reservation.getEspaceId())
                        .orElseThrow(() -> new RuntimeException("Espace not found"));
                reservation.setEtablissementId(espace.getEtablissementId());
                reservationRepository.save(reservation);
            }


            // Process the decision
            if (!hadResponsable) {
                secretaireGeneraleService.processDecision(
                        id,
                        isAccepted,
                        approvedEquipments,
                        "SecretaireGenerale");
            } else {
                secretaireGeneraleService.viewReservation(reservation);
                secretaireGeneraleService.processDecision(
                        id,
                        isAccepted,
                        approvedEquipments,
                        "SecretaireGenerale");
            }

            return ResponseEntity.ok(Collections.singletonMap("message", "Décision enregistrée avec succès"));

        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("erreur", "Réservation introuvable"));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Collections.singletonMap("erreur", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("erreur",
                            "Erreur interne du serveur: " + e.getMessage()));
        }
    }

    //Get all the reservations accepted by secretary
    @GetMapping("/reservations/accepted")
    @PreAuthorize("hasRole('SECRETAIRE_GENERALE')")
    public ResponseEntity<List<Reservation>> getReservationsAcceptedBySG() {

        List<Reservation> reservations = secretaireGeneraleService.getReservationsAcceptedBySG();
        return ResponseEntity.ok(reservations);

    }

    //Get all the reservations refused by secretary
    @GetMapping("/reservations/refused")
    @PreAuthorize("hasRole('SECRETAIRE_GENERALE')")
    public ResponseEntity<List<Reservation>> getReservationsRefusedBySG() {

        List<Reservation> reservations = secretaireGeneraleService.getReservationsRefusedBySG();
        return ResponseEntity.ok(reservations);

    }

    // Cancel a reservation by secretary general
    @PostMapping("/reservations/cancel/{reservationId}")
    public ResponseEntity<?> annulerReservation(
            @PathVariable String reservationId,
            @RequestParam(required = false) String reason) {

        try {
            Reservation reservation = secretaireGeneraleService.findReservationById(reservationId);

            if (!secretaireGeneraleService.canCancelReservation(reservation)) {
                return ResponseEntity.badRequest().body("Annulation non autorisée");
            }

            secretaireGeneraleService.annulerReservation(reservationId, reason);
            return ResponseEntity.ok("Réservation annulée avec succès");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

}