package tn.sousse.univ.reservation_app.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.Notification;

@Service
public class WebSocketNotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationService notificationService;

    public void sendNotification(String userId, String message, String reservationId) {
        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setRecipientId(userId);
        notification.setReservationId(reservationId);
        notificationService.sendNotification(message, userId, reservationId);

        messagingTemplate.convertAndSend("/topic/notifications/" + userId, notification);
    }
}
