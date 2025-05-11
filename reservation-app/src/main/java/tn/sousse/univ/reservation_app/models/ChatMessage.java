package tn.sousse.univ.reservation_app.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "chat_messages")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessage {

    @Id
    private String id;
    private String userId; // or email, username, etc.
    private String sender; // "user" or "bot"
    private String content;
    private LocalDateTime timestamp;

}
