/*package tn.sousse.univ.reservation_app.config;

import java.io.FileInputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.calendar.Calendar;

@Configuration
public class GoogleCalendarConfig {

    private static final String APPLICATION_NAME = "ReservationApp";
    private static final String SERVICE_ACCOUNT_KEY_PATH = "src/main/resources/service-account.json";

    @Bean
    public Calendar googleCalendar() throws GeneralSecurityException, IOException {
        HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        JsonFactory jsonFactory = JacksonFactory.getDefaultInstance();

        GoogleCredential credential = GoogleCredential.fromStream(new FileInputStream(SERVICE_ACCOUNT_KEY_PATH))
                .createScoped(Collections.singletonList("https://www.googleapis.com/auth/calendar"));

        return new Calendar.Builder(httpTransport, jsonFactory, credential)
                .setApplicationName(APPLICATION_NAME)
                .build();
    }
}*/

package tn.sousse.univ.reservation_app.config;

import java.io.IOException;
import java.security.GeneralSecurityException;

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

@Configuration
@ConfigurationProperties(prefix = "google.calendar")
@Getter
@Setter
public class GoogleCalendarConfig {

    // Configuration properties
    private String apiKey;
    private Resource serviceAccountKey;
    private String calendarId;
    private String apiBaseUrl = "https://www.googleapis.com/calendar/v3";

    // Bean creation
    @Bean
    public Calendar calendarService() throws GeneralSecurityException, IOException {
        final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

        GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccountKey.getInputStream())
                .createScoped("https://www.googleapis.com/auth/calendar");

        return new Calendar.Builder(
                httpTransport,
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("ReservationApp")
                .build();
    }

    // Getters and setters for properties
    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public Resource getServiceAccountKeyResource() {
        return serviceAccountKey;
    }

    public void setServiceAccountKey(Resource serviceAccountKey) {
        this.serviceAccountKey = serviceAccountKey;
    }

    public String getCalendarId() {
        return calendarId;
    }

    public void setCalendarId(String calendarId) {
        this.calendarId = calendarId;
    }

    public String getApiBaseUrl() {
        return apiBaseUrl;
    }

    public void setApiBaseUrl(String apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
    }

}
