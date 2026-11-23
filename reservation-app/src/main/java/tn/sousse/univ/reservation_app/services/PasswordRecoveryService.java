package tn.sousse.univ.reservation_app.services;

import java.util.Date;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import tn.sousse.univ.reservation_app.models.PasswordResetToken;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.repositories.PasswordResetTokenRepository;
import tn.sousse.univ.reservation_app.repositories.UserRepository;

@Service
@RequiredArgsConstructor
public class PasswordRecoveryService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PasswordRecoveryService.class);

    // Public URL of the Angular app, used in the reset link (APP_FRONTEND_URL)
    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    // Sender address = the application's mail account (MAIL_USERNAME)
    @Value("${spring.mail.username:}")
    private String mailFrom;

    // Processes a password reset request by generating and sending a reset token
    public void processPasswordResetRequest(String email) {
        System.out.println("Traitement de l'email : " + email);
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            System.out.println("Email non trouvé, sortie silencieuse");
            return;
        }
        System.out.println("Email trouvé, génération du token...");
        tokenRepository.deleteByEmail(email);
        PasswordResetToken resetToken = new PasswordResetToken(email);
        tokenRepository.save(resetToken);
        try {
            sendResetEmail(email, resetToken.getToken());
            System.out.println("Email envoyé avec succès");
        } catch (Exception e) {
            System.out.println("Échec d'envoi d'email : " + e.getMessage());
        }
    }

    // Validates a reset token and updates the user's password if valid
    public void validateTokenAndResetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token invalide"));

        if (resetToken.getExpiryDate().before(new Date())) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("Token expiré");
        }

        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        tokenRepository.delete(resetToken);
    }

    // Sends a password reset email containing the reset token
    private void sendResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        if (!emailService.isEnabled()) {
            // Local development without SMTP: the link is only written to the server log
            log.warn("Envoi d'e-mails désactivé : lien de réinitialisation pour {} : {}", toEmail, resetLink);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(toEmail);
        message.setSubject("Réinitialisation de mot de passe");
        message.setText("Cliquez sur ce lien pour réinitialiser votre mot de passe:\n"
                + resetLink
                + "\nCe lien expirera dans 15 minutes.");

        mailSender.send(message);
    }
}
