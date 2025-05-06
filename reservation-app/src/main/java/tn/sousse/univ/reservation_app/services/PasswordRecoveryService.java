
package tn.sousse.univ.reservation_app.services;

import java.util.Date;
import java.util.Optional;

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

    private void sendResetEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("REDACTED_OLD_APP_EMAIL");
        message.setTo(toEmail);
        message.setSubject("Réinitialisation de mot de passe");
        message.setText("Cliquez sur ce lien pour réinitialiser votre mot de passe:\n"
                + "http://localhost:4200/reset-password?token=" + token
                + "\nCe lien expirera dans 15 minutes.");

        mailSender.send(message);
    }
}
