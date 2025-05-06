package tn.sousse.univ.reservation_app.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import java.util.Collection;

@Getter
public class CustomUserDetails extends User {
    private final String userId; // Stocke l'ID de l'utilisateur

    public CustomUserDetails(String userId, 
                            String username, 
                            String password, 
                            Collection<? extends GrantedAuthority> authorities) {
        super(username, 
             password, 
             true, true, true, true, // ← Modifier ceci
             authorities);
        this.userId = userId;
    }
    public CustomUserDetails(String userId, 
    String username, 
    String password, 
    boolean enabled,
    boolean accountNonExpired,
                           boolean credentialsNonExpired,
                           boolean accountNonLocked,
    Collection<? extends GrantedAuthority> authorities) {
                  super(username, 
password, 
enabled, // ← Statut d'activation
true, true, true, 
authorities);
this.userId = userId;
}

public String getUserId() {
return userId;
}


}


