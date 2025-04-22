package tn.sousse.univ.reservation_app.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tn.sousse.univ.reservation_app.dto.EtablissementWithEspacesDTO;
import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.models.TypeEtablissement;
import tn.sousse.univ.reservation_app.models.Zone;
import tn.sousse.univ.reservation_app.services.EtablissementService;

@RestController
@RequestMapping("/api/etablissements")
public class EtablissementController {

    private final EtablissementService etablissementService;

    public EtablissementController(EtablissementService etablissementService) {
        this.etablissementService = etablissementService;
    }

    @GetMapping("/with-espaces")
    public List<EtablissementWithEspacesDTO> getEtablissementsWithEspaces() {
        return etablissementService.getEtablissementsWithEspaces();
    }

    @GetMapping("/filter")
    public List<EtablissementWithEspacesDTO> filterByZoneAndType(
            @RequestParam(required = false) String zoneLabel,
            @RequestParam(required = false) String typeLabel) {

        Zone zone = zoneLabel != null ? Zone.fromLabel(zoneLabel) : null;
        TypeEtablissement type = typeLabel != null ? TypeEtablissement.fromLabel(typeLabel) : null;

        return etablissementService.getEtablissementsFiltered(zone, type);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Etablissement>> getAllEtEtablissement() {
        return ResponseEntity.ok(etablissementService.getAllEtablissements());
    }

}
