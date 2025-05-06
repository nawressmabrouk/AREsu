package tn.sousse.univ.reservation_app.controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
import tn.sousse.univ.reservation_app.models.VerificationToken;
import tn.sousse.univ.reservation_app.repositories.UserRepository;
import tn.sousse.univ.reservation_app.repositories.VerificationTokenRepository;
import tn.sousse.univ.reservation_app.services.UserService;

@RestController
@RequestMapping("/api/utilisateurs")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;
    /*
     * @PostMapping("/inscription")
     * public UserDTO inscrireUtilisateur(@RequestBody UserDTO userDTO) {
     * User user = UserMapper.toEntity(userDTO);
     * User savedUser = userService.registerUser(user);
     * return UserMapper.toDTO(savedUser);
     * }
     */

    @PostMapping("/inscription")
    public ResponseEntity<?> inscrireUtilisateur(@RequestBody UserDTO userDTO) {
        // Check if email exists first
        if (userService.emailExists(userDTO.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body("Cet email existe déjà");
        }

        User user = UserMapper.toEntity(userDTO);
        User savedUser = userService.registerUser(user);
        return ResponseEntity.ok(UserMapper.toDTO(savedUser));
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
    public ResponseEntity<UserDTO> modifierProfil(@RequestBody UserDTO updatedDTO, Authentication authentication) {
        String email = authentication.getName(); // Récupère l'email de l'utilisateur connecté
        User existingUser = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Mettre à jour uniquement les champs autorisés
        existingUser.setNom(updatedDTO.getNom());
        existingUser.setPrenom(updatedDTO.getPrenom());
        existingUser.setNumTel(updatedDTO.getNumTel());
        existingUser.setFonction(updatedDTO.getFonction());
        existingUser.setNomEtablissement(updatedDTO.getNomEtablissement());
        existingUser.setStructure(updatedDTO.getStructure());
        existingUser.setLinkedInLink(updatedDTO.getLinkedInLink());

        User updatedUser = userService.updateUserProfile(existingUser);
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
    public ResponseEntity<?> changerMotDePasse(
            @RequestBody Map<String, String> requestBody,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            String ancienMotDePasse = requestBody.get("ancienMotDePasse");
            String nouveauMotDePasse = requestBody.get("nouveauMotDePasse");

            if (ancienMotDePasse == null || nouveauMotDePasse == null) {
                return ResponseEntity.badRequest()
                        .body("Les champs 'ancienMotDePasse' et 'nouveauMotDePasse' sont requis");
            }

            userService.changerMotDePasse(email, ancienMotDePasse, nouveauMotDePasse);
            return ResponseEntity.ok("Mot de passe modifié avec succès !");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/activer")
    public ResponseEntity<String> activerCompte(@RequestParam String token) {
        Optional<VerificationToken> optionalToken = verificationTokenRepository.findByToken(token);

        if (optionalToken.isEmpty() || optionalToken.get().getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Token invalide ou expiré.");
        }

        VerificationToken verificationToken = optionalToken.get();
        Optional<User> optionalUser = userRepository.findById(verificationToken.getUserId());

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body("Utilisateur introuvable.");
        }

        User user = optionalUser.get();
        user.setEnabled(true);
        userRepository.save(user);

        verificationTokenRepository.delete(verificationToken); // suppression du token

        return ResponseEntity.ok("Votre compte a été activé avec succès !");
    }

}
