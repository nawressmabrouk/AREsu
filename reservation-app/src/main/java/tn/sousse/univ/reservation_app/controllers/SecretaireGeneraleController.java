
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
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.services.SecretaireGeneraleService;
import tn.sousse.univ.reservation_app.dto.DecisionDTO;


@RestController
@RequestMapping("/api/secretaire")
 // Only for SECRETAIRE_GENERALE
public class SecretaireGeneraleController {

    @Autowired
    private SecretaireGeneraleService secretaireGeneraleService;

   

    // Suivre toutes les réservations
    @GetMapping("/suivreReservations")
    public List<Reservation> suivreReservations() {
        return secretaireGeneraleService.suivreReservations();
    }

    // Suivre les réservations par statut
    @GetMapping("/suivreReservationsParStatut/{statut}")
    public List<Reservation> suivreReservationsParStatut(@PathVariable String statut) {

         // Ajoutez des logs pour déboguer
    System.out.println("Statut reçu: " + statut);
        return secretaireGeneraleService.suivreReservationsParStatut(statut);
    }

//hedhy tjy liste des reservations ely howa aamalelhom vu sayee
    @GetMapping("/reservations/viewed")
    public List<Reservation> getViewed() {
        return secretaireGeneraleService.getReservationsViewedBySG();
    }

    //hedhy tjyblou lista mtaa reservation ely lezm ychoufhom (maaneha mtaa responsable w howa bch ychoufhom khw)
    @GetMapping("/reservations/toView")
    public List<Reservation> getToVisa() {
        return secretaireGeneraleService.getReservationsToViewBySG();
    }

    //hedhy tjyblou les reservation ely howa bch yetretihom
    @GetMapping("/reservations/toHandle")
    public List<Reservation> getToHandle() {
        return secretaireGeneraleService.getReservationsToHandleBySG();
    }

    //kif yenzel aal 3in 
    @PostMapping("/reservations/view/{reservationId}")
    public ResponseEntity<Map<String, String>> visaReservation(@PathVariable String reservationId) {
        Reservation reservation = secretaireGeneraleService.findReservationById(reservationId);
        secretaireGeneraleService.viewReservation(reservation);
        return ResponseEntity.ok(Collections.singletonMap("message", "Vu par le Secrétaire Général."));
    }
   
   
   
   

   
   

   
   
   
   
   
   

   
   
    /*endpoint decision nawress 
    @PostMapping("/decision/{id}")
    public ResponseEntity<Map<String, String>> secretaireDecision(
        @PathVariable String id,
        @RequestParam boolean accepted) {
    
    try {
        Reservation reservation = secretaireGeneraleService.findReservationById(id);
        boolean hadResponsable = secretaireGeneraleService.hasResponsable(reservation.getEspaceId());

        if (!hadResponsable) {
            secretaireGeneraleService.processDecision(id, accepted, "SecretaireGenerale");
        } else {
            secretaireGeneraleService.viewReservation(reservation);
            secretaireGeneraleService.processDecision(id, accepted, "SecretaireGenerale");
        }

        return ResponseEntity.ok(Collections.singletonMap("message", "Décision enregistrée avec succès"));
        
    } catch (NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Collections.singletonMap("erreur", "Réservation introuvable"));
                
    } catch (IllegalStateException | IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(Collections.singletonMap("erreur", e.getMessage()));
                
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("erreur", "Erreur interne du serveur"));
    }
}*/




// endpoint decision nourhen 

@PostMapping("/decision/{id}")
public ResponseEntity<Map<String, String>> secretaireDecision(
        @PathVariable String id,
        @RequestParam(required = false) Boolean accepted,
        @RequestBody(required = false) DecisionDTO decisionDTO) {

    try {
        Reservation reservation = secretaireGeneraleService.findReservationById(id);
        boolean hadResponsable = secretaireGeneraleService.hasResponsable(reservation.getEspaceId());

        // Nouvelle logique avec DecisionDTO si fourni
        if (decisionDTO != null) {
            if (!hadResponsable) {
                secretaireGeneraleService.processDecision(
                    id, 
                    decisionDTO.isAccepted(), 
                    decisionDTO.getApprovedEquipments(), 
                    "SecretaireGenerale"
                );
            } else {
                secretaireGeneraleService.viewReservation(reservation);
                secretaireGeneraleService.processDecision(
                    id, 
                    decisionDTO.isAccepted(), 
                    decisionDTO.getApprovedEquipments(), 
                    "SecretaireGenerale"
                );
            }
        } 
        // Ancienne logique avec le paramètre accepted si fourni
        else if (accepted != null) {
            if (!hadResponsable) {
                secretaireGeneraleService.processDecision(id, accepted, "SecretaireGenerale");
            } else {
                secretaireGeneraleService.viewReservation(reservation);
                secretaireGeneraleService.processDecision(id, accepted, "SecretaireGenerale");
            }
        }
        // Si aucun des deux n'est fourni
        else {
            return ResponseEntity.badRequest()
                    .body(Collections.singletonMap("erreur", "Either accepted parameter or decisionDTO must be provided"));
        }

        return ResponseEntity.ok(Collections.singletonMap("message", "Décision enregistrée avec succès"));

    } catch (NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Collections.singletonMap("erreur", "Réservation introuvable"));
                
    } catch (IllegalStateException | IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(Collections.singletonMap("erreur", e.getMessage()));
                
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("erreur", "Erreur interne du serveur"));
    }
}


@GetMapping("/reservations/accepted")
@PreAuthorize("hasRole('SECRETAIRE_GENERALE')")
public ResponseEntity<List<Reservation>> getReservationsAcceptedBySG() {
   
        List<Reservation> reservations = secretaireGeneraleService.getReservationsAcceptedBySG();
        return ResponseEntity.ok(reservations);
    
}

@GetMapping("/reservations/refused")
@PreAuthorize("hasRole('SECRETAIRE_GENERALE')")
public ResponseEntity<List<Reservation>> getReservationsRefusedBySG() {
   
        List<Reservation> reservations = secretaireGeneraleService.getReservationsRefusedBySG();
        return ResponseEntity.ok(reservations);
   
}

@PostMapping("/reservations/cancel/{reservationId}")
public ResponseEntity<?> annulerReservation(
        @PathVariable String reservationId,
        @RequestParam(required = false) String reason) {
    
    try {
        Reservation reservation = secretaireGeneraleService.findReservationById(reservationId);
        
        // Vérifier si l'annulation est possible
        if(!secretaireGeneraleService.canCancelReservation(reservation)) {
            return ResponseEntity.badRequest().body("Annulation non autorisée");
        }
        
        secretaireGeneraleService.annulerReservation(reservationId, reason);
        return ResponseEntity.ok("Réservation annulée avec succès");
        
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
    }
}


}