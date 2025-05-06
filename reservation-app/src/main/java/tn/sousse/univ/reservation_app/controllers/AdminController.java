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

    // Add sub-admins
    @PostMapping("/addSousAdmins")
    public ResponseEntity<?> addSubAdmins(@RequestBody User user) {
        try {
            System.out.println("Reçu: " + user.toString()); // Log les données reçues

            if (user.getRole() != Role.SECRETAIRE_GENERALE && user.getRole() != Role.RESPONSABLE_SALLE) {
                return ResponseEntity.badRequest()
                        .body("Seuls les rôles SECRETAIRE_GENERALE ou RESPONSABLE_SALLE sont autorisés");
            }

            User created = userService.registerUser(user);
            System.out.println("Créé: " + created.toString()); // Log la réponse
            return ResponseEntity.ok(created);

        } catch (Exception e) {
            System.err.println("Erreur: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("Erreur serveur: " + e.getMessage());
        }
    }

    // Add a new space
    // Dans le contrôleur
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