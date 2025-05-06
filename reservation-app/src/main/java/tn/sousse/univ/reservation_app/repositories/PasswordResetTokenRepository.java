

package tn.sousse.univ.reservation_app.repositories;

import tn.sousse.univ.reservation_app.models.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository  extends MongoRepository<PasswordResetToken, String>  {

    /* Trouve un token par sa valeur (utilisé lors de la réinitialisation)*/
    Optional<PasswordResetToken> findByToken(String token);

  
     /* Supprime tous les tokens associés à un email */
    void deleteByEmail(String email);
    
}

