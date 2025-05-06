package tn.sousse.univ.reservation_app.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tn.sousse.univ.reservation_app.dto.UserDTO;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.services.AdminService;
import tn.sousse.univ.reservation_app.services.UserService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")

public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserService userService;


    //add sous admin 

    @PostMapping("/addSousAdmins")
    public ResponseEntity<?> addSubAdmins(@RequestBody UserDTO userDto) {
        try {
            // Validation du rôle
            Role role;
            try {
                role = Role.valueOf(userDto.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                    .body("Rôle invalide : " + userDto.getRole());
            }
            
            if (role != Role.SECRETAIRE_GENERALE && role != Role.RESPONSABLE_SALLE) {
                return ResponseEntity.badRequest()
                    .body("Seuls les rôles SECRETAIRE_GENERALE ou RESPONSABLE_SALLE sont autorisés");
            }
    
            // Conversion du DTO vers l'entité User
            User user = convertDtoToUser(userDto, role);
            
            // Création du compte
            User createdUser = userService.registerAdminCreatedUser(user);
            
            return ResponseEntity.ok(createdUser);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Erreur serveur: " + e.getMessage());
        }
    }
    
    private User convertDtoToUser(UserDTO dto, Role role) {
        User user = new User();
        user.setNom(dto.getNom());
        user.setPrenom(dto.getPrenom());
        user.setEmail(dto.getEmail());
        user.setNumTel(dto.getNumTel());
        user.setFonction(dto.getFonction());
        user.setRole(role);
        user.setNomEtablissement(dto.getNomEtablissement());
        user.setStructure(dto.getStructure());
        user.setLinkedInLink(dto.getLinkedInLink());
        user.setEspacesResponsables(dto.getEspacesResponsables());
        return user;
    }

    // Add a new space
@PostMapping("/{responsableId}/ajouterEspace")
public ResponseEntity<?> addSpace(@PathVariable String responsableId, @RequestBody Espace espace) {
    try {
        return ResponseEntity.ok(adminService.ajouterEspace(responsableId, espace));
    } catch (RuntimeException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

    // Modify a space
    @PutMapping("/modifierEspace/{espaceId}")
    public ResponseEntity<Espace> modifySpace(@PathVariable String espaceId, @RequestBody Espace espace) {
        return ResponseEntity.ok(adminService.modifierEspace(espaceId, espace));
    }
    

    // Delete a space
    @DeleteMapping("/{responsableId}/supprimerEspace/{espaceId}")
    public ResponseEntity<String> deleteSpace(@PathVariable String responsableId, @PathVariable String espaceId) {
        adminService.supprimerEspace(responsableId, espaceId);
        return ResponseEntity.ok("Space deleted successfully");
    }

}
