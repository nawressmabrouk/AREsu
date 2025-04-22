package tn.sousse.univ.reservation_app.repositories;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import tn.sousse.univ.reservation_app.models.Notification;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByRecipientId(String recipientId);

    List<Notification> findByRecipientIdAndIsReadFalse(String recipientId);
}
