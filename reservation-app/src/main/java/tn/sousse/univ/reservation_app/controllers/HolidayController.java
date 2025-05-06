/*package tn.sousse.univ.reservation_app.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import tn.sousse.univ.reservation_app.services.HolidayService;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {

    private final HolidayService holidayService;

    public HolidayController(HolidayService holidayService) {
        this.holidayService = holidayService;
    }

    // Get public holidays between two dates
    
    @GetMapping
public ResponseEntity<?> getHolidays(
        @RequestParam String start,
        @RequestParam String end) throws IOException {
    LocalDate startDate = LocalDate.parse(start);
    LocalDate endDate = LocalDate.parse(end);
    Map<String, Object> result = holidayService.getPublicHolidays(startDate, endDate);
    return ResponseEntity.ok(result);
}
    
}
*/