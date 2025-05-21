package tn.sousse.univ.reservation_app.controllers;

import java.util.Collections;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import tn.sousse.univ.reservation_app.dto.SuperAdminEtablissementDTO;
import tn.sousse.univ.reservation_app.services.SuperAdminService;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    @GetMapping("/etablissements")
    public ResponseEntity<List<SuperAdminEtablissementDTO>> getAllEtablissements() {
        List<SuperAdminEtablissementDTO> etablissements = superAdminService.getAllEtablissementsWithDetails();
        return ResponseEntity.ok(etablissements);
    }

    @GetMapping("/etablissements/{id}")
    public ResponseEntity<SuperAdminEtablissementDTO> getEtablissementDetails(
            @PathVariable String id) {
        SuperAdminEtablissementDTO etablissement = superAdminService.getEtablissementDetails(id);
        return ResponseEntity.ok(etablissement);
    }
  
}