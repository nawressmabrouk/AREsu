package tn.sousse.univ.reservation_app.models;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    private String id;
    private String message;
    private Date dateEnvoi;
    private String recipientId;
    private String reservationId;
    private boolean isRead;
}
