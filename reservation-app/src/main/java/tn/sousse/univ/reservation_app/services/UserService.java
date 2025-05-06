package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.models.VerificationToken;
import tn.sousse.univ.reservation_app.repositories.UserRepository;
import tn.sousse.univ.reservation_app.repositories.VerificationTokenRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private EmailService emailService;

    public User getUserById(String id) {
        return userRepository.findById(id).orElse(null);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> trouverParRole(Role role) {
        return userRepository.findByRole(role);
    }

    // Charger le contenu du template email
    private String loadEmailTemplate(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            byte[] bytes = Files.readAllBytes(resource.getFile().toPath());
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (IOException e) {
            e.printStackTrace();
            return "";
        }
    }

    public User registerUser(User user) {
        // Check if email exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Cet email existe déjà");
        }

        user.setEnabled(false);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);

        String token = UUID.randomUUID().toString();
        verificationTokenRepository.save(new VerificationToken(token, savedUser.getId()));

        String activationLink = "http://localhost:8080/api/utilisateurs/activer?token=" + token;
        String htmlTemplate = loadEmailTemplate("templates/activation-email.html");
        String htmlContent = htmlTemplate.replace("{{activation_link}}", activationLink);

        emailService.sendHtmlEmail(savedUser.getEmail(),
                "Activation de votre compte",
                htmlContent);

        return savedUser;
    }

    public User authenticateUser(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty())
            return null;

        User user = userOptional.get();

        if (!passwordEncoder.matches(password, user.getPassword())) {
            return null;
        }

        return user;
    }

    public User updateUserProfile(User updatedData) {
        User currentUser = getCurrentUser();
        currentUser.setNom(updatedData.getNom());
        currentUser.setPrenom(updatedData.getPrenom());
        currentUser.setNumTel(updatedData.getNumTel());
        currentUser.setFonction(updatedData.getFonction());
        currentUser.setNomEtablissement(updatedData.getNomEtablissement());
        currentUser.setStructure(updatedData.getStructure());
        currentUser.setLinkedInLink(updatedData.getLinkedInLink());

        return userRepository.save(currentUser);
    }

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

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
        userRepository.save(user);
    }

    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }

}