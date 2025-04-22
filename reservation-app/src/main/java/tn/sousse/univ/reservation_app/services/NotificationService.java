package tn.sousse.univ.reservation_app.services;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tn.sousse.univ.reservation_app.models.Notification;
import tn.sousse.univ.reservation_app.repositories.NotificationRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    // Envoyer une notification à un utilisateur spécifique
    public void sendNotification(String recipientId, String message, String reservationId) {
        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setDateEnvoi(new Date());
        notification.setRecipientId(recipientId);
        notification.setReservationId(reservationId);
        notification.setRead(false);

        notificationRepository.save(notification);
    }

    // Récupérer les notifications d'un utilisateur
    public List<Notification> getNotificationsByUser(String userId) {
        return notificationRepository.findByRecipientIdAndIsReadFalse(userId);
    }

    // Marquer une notification comme lue
    public void markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification introuvable"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }
}
