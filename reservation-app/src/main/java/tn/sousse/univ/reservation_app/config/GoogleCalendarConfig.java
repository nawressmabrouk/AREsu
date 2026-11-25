package tn.sousse.univ.reservation_app.config;

import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;

import lombok.Getter;
import lombok.Setter;

@Configuration // Spring configuration class for Google Calendar setup
@ConfigurationProperties(prefix = "google.calendar") // Binds properties with prefix google.calendar
@Getter // Auto-generates getters
@Setter // Auto-generates setters
public class GoogleCalendarConfig {

    private static final Logger log = LoggerFactory.getLogger(GoogleCalendarConfig.class);

    private String apiKey; // Google Calendar API key
    private Resource serviceAccountKey; // Service account key file resource
    private String apiBaseUrl = "https://www.googleapis.com/calendar/v3"; // Default API base URL

    /** True when the service-account key file exists and is readable. */
    public boolean isServiceAccountKeyAvailable() {
        return serviceAccountKey != null && serviceAccountKey.exists() && serviceAccountKey.isReadable();
    }

    /**
     * Google Calendar client. Returns null (the integration is disabled, startup
     * continues) when the service-account key is missing or invalid.
     */
    @Bean
    public Calendar calendarService() throws GeneralSecurityException {
        if (!isServiceAccountKeyAvailable()) {
            log.warn("Google Calendar désactivé : clé du compte de service introuvable ({}). "
                    + "Définissez GOOGLE_SERVICE_ACCOUNT_KEY_FILE pour l'activer.", serviceAccountKey);
            return null;
        }
        try (InputStream in = serviceAccountKey.getInputStream()) {
            final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport(); // Create secure transport
            GoogleCredentials credentials = GoogleCredentials.fromStream(in)
                    .createScoped("https://www.googleapis.com/auth/calendar"); // Set required scope
            return new Calendar.Builder(httpTransport, GsonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName("ReservationApp") // Set app name
                    .build(); // Build Calendar service
        } catch (IOException e) {
            log.warn("Google Calendar désactivé : clé du compte de service invalide ({}).", e.getMessage());
            return null;
        }
    }
}
