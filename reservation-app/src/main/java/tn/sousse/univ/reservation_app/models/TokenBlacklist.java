package tn.sousse.univ.reservation_app.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "blacklisted_tokens")
public class TokenBlacklist {

    @Id
    private String id;
    private String token;
    private Date createdAt;
    private Date expiresAt;

}
