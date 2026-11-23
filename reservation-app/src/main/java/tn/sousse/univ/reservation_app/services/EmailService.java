package tn.sousse.univ.reservation_app.services;

import org.springframework.beans.factory.annotation.Value;
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

    // Sends simple text email
    public void sendEmail(String to, String subject, String body) {
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
