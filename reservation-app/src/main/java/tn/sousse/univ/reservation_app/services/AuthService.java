package tn.sousse.univ.reservation_app.services;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.repositories.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Authenticates user with email and password
    public User authenticateUser(String email, String password) {
        System.out.println("Vérification de l'utilisateur pour l'email : " + email);

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            System.out.println("Utilisateur non trouvé");
            return null;
        }

        User user = userOptional.get();
        System.out.println("Utilisateur trouvé : " + user.getEmail());

        if (user.getPassword() != null && password != null) {
            // Never log passwords or password hashes.
            if (!passwordEncoder.matches(password, user.getPassword())) {
                System.out.println("Mot de passe incorrect");
                return null;
            }

            System.out.println("Mot de passe correct");
        } else {
            System.out.println("Identifiants manquants");
            return null;
        }

        if (!user.isEnabled()) {
            throw new org.springframework.security.authentication.DisabledException(
                    "Votre compte n’est pas activé. Veuillez vérifier votre email.");
        }

        return user;
    }

}
