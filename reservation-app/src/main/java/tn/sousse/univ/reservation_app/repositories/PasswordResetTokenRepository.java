

package tn.sousse.univ.reservation_app.repositories;

import tn.sousse.univ.reservation_app.models.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository  extends MongoRepository<PasswordResetToken, String>  {

    Optional<PasswordResetToken> findByToken(String token);

  
    void deleteByEmail(String email);
    
}

