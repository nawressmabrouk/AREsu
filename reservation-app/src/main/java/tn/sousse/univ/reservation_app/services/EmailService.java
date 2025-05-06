package tn.sousse.univ.reservation_app.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
            System.out.println("Email sent successfully to " + to); // Log success
        } catch (Exception e) {
            e.printStackTrace(); // Handle the exception (e.g., log it)
            System.out.println("Error sending email to " + to); // Log error
        }
    }


    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
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
