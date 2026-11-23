package tn.sousse.univ.reservation_app.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.repositories.UserRepository;
import tn.sousse.univ.reservation_app.security.PasswordPolicy;

/**
 * Creates the first SUPER_ADMIN account from the ADMIN_USERNAME / ADMIN_PASSWORD
 * environment variables, when no SUPER_ADMIN exists yet. There are no default
 * credentials: the application refuses to start if the password is weak, or if
 * no SUPER_ADMIN exists and the variables are missing. An existing account is
 * never modified.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public AdminBootstrap(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap-admin.username:}") String username,
            @Value("${app.bootstrap-admin.password:}") String password) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username == null ? "" : username.trim();
        this.password = password == null ? "" : password;
    }

    /** Fail fast, before any database access, if a weak password is configured. */
    @PostConstruct
    void validateConfiguration() {
        if (!password.isEmpty()) {
            List<String> problems = PasswordPolicy.validate(password, username);
            if (!problems.isEmpty()) {
                throw new IllegalStateException(
                        "ADMIN_PASSWORD est trop faible : " + String.join(" ; ", problems)
                                + ". Démarrage refusé.");
            }
        }
        if (!username.isEmpty() && !username.contains("@")) {
            throw new IllegalStateException(
                    "ADMIN_USERNAME doit être une adresse e-mail (la connexion se fait par e-mail). Démarrage refusé.");
        }
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.findByRole(Role.SUPER_ADMIN).isEmpty()) {
            log.info("Compte SUPER_ADMIN déjà présent : création initiale ignorée.");
            if (!password.isEmpty()) {
                log.warn("ADMIN_PASSWORD est encore défini alors qu'il n'est plus utilisé : "
                        + "vous pouvez le retirer de votre fichier .env.");
            }
            return;
        }

        if (username.isEmpty() || password.isEmpty()) {
            throw new IllegalStateException(
                    "Aucun compte SUPER_ADMIN n'existe. Définissez ADMIN_USERNAME (e-mail) et "
                            + "ADMIN_PASSWORD dans reservation-app/.env (voir .env.example). Démarrage refusé.");
        }
        if (userRepository.existsByEmail(username)) {
            throw new IllegalStateException(
                    "ADMIN_USERNAME correspond déjà à un compte existant qui n'est pas SUPER_ADMIN. "
                            + "Choisissez une autre adresse. Démarrage refusé.");
        }

        User admin = new User();
        admin.setEmail(username);
        admin.setNom("Administrateur");
        admin.setPrenom("Super");
        admin.setRole(Role.SUPER_ADMIN);
        admin.setPassword(passwordEncoder.encode(password)); // BCrypt
        admin.setEnabled(true);
        admin.setPasswordChangeRequired(false);
        userRepository.save(admin);

        log.info("Compte SUPER_ADMIN initial créé pour {}.", username);
    }
}
