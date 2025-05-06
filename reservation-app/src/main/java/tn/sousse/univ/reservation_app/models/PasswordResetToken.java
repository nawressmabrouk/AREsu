package tn.sousse.univ.reservation_app.models;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.UUID;
@Document(collection = "password_reset_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class PasswordResetToken {
    @Id
    private String id;
    
    private String token;
    private String email;
    private Date expiryDate;

    public PasswordResetToken(String email) {
        this.email = email;
        this.token = UUID.randomUUID().toString();
        this.expiryDate = new Date(System.currentTimeMillis() + 15 * 60 * 1000); // 15 min
    }
}
