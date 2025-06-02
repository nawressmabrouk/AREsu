
package tn.sousse.univ.reservation_app.controllers;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.services.ReservationService;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private EspaceRepository espaceRepository;

    // find a reservation by id endpoint
    @GetMapping("/{id}")
    public Reservation trouverReservationParId(@PathVariable String id) {
        return reservationService.trouverReservationParId(id);
    }

    // find the reservations of a specific demandeur by his id endpoint
    @GetMapping("/demandeur/{demandeurId}")
    public List<Reservation> trouverReservationsParDemandeurId(@PathVariable String demandeurId) {
        return reservationService.trouverReservationsParDemandeurId(demandeurId);
    }

    // find the reservations of a specific espace by his id endpoint
    @GetMapping("/espace/{espaceId}")
    public List<Reservation> trouverReservationsParEspaceId(@PathVariable ObjectId espaceId) {
        return reservationService.trouverReservationsParEspaceId(espaceId);
    }

    // find a reservation by its statut endpoint
    @GetMapping("/statut/{statut}")
    public List<Reservation> trouverReservationsParStatut(@PathVariable String statut) {
        return reservationService.trouverReservationsParStatut(statut);
    }

    // delete a reservation by its id endpoint
    @DeleteMapping("/{id}")
    public void supprimerReservation(@PathVariable String id) {
        reservationService.supprimerReservation(id);
    }

    // Transmit the demadeur reservation requests to the responsible or to the secretary depends on the selected space
    @PostMapping(value = "/{id}/envoyer", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> transmettreReservation(
            @PathVariable String id,
            Authentication authentication) {
        try {
            String result = reservationService.transmettreReservation(id);

            return ResponseEntity.ok(Collections.singletonMap("status", result));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    // get the details of a specific space by its id endpoint
    @GetMapping("/espaces/{espaceId}")
    public ResponseEntity<Espace> getEspaceDetails(@PathVariable String espaceId) {
        Espace espace = espaceRepository.findById(espaceId)
                .orElseThrow(() -> new RuntimeException("Espace non trouvé"));
        return ResponseEntity.ok(espace);
    }

}