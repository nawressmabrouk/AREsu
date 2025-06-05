package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronizationAdapter;
import org.springframework.transaction.support.TransactionTemplate;

import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.models.VerificationToken;
import tn.sousse.univ.reservation_app.repositories.UserRepository;
import tn.sousse.univ.reservation_app.repositories.VerificationTokenRepository;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
@Service
public class UserService {

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    // Registers a new user with email verification
@Transactional
   public User registerUser(User user) {
        try {
            // 1. Validate and save user
            if (userRepository.existsByEmail(user.getEmail())) {
                throw new RuntimeException("Cet email existe déjà");
            }
            
            user.setEnabled(false);
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            User savedUser = userRepository.save(user);
            
            // 2. Create and save verification token
            String token = UUID.randomUUID().toString();
            verificationTokenRepository.save(new VerificationToken(token, savedUser.getId()));
            
            // 3. Send email asynchronously (won't affect transaction)
            try {
                sendActivationEmailAsync(savedUser, token);
            } catch (Exception e) {
                logger.error("Failed to send activation email, but user was registered", e);
            }
            
            return savedUser;
        } catch (Exception e) {
            logger.error("Registration failed", e);
            throw e;
        }
    }

    @Async
    public void sendActivationEmailAsync(User user, String token) {
        String activationLink = "http://localhost:8080/api/utilisateurs/activer?token=" + token;
        String htmlTemplate = loadEmailTemplate("templates/activation-email.html");
        String htmlContent = htmlTemplate.replace("{{activation_link}}", activationLink);
        emailService.sendHtmlEmail(user.getEmail(),
                "Activation de votre compte",
                htmlContent);
    }

    
    // Creates user accounts by admin with auto-generated password
    public User registerAdminCreatedUser(User user) {
        String plainPassword = generateRandomPassword(12);
        return handleUserRegistration(user, true, plainPassword);
    }

    // Core user registration logic handling both admin and self-registration
    private User handleUserRegistration(User user, boolean isAdminCreation, String plainPassword) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Cet email existe déjà");
        }

        user.setEnabled(isAdminCreation);
        user.setPasswordChangeRequired(isAdminCreation);

        if (isAdminCreation && plainPassword != null) {
            user.setPassword(passwordEncoder.encode(plainPassword));
        } else {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        User savedUser = userRepository.save(user);

        if (isAdminCreation) {
            sendAdminCreationEmail(savedUser, plainPassword);
        } else {
            sendActivationEmail(savedUser);
        }

        return savedUser;
    }

    // Sends account activation email with verification link
    private void sendActivationEmail(User user) {
        try {
            String token = UUID.randomUUID().toString();
            verificationTokenRepository.save(new VerificationToken(token, user.getId()));

            String activationLink = "http://localhost:8080/api/utilisateurs/activer?token=" + token;
            String htmlTemplate = loadEmailTemplate("templates/activation-email.html");
            String htmlContent = htmlTemplate
                    .replace("{{activation_link}}", activationLink)
                    .replace("{{user.prenom}}", user.getPrenom());

            emailService.sendHtmlEmail(user.getEmail(),
                    "Activation de votre compte",
                    htmlContent);
        } catch (Exception e) {
            throw new RuntimeException("Échec de l'envoi de l'email d'activation", e);
        }
    }

    // Sends welcome email for admin-created accounts
    private void sendAdminCreationEmail(User user, String plainPassword) {
        try {
            String htmlTemplate = loadEmailTemplate("templates/admin-creation-email.html");
            String htmlContent = htmlTemplate
                    .replace("{{user.prenom}}", user.getPrenom())
                    .replace("{{email}}", user.getEmail())
                    .replace("{{password}}", plainPassword);

            emailService.sendHtmlEmail(user.getEmail(),
                    "Création de votre compte par l'administrateur",
                    htmlContent);
        } catch (Exception e) {
            throw new RuntimeException("Échec de l'envoi de l'email d'administration", e);
        }
    }

    // Generates secure random password string
    public String generateRandomPassword(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
        return new Random().ints(length, 0, chars.length())
                .mapToObj(i -> String.valueOf(chars.charAt(i)))
                .collect(Collectors.joining());
    }

    // Retrieves user by ID
    public User getUserById(String id) {
        return userRepository.findById(id).orElse(null);
    }

    // Finds user by email address
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Gets all users with specified role
    public List<User> trouverParRole(Role role) {
        return userRepository.findByRole(role);
    }

    // Loads HTML email template from resources
    private String loadEmailTemplate(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            byte[] bytes = Files.readAllBytes(resource.getFile().toPath());
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Erreur de chargement du template email", e);
        }
    }

    // Validates user credentials
    public User authenticateUser(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty())
            return null;

        User user = userOptional.get();
        return passwordEncoder.matches(password, user.getPassword()) ? user : null;
    }

    // Updates user profile information
    public User updateUserProfile(User updatedData) {
        User currentUser = getCurrentUser();
        currentUser.setNom(updatedData.getNom());
        currentUser.setPrenom(updatedData.getPrenom());
        currentUser.setNumTel(updatedData.getNumTel());
        currentUser.setFonction(updatedData.getFonction());
        currentUser.setNomEtablissement(updatedData.getNomEtablissement());
        currentUser.setStructure(updatedData.getStructure());
        currentUser.setLinkedInLink(updatedData.getLinkedInLink());
        currentUser.setEtablissementId(updatedData.getEtablissementId());
        // Handle role change only for demandeurs
        if (updatedData.getRole() != null) {
            Role currentRole = currentUser.getRole();
            Role newRole = updatedData.getRole();

            if ((currentRole == Role.DEMANDEUR_INTERNE || currentRole == Role.DEMANDEUR_EXTERNE) &&
                    (newRole == Role.DEMANDEUR_INTERNE || newRole == Role.DEMANDEUR_EXTERNE)) {
                currentUser.setRole(newRole);
            }
        }
        return userRepository.save(currentUser);
    }

    // Gets currently authenticated user
    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    // Handles password change with validation
    public void changerMotDePasse(String email, String ancienMotDePasse, String nouveauMotDePasse) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(ancienMotDePasse, user.getPassword())) {
            throw new SecurityException("Ancien mot de passe incorrect");
        }

        if (nouveauMotDePasse == null || nouveauMotDePasse.length() < 8) {
            throw new IllegalArgumentException("Le nouveau mot de passe doit contenir au moins 8 caractères");
        }

        user.setPassword(passwordEncoder.encode(nouveauMotDePasse));
        user.setPasswordChangeRequired(false); // Réinitialiser le flag après changement
        userRepository.save(user);
    }

    // Checks if email is already registered
    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }
}