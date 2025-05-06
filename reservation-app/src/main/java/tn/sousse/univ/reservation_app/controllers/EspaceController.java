package tn.sousse.univ.reservation_app.controllers;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.services.EspaceService;

@RestController
@RequestMapping("/api/espaces")
public class EspaceController {

    @Autowired
    private EspaceService espaceService;

    // Tous les espaces
    @GetMapping("/all")
    public ResponseEntity<List<Espace>> getAllEspaces() {
        return ResponseEntity.ok(espaceService.getAllEspaces());
    }

    // Un espace par ID
    @GetMapping("/id/{id}")
    public ResponseEntity<Espace> getEspaceById(@PathVariable String id) {
        return ResponseEntity.ok(espaceService.getEspaceById(id));
    }

    // Un espace par nom
    @GetMapping("/nom/{nom}")
    public ResponseEntity<Espace> getEspaceByNom(@PathVariable String nom) {
        return ResponseEntity.ok(espaceService.getEspaceByNom(nom));
    }

    // Disponibilité d’un espace
    @GetMapping("/{id}/disponibilite")
    public ResponseEntity<Boolean> verifierDisponibilite(@PathVariable String id) {
        return ResponseEntity.ok(espaceService.verifierDisponibilite(id));
    }

    // Catégories disponibles
    @GetMapping("/categories")
    public ResponseEntity<Map<String, String>> getSpaceCategories() {
        Map<String, String> categories = new LinkedHashMap<>();
        categories.put("Espaces_administratifs_academiques", "Espaces administratifs & académiques");
        categories.put("Espaces_employabilite_innovation", "Espaces d'employabilité & d'innovation");
        return ResponseEntity.ok(categories);
    }

    // Types d’espaces selon la catégorie
    @GetMapping("/types")
    public ResponseEntity<?> getSpaceTypesByCategory(@RequestParam String categorie) {
        try {
            Map<String, List<String>> types = new HashMap<>();

            if (categorie.equals("Espaces_administratifs_academiques")) {
                types.put(categorie, List.of("Amphitheatre", "Salle_de_reunion", "Laboratoire"));
            } else if (categorie.equals("Espaces_employabilite_innovation")) {
                types.put(categorie, List.of("Espace_4C", "Incubateur", "FabLab"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Catégorie invalide : " + categorie));
            }

            return ResponseEntity.ok(types);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Erreur lors du traitement de la catégorie"));
        }
    }

    // Créneaux non disponibles
    @GetMapping("/{id}/unavailable-slots")
    public ResponseEntity<List<String>> getUnavailableSlotsForSpace(
        @PathVariable String id,
        @RequestParam String date
    ) {
        return ResponseEntity.ok(espaceService.getUnavailableSlotsForSpace(id, date));
    }

    // Réservations pour un espace
    @GetMapping("/{id}/reservations")
    @PreAuthorize("hasAnyRole('SECRETAIRE_GENERALE', 'RESPONSABLE_SALLE')")
    public ResponseEntity<List<Reservation>> getReservationsForSpace(
        @PathVariable String id,
        @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(espaceService.getReservationsForSpace(id, status));
    }
}
