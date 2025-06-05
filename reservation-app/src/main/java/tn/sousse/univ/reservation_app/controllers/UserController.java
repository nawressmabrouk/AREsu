package tn.sousse.univ.reservation_app.controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
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
import tn.sousse.univ.reservation_app.security.JwtUtil;
import tn.sousse.univ.reservation_app.services.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@RestController
@RequestMapping("/api/utilisateurs")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil; // Nom de variable cohérent

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    // Register a new user after checking if the email already exists
@PostMapping("/inscription")
    public ResponseEntity<?> inscrireUtilisateur(@RequestBody UserDTO userDTO) {
        try {
            logger.info("Starting registration for: {}", userDTO.getEmail());
            
            if (userService.emailExists(userDTO.getEmail())) {
                return ResponseEntity
                        .badRequest()
                        .body("Cet email existe déjà");
            }

            User user = UserMapper.toEntity(userDTO);
            User savedUser = userService.registerUser(user);
            
            logger.info("Registration successful for: {}", savedUser.getEmail());
            return ResponseEntity.ok(UserMapper.toDTO(savedUser));
            
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Cet email existe déjà")) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
            logger.error("Registration failed", e);
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }


    // Retrieve all users filtered by specific role (converted to DTOs)
    @GetMapping("/parRole/{role}")
    public List<UserDTO> trouverParRole(@PathVariable Role role) {
        return userService.trouverParRole(role).stream()
                .map(UserMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Retrieve a user by their email (converted to DTO)
    @GetMapping("/email/{email}")
    public Optional<UserDTO> getUserByEmail(@PathVariable String email) {
        return userService.getUserByEmail(email).map(UserMapper::toDTO);
    }

    //Updates authenticated user's profile and returns refreshed JWT
    @PutMapping("/modifierProfil")
    public ResponseEntity<UserDTO> modifierProfil(@RequestBody UserDTO updatedDTO, Authentication authentication) {
        String email = authentication.getName();
        User existingUser = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        existingUser.setNom(updatedDTO.getNom());
        existingUser.setPrenom(updatedDTO.getPrenom());
        existingUser.setNumTel(updatedDTO.getNumTel());
        existingUser.setFonction(updatedDTO.getFonction());
        existingUser.setNomEtablissement(updatedDTO.getNomEtablissement());
        existingUser.setStructure(updatedDTO.getStructure());
        existingUser.setLinkedInLink(updatedDTO.getLinkedInLink());

        if (updatedDTO.getRole() != null) {
            try {
                Role newRole = Role.fromString(updatedDTO.getRole());
                if (isDemandeur(existingUser.getRole()) && isDemandeur(newRole)) {
                    existingUser.setRole(newRole);
                }
            } catch (IllegalArgumentException e) {
                
            }
        }

        User updatedUser = userService.updateUserProfile(existingUser);

        String newToken = jwtUtil.generateToken(updatedUser);

        return ResponseEntity.ok()
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + newToken)
                .body(UserMapper.toDTO(updatedUser));
    }

    // helper method that Checks if the role is either DEMANDEUR_INTERNE or DEMANDEUR_EXTERNE
    private boolean isDemandeur(Role role) {
        return role == Role.DEMANDEUR_INTERNE || role == Role.DEMANDEUR_EXTERNE;
    }


    // Returns complete profile of currently authenticated user
    @GetMapping("/voirProfil")
    public ResponseEntity<UserDTO> voirProfilConnecte(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        System.out.println("User entity etablissementId: " + user.getEtablissementId());

        UserDTO dto = UserMapper.toDTO(user);

        // Debug logging
        System.out.println("DTO etablissementId: " + dto.getEtablissementId());

        return ResponseEntity.ok(dto);
    }

    // Changes password after validating current credentials
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

    //Activates user account using verification token (time-sensitive)
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
