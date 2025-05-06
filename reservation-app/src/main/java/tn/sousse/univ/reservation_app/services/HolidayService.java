/*package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.Events;

 
@Service
public class HolidayService {
    private static final String HOLIDAYS_CALENDAR_ID = "en.tunisian#holiday@group.v.calendar.google.com";
    private static final ZoneId TUNIS_ZONE = ZoneId.of("Africa/Tunis");

    @Autowired
    private com.google.api.services.calendar.Calendar googleCalendar;

    @Cacheable("holidays")
    public List<Date> getHolidays(int year) throws IOException {
        LocalDate startDate = LocalDate.of(year, 1, 1);
        LocalDate endDate = LocalDate.of(year, 12, 31);

        Events events = googleCalendar.events().list(HOLIDAYS_CALENDAR_ID)
                .setTimeMin(new DateTime(Date.from(startDate.atStartOfDay(TUNIS_ZONE).toInstant())))
                .setTimeMax(new DateTime(Date.from(endDate.atStartOfDay(TUNIS_ZONE).toInstant())))
                .setSingleEvents(true)
                .execute();

        List<Date> holidays = new ArrayList<>();
        for (Event event : events.getItems()) {
            if (event.getStart().getDate() != null) {
                holidays.add(new Date(event.getStart().getDate().getValue()));
            }
        }
        return holidays;
    }

    public boolean isHoliday(Date date) throws IOException {
        LocalDate localDate = date.toInstant().atZone(TUNIS_ZONE).toLocalDate();
        return getHolidays(localDate.getYear()).stream()
                .anyMatch(holiday -> holiday.toInstant().atZone(TUNIS_ZONE).toLocalDate().equals(localDate));
    }

    public Map<String, Object> getPublicHolidays(LocalDate start, LocalDate end) throws IOException {
        List<Date> holidays = new ArrayList<>();
        for (int year = start.getYear(); year <= end.getYear(); year++) {
            for (Date holiday : getHolidays(year)) {
                LocalDate holidayDate = holiday.toInstant().atZone(TUNIS_ZONE).toLocalDate();
                if (!holidayDate.isBefore(start) && !holidayDate.isAfter(end)) {
                    holidays.add(holiday);
                }
            }
        }
    
        List<String> formattedDates = holidays.stream()
            .map(d -> d.toInstant().atZone(TUNIS_ZONE).toLocalDate().toString())
            .collect(Collectors.toList());
    
        return Map.of("holidays", formattedDates);
    }
}*/

/*hedha ken 9bal ma nzyd authguard w tsyr mochkla mtaa CORS
package tn.sousse.univ.reservation_app.services;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.Events;
import org.springframework.stereotype.Service;
import tn.sousse.univ.reservation_app.dto.HolidayDTO;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HolidayService {

    private static final String APPLICATION_NAME = "University Reservation System";
    private static final String CALENDAR_ID = "en.tunisian#holiday@group.v.calendar.google.com";
    private static final ZoneId TUNIS_ZONE = ZoneId.of("Africa/Tunis");
    private static final String API_KEY = "REDACTED_GOOGLE_API_KEY";

    private final Calendar googleCalendar;

    public HolidayService() throws GeneralSecurityException, IOException {
        final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        this.googleCalendar = new Calendar.Builder(
                httpTransport,
                GsonFactory.getDefaultInstance(),
                null)
            .setApplicationName(APPLICATION_NAME)
            .build();
    }

    public List<HolidayDTO> getHolidaysBetween(LocalDate start, LocalDate end) throws IOException {
        try {
            // Create DateTime objects properly
            com.google.api.client.util.DateTime timeMin = 
                new com.google.api.client.util.DateTime(
                    Date.from(start.atStartOfDay(TUNIS_ZONE).toInstant()));
            
            com.google.api.client.util.DateTime timeMax = 
                new com.google.api.client.util.DateTime(
                    Date.from(end.plusDays(1).atStartOfDay(TUNIS_ZONE).toInstant()));

            // Build the events list request
            Calendar.Events.List request = googleCalendar.events()
                .list(CALENDAR_ID)
                .setKey(API_KEY)
                .setTimeMin(timeMin)
                .setTimeMax(timeMax)
                .setSingleEvents(true)
                .setOrderBy("startTime");

            Events events = request.execute();

            return events.getItems().stream()
                .map(event -> new HolidayDTO(
                    event.getSummary(),
                    LocalDate.parse(event.getStart().getDate().toString())
                ))
                .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error fetching holidays: " + e.getMessage());
            return Collections.emptyList();
        }
    }
}
*/

package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Events;

import tn.sousse.univ.reservation_app.dto.HolidayDTO;

@Service
public class HolidayService {
    private final String calendarId;
    private final String apiKey;
    private final ZoneId tunisZone = ZoneId.of("Africa/Tunis");
    private final Calendar googleCalendar;

    public HolidayService(
            @Value("${spring.google.calendar.holiday-calendar-id}") String calendarId,
            @Value("${spring.google.calendar.api-key}") String apiKey) throws GeneralSecurityException, IOException {
        this.calendarId = calendarId;
        this.apiKey = apiKey;

        final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        this.googleCalendar = new Calendar.Builder(
                httpTransport,
                GsonFactory.getDefaultInstance(),
                null)
                .setApplicationName("University Reservation System")
                .build();
    }

    public List<HolidayDTO> getHolidaysBetween(LocalDate start, LocalDate end) {
        try {
            Date startDate = Date.from(start.atStartOfDay(tunisZone).toInstant());
            Date endDate = Date.from(end.plusDays(1).atStartOfDay(tunisZone).toInstant());

            Events events = googleCalendar.events()
                    .list(calendarId)
                    .setKey(apiKey)
                    .setTimeMin(new com.google.api.client.util.DateTime(startDate))
                    .setTimeMax(new com.google.api.client.util.DateTime(endDate))
                    .setSingleEvents(true)
                    .setOrderBy("startTime")
                    .execute();

            return events.getItems().stream()
                    .map(event -> new HolidayDTO(
                            event.getSummary(),
                            LocalDate.parse(event.getStart().getDate().toString())))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // Log the error with details but don't expose sensitive info
            System.err.println("Error fetching holidays: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            return Collections.emptyList();
        }
    }
    
}
