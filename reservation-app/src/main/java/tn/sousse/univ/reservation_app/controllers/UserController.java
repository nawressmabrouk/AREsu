package tn.sousse.univ.reservation_app.controllers;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tn.sousse.univ.reservation_app.dto.UserDTO;
import tn.sousse.univ.reservation_app.mappers.UserMapper;
import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.services.UserService;

@RestController
@RequestMapping("/api/utilisateurs")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/inscription")
    public UserDTO inscrireUtilisateur(@RequestBody UserDTO userDTO) {
        User user = UserMapper.toEntity(userDTO);
        User savedUser = userService.registerUser(user);
        return UserMapper.toDTO(savedUser);
    }

    @GetMapping("/parRole/{role}")
    public List<UserDTO> trouverParRole(@PathVariable Role role) {
        return userService.trouverParRole(role).stream()
                .map(UserMapper::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/email/{email}")
    public Optional<UserDTO> getUserByEmail(@PathVariable String email) {
        return userService.getUserByEmail(email).map(UserMapper::toDTO);
    }

    @PutMapping("/modifierProfil")
    public ResponseEntity<UserDTO> modifierProfil(@RequestBody UserDTO updatedDTO) {
        User updatedData = UserMapper.toEntity(updatedDTO);
        User updatedUser = userService.updateUserProfile(updatedData);
        return ResponseEntity.ok(UserMapper.toDTO(updatedUser));
    }

    @GetMapping("/voirProfil")
    public ResponseEntity<UserDTO> voirProfilConnecte(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        return ResponseEntity.ok(UserMapper.toDTO(user));
    }

    @PostMapping("/changer-mot-de-passe")
    public ResponseEntity<?> changerMotDePasse(@RequestParam String ancienMotDePasse,
            @RequestParam String nouveauMotDePasse) {
        try {
            userService.changerMotDePasse(ancienMotDePasse, nouveauMotDePasse);
            return ResponseEntity.ok("Mot de passe modifié avec succès !");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

}
