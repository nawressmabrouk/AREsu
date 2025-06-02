package tn.sousse.univ.reservation_app.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tn.sousse.univ.reservation_app.dto.EtablissementWithEspacesDTO;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.models.TypeEtablissement;
import tn.sousse.univ.reservation_app.models.Zone;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.EtablissementRepository;
import tn.sousse.univ.reservation_app.services.EspaceService;
import tn.sousse.univ.reservation_app.services.EtablissementService;

@RestController
@RequestMapping("/api/etablissements")
public class EtablissementController {

    private final EtablissementService etablissementService;

    public EtablissementController(EtablissementService etablissementService) {
        this.etablissementService = etablissementService;
    }

    @Autowired
    private EtablissementRepository etablissementRepository;

    @Autowired
    private EspaceRepository espaceRepository;

    @Autowired
    private EspaceService espaceService;

    // Get all establishments with their spaces
    @GetMapping("/with-espaces")
    public List<EtablissementWithEspacesDTO> etablissementsWithEspaces() {
        List<Etablissement> etablissements = etablissementRepository.findAll();
        return etablissements.stream()
                .map(etab -> {
                    List<Espace> espaces = espaceRepository.findByEtablissementId(etab.getId());
                    return new EtablissementWithEspacesDTO(
                            etab.getNom(),
                            espaces,
                            etab.getLogo());
                })
                .collect(Collectors.toList());
    }
 // Endpoint to filter establishments by type and zone
    @GetMapping("/filter")
    public ResponseEntity<List<Etablissement>> filterEtablissements(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String zone) {

        TypeEtablissement typeEnum = null;
        Zone zoneEnum = null;

        try {
            if (type != null && !type.isBlank()) {
                typeEnum = TypeEtablissement.fromLabel(type);
            }
            if (zone != null && !zone.isBlank()) {
                // zoneEnum = Zone.valueOf(zone); // Directly use enum value
                zoneEnum = Zone.fromName(zone);
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(
                etablissementService.getEtablissementsFiltered(zoneEnum, typeEnum));
    }
//Get all establishments endpoint
    @GetMapping("/all")
    public ResponseEntity<List<Etablissement>> getAllEtEtablissement() {
        return ResponseEntity.ok(etablissementService.getAllEtablissements());
    }

    // Endpoint to get ALL spaces for an establishment
    @GetMapping("/{id}/espaces")
    public ResponseEntity<?> getAllEspacesForEtablissement(@PathVariable String id) {
        System.out.println("Received ID for all spaces: " + id);

        if (!etablissementRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        List<Espace> espaces = etablissementService.getAllEspacesForEtablissement(id);
        return ResponseEntity.ok(espaces);
    }

    // Endpoint to get FILTERED spaces for an establishment
    @GetMapping("/{id}/espaces/filter")
    public ResponseEntity<?> getFilteredEspacesForEtablissement(
            @PathVariable String id,
            @RequestParam(required = false) String categorie,
            @RequestParam(required = false) String type) {

        System.out.println("Received ID for filtered spaces: " + id);
        System.out.println("Filters - categorie: " + categorie + ", type: " + type);

        if (!etablissementRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // Normalize parameters
        if (categorie != null && categorie.isBlank()) {
            categorie = null;
        }
        if (type != null && type.isBlank()) {
            type = null;
        }

        // Handle "All categories" case
        if (categorie != null && categorie.equalsIgnoreCase("Toutes les catégories")) {
            categorie = null;
        }

        List<Espace> espaces = etablissementService.getFilteredEspacesForEtablissement(id, categorie, type);
        return ResponseEntity.ok(espaces);
    }

    // GET Single Establishment by id Endpoint
    @GetMapping("/id/{id}")
    public ResponseEntity<Etablissement> getEtablissementById(@PathVariable String id) {
        try {
            Etablissement etablissement = etablissementService.getEtablissementById(id);
            if (etablissement != null) {
                return ResponseEntity.ok(etablissement);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // GET Single Space Endpoint
    @GetMapping("/espaces/id/{id}")
    public ResponseEntity<Espace> getEspaceById(@PathVariable String id) {
        try {
            Espace espace = espaceService.getEspaceById(id);
            if (espace != null) {
                return ResponseEntity.ok(espace);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
