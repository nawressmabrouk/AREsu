package tn.sousse.univ.reservation_app.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.services.EspaceService;

@RestController
@RequestMapping("/api/espaces")
public class EspaceController {

    @Autowired
    private EspaceService espaceService;

    // Récupérer tous les espaces
    @GetMapping("/all")
    public ResponseEntity<List<Espace>> getAllEspaces() {
        return ResponseEntity.ok(espaceService.getAllEspaces());
    }

    // Récupérer un espace par ID
    @GetMapping("/id/{id}")
    public ResponseEntity<Espace> getEspaceById(@PathVariable String id) {
        return ResponseEntity.ok(espaceService.getEspaceById(id));
    }

    // Récupérer un espace par Nom
    @GetMapping("/nom/{nom}")
    public ResponseEntity<Espace> getEspaceByNom(@PathVariable String nom) {
        return ResponseEntity.ok(espaceService.getEspaceByNom(nom));
    }

    // Vérifier la disponibilité d’un espace
    @GetMapping("/{id}/disponibilite")
    public ResponseEntity<Boolean> verifierDisponibilite(@PathVariable String id) {
        return ResponseEntity.ok(espaceService.verifierDisponibilite(id));
    }
}
