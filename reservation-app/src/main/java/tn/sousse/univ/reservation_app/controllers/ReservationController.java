
package tn.sousse.univ.reservation_app.controllers;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.bson.types.ObjectId;
import org.springframework.security.core.Authentication; 

import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.services.ReservationService;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    /*
     * @Autowired
     * private ReservationRepository reservationRepository;
     */

    /*
     * Créer une nouvelle réservation
     * 
     * @PostMapping("/create")
     * public ResponseEntity<ReservationResponseDTO> createReservation(@RequestBody
     * ReservationRequestDTO reservationDTO) {
     * ReservationResponseDTO savedReservation =
     * reservationService.creerReservation(reservationDTO);
     * return ResponseEntity.ok(savedReservation);
     * }
     */

    // Trouver une réservation par ID
    @GetMapping("/{id}")
    public Reservation trouverReservationParId(@PathVariable String id) {
        return reservationService.trouverReservationParId(id);
    }

    // Trouver les réservations par ID demandeur
    @GetMapping("/demandeur/{demandeurId}")
    public List<Reservation> trouverReservationsParDemandeurId(@PathVariable String demandeurId) {
        return reservationService.trouverReservationsParDemandeurId(demandeurId);
    }

    // Trouver les réservations par ID espace
    @GetMapping("/espace/{espaceId}")
    public List<Reservation> trouverReservationsParEspaceId(@PathVariable ObjectId espaceId) {
        return reservationService.trouverReservationsParEspaceId(espaceId);
    }

    // Trouver les réservations par statut
    @GetMapping("/statut/{statut}")
    public List<Reservation> trouverReservationsParStatut(@PathVariable String statut) {
        return reservationService.trouverReservationsParStatut(statut);
    }                               

    /*
     * Mettre à jour le statut d'une réservation
     * 
     * @PutMapping("/{id}/statut")
     * public Reservation mettreAJourStatut(@PathVariable String id, @RequestParam
     * String statut) {
     * return reservationService.mettreAJourStatut(id, statut);
     * }
     */

    // Supprimer une réservation
    @DeleteMapping("/{id}")
    public void supprimerReservation(@PathVariable String id) {
        reservationService.supprimerReservation(id);
    }

    @PostMapping(value = "/{id}/envoyer", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> transmettreReservation(
        @PathVariable String id,
        Authentication authentication
    ) {
        try {
            String result = reservationService.transmettreReservation(id);
            
            // Encapsulez la réponse dans un Map pour forcer le JSON
            return ResponseEntity.ok(Collections.singletonMap("status", result));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    

    
    
}