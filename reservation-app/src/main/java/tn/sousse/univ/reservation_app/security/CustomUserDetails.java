package tn.sousse.univ.reservation_app.security;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import lombok.Getter;

@Getter
public class CustomUserDetails extends User {
    private final String userId;

    // Constructor with default account status flags
    public CustomUserDetails(String userId,
            String username,
            String password,
            Collection<? extends GrantedAuthority> authorities) {
        // Call parent constructor with default enabled/expired/locked flags
        super(username,
                password,
                true, true, true, true,
                authorities);
        this.userId = userId;
    }

    // Constructor with customizable account status flags
    public CustomUserDetails(String userId,
            String username,
            String password,
            boolean enabled,
            boolean accountNonExpired,
            boolean credentialsNonExpired,
            boolean accountNonLocked,
            Collection<? extends GrantedAuthority> authorities) {
        // Call parent constructor with custom flags
        super(username,
                password,
                enabled,
                true, true, true,
                authorities);
        this.userId = userId;
    }

}
