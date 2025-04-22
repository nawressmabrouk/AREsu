package tn.sousse.univ.reservation_app.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.sousse.univ.reservation_app.models.Notification;
import tn.sousse.univ.reservation_app.services.NotificationService;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/{userId}")
    public List<Notification> getNotifications(@PathVariable String userId) {
        return notificationService.getNotificationsByUser(userId);
    }

    @PostMapping("/markAsRead/{notificationId}")
    public void markNotificationAsRead(@PathVariable String notificationId) {
        notificationService.markAsRead(notificationId);
    }

    @PostMapping("/send")
public ResponseEntity<?> sendNotificationViaWebSocket(
        @RequestParam String userId,
        @RequestParam String message,
        @RequestParam String reservationId) {
    
    notificationService.sendNotification(userId, message, reservationId);
    return ResponseEntity.ok("Notification sent to user: " + userId);
}
}
