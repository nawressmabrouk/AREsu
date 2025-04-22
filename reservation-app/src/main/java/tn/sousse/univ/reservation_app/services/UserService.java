package tn.sousse.univ.reservation_app.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.repositories.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User getUserById(String id) {
        return userRepository.findById(id).orElse(null);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> trouverParRole(Role role) {
        return userRepository.findByRole(role);
    }

    public User registerUser(User user) {
        // Vérifie si l'utilisateur existe déjà
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Un utilisateur avec cet email existe déjà.");
        }

        // Hachage du mot de passe avant enregistrement
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Sauvegarde de l'utilisateur
        return userRepository.save(user);

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

    public boolean changerMotDePasse(String ancienMotDePasse, String nouveauMotDePasse) {
        User currentUser = getCurrentUser();

        if (!passwordEncoder.matches(ancienMotDePasse, currentUser.getPassword())) {
            throw new RuntimeException("Ancien mot de passe incorrect");
        }

        currentUser.setPassword(passwordEncoder.encode(nouveauMotDePasse));
        userRepository.save(currentUser);
        return true;
    }

}