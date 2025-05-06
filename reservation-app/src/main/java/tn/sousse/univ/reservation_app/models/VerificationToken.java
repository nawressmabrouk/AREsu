package tn.sousse.univ.reservation_app.models;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter

@Document(collection = "verification_tokens")
public class VerificationToken {

    @Id
    private String id;
    private String token;
    private String userId;
    private LocalDateTime expiryDate;

    public VerificationToken() {
    }

    public VerificationToken(String token, String userId) {
        this.token = token;
        this.userId = userId;
        this.expiryDate = LocalDateTime.now().plusHours(24); // expire après 24h
    }

}
