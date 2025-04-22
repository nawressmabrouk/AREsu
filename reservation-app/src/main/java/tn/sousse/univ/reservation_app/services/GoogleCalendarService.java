package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.Events;

import tn.sousse.univ.reservation_app.models.Reservation;

@Service
public class GoogleCalendarService {

    @Autowired
    private Calendar googleCalendar;

    private static final String CALENDAR_ID = "REDACTED_OLD_APP_EMAIL";

    public List<String> getUnavailableSlots(Date date) throws IOException {
        List<String> unavailableSlots = new ArrayList<>();

        Date startOfDay = getStartOfDay(date);
        Date endOfDay = getEndOfDay(date);

        Events events = googleCalendar.events().list(CALENDAR_ID)
                .setTimeMin(new DateTime(startOfDay))
                .setTimeMax(new DateTime(endOfDay))
                .setOrderBy("startTime")
                .setSingleEvents(true)
                .execute();

        for (Event event : events.getItems()) {
            if (event.getStart().getDateTime() != null) {
                unavailableSlots.add(event.getStart().getDateTime().toStringRfc3339());
            } else if (event.getStart().getDate() != null) {
                unavailableSlots.add(event.getStart().getDate().toStringRfc3339());
            }
        }

        return unavailableSlots;
    }

    public boolean isEspaceDisponible(ObjectId espaceId, Date startDate, Date endDate) throws IOException {
        String calendarId = getCalendarIdFromEspaceId(espaceId);

        if (calendarId == null) {
            System.err.println("No calendar mapping found for espaceId: " + espaceId);
            return false;
        }

        DateTime startDateTime = new DateTime(startDate);
        DateTime endDateTime = new DateTime(endDate);

        Events events = googleCalendar.events().list(calendarId)
                .setTimeMin(startDateTime)
                .setTimeMax(endDateTime)
                .setSingleEvents(true)
                .setOrderBy("startTime")
                .execute();

        return events.getItems().isEmpty();
    }

    private Date getStartOfDay(Date date) {
        // Ensure the start of the day is 00:00:00 for the provided date.
        return new Date(date.getTime() - (date.getHours() * 3600000) - (date.getMinutes() * 60000)
                - (date.getSeconds() * 1000));
    }

    private Date getEndOfDay(Date date) {
        // Ensure the end of the day is 23:59:59 for the provided date.
        return new Date(date.getTime() + (23 - date.getHours()) * 3600000 + (59 - date.getMinutes()) * 60000
                + (59 - date.getSeconds()) * 1000);
    }

    private String getCalendarIdFromEspaceId(ObjectId espaceId) {
        return espaceId.toString();
    }

    public void marquerEvenementCommeAnnule(String eventId, Reservation reservation) {
        try {
            Event event = googleCalendar.events().get("primary", eventId).execute();

            // Met à jour le titre
            String originalTitle = event.getSummary();
            if (!originalTitle.contains("[ANNULÉ]")) {
                event.setSummary("[ANNULÉ] " + originalTitle);
            }

            // Ajoute une note dans la description
            String description = event.getDescription() != null ? event.getDescription() : "";
            description += "\nCet événement a été annulé par le demandeur.";
            event.setDescription(description);

            // Change la couleur (optionnelle)
            event.setColorId("11"); // Rouge = "11" dans Google Calendar

            // Mise à jour de l'événement dans Google Calendar
            googleCalendar.events().update("primary", eventId, event).execute();

        } catch (Exception e) {
            throw new RuntimeException(
                    "Erreur lors de la mise à jour de l'événement dans Google Calendar : " + e.getMessage());
        }
    }

    public void deleteEvent(String eventId) throws IOException {
        googleCalendar.events().delete(CALENDAR_ID, eventId).execute();
    }
}