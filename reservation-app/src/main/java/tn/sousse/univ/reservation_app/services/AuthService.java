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
            System.out.println("Vérification du mot de passe...");
            System.out.println("Mot de passe haché en base : " + user.getPassword());
            System.out.println("Mot de passe saisi : " + password);
    
            if (!passwordEncoder.matches(password, user.getPassword())) {
                System.out.println("Mot de passe incorrect");
                return null;
            }
    
            System.out.println("Mot de passe correct");
        } else {
            System.out.println("Identifiants manquants");
            return null;
        }
    
        return user;
    }
    

}
