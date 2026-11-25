package tn.sousse.univ.reservation_app.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    // Spring's mail sender for email operations
    @Autowired
    private JavaMailSender mailSender;

    // Sender address = the application's mail account (MAIL_USERNAME)
    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    /** True when MAIL_USERNAME and MAIL_PASSWORD are configured; otherwise e-mails are skipped. */
    public boolean isEnabled() {
        return !mailFrom.isBlank() && !mailPassword.isBlank();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logStatus() {
        if (isEnabled()) {
            log.info("Envoi d'e-mails activé.");
        } else {
            log.warn("Envoi d'e-mails désactivé : MAIL_USERNAME / MAIL_PASSWORD non définis. "
                    + "Les liens d'activation et de réinitialisation seront écrits dans ce journal.");
        }
    }

    // Sends simple text email
    public void sendEmail(String to, String subject, String body) {
        if (!isEnabled()) {
            log.warn("Envoi d'e-mails désactivé : « {} » non envoyé à {}", subject, to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        if (!mailFrom.isBlank()) message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
            System.out.println("Email sent successfully to " + to);
        } catch (Exception e) {
            e.printStackTrace(); // Handle the exception
            System.out.println("Error sending email to " + to);
        }
    }

    // Sends HTML formatted email
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        if (!isEnabled()) {
            log.warn("Envoi d'e-mails désactivé : « {} » non envoyé à {}", subject, to);
            return;
        }
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            if (!mailFrom.isBlank()) helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true pour dire que c’est du HTML
            mailSender.send(message);
            System.out.println("Email HTML envoyé avec succès à " + to);
        } catch (MessagingException e) {
            e.printStackTrace();
            System.out.println("Erreur d'envoi d'email HTML à " + to);
        }
    }

}
