package tn.sousse.univ.reservation_app.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
import tn.sousse.univ.reservation_app.repositories.UserRepository;
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

    @Autowired
    private UserRepository userRepository;

    // add sous admin

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
                        .body("Seul le role RESPONSABLE_SALLE est autorisés");
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

    /*  Delete a space
    @DeleteMapping("/{responsableId}/supprimerEspace/{espaceId}")
    public ResponseEntity<String> deleteSpace(@PathVariable String responsableId, @PathVariable String espaceId) {
        adminService.supprimerEspace(responsableId, espaceId);
        return ResponseEntity.ok("Space deleted successfully");
    }*/

    @DeleteMapping("/{responsableId}/supprimerEspace/{espaceId}")
public ResponseEntity<String> deleteSpace(
    @PathVariable String responsableId,
    @PathVariable String espaceId
) {
    try {
        // Vérifier l'existence avant suppression
        if (!adminService.espaceExists(espaceId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Espace non trouvé");
        }
        
        adminService.supprimerEspace(responsableId, espaceId);
        return ResponseEntity.ok("Suppression réussie");
        
    } catch (Exception e) {
       return ResponseEntity.ok()
        .contentType(MediaType.TEXT_PLAIN) // <-- Forcer le type texte
        .body("Suppression réussie");
       
    }
}

    @GetMapping("/responsables")
    public ResponseEntity<List<User>> getResponsablesSalle() {
        List<User> responsables = adminService.getResponsablesSalle();
        return ResponseEntity.ok(responsables);
    }

    @DeleteMapping("/delete-sous-admins/{adminId}")
    public ResponseEntity<String> deleteSubAdmin(@PathVariable String adminId) {
        try {
            adminService.deleteAdmin(adminId);
            return ResponseEntity.ok("Sous-admin supprimé avec succès");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    @PutMapping("/update-sous-admins/{adminId}")
    public ResponseEntity<User> updateSubAdmin(
            @PathVariable String adminId,
            @RequestBody UserDTO userDto) {
        try {
            User existingUser = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            User updatedUser = convertDtoToUser(userDto, existingUser.getRole());
            return ResponseEntity.ok(adminService.updateAdmin(adminId, updatedUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/espaces")
public ResponseEntity<List<Espace>> getAllEspaces() {
    List<Espace> espaces = adminService.getAllEspaces();
    return ResponseEntity.ok(espaces);
}

}