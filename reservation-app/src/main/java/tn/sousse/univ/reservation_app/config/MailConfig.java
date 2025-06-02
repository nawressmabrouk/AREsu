package tn.sousse.univ.reservation_app.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration // Marks this class as a Spring configuration class
public class MailConfig {

    @Value("${spring.mail.username}") // Injects email username from application.properties
    private String username;

    @Value("${spring.mail.password}") // Injects email password from application.properties
    private String password;

    @Value("${spring.mail.host}") // Injects SMTP host (e.g., smtp.gmail.com)
    private String host;

    @Value("${spring.mail.port}") // Injects SMTP port (e.g., 587 for TLS)
    private int port;

    @Value("${spring.mail.properties.mail.smtp.auth}") // Enables/disables SMTP authentication
    private boolean smtpAuth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable}") // Enables/disables STARTTLS
    private boolean starttlsEnable;

    @Bean // Creates and configures a JavaMailSender bean
    public JavaMailSender getJavaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl(); // Creates mail sender instance
        mailSender.setHost(host); // Sets SMTP host
        mailSender.setPort(port); // Sets SMTP port
        mailSender.setUsername(username); // Sets email username
        mailSender.setPassword(password); // Sets email password

        Properties props = mailSender.getJavaMailProperties(); // Gets mail properties
        props.put("mail.smtp.auth", smtpAuth); // Configures SMTP auth
        props.put("mail.smtp.starttls.enable", starttlsEnable); // Configures STARTTLS
        props.put("mail.transport.protocol", "smtp"); // Sets protocol to SMTP

        return mailSender; // Returns configured mail sender
    }
}