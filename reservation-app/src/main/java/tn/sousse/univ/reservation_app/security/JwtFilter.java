/*   hedha first code ely te3mal meloul 
package tn.sousse.univ.reservation_app.security;

import tn.sousse.univ.reservation_app.repositories.TokenBlacklistRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final TokenBlacklistRepository tokenBlacklistRepository;

    public JwtFilter(JwtUtil jwtUtil,
                     CustomUserDetailsService userDetailsService,
                     TokenBlacklistRepository tokenBlacklistRepository) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.tokenBlacklistRepository = tokenBlacklistRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        //Check if token is blacklisted
        if (tokenBlacklistRepository.existsByToken(token)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token has been blacklisted");
            return;
        }

        try {
            final String username = jwtUtil.extractUsername(token);
            List<String> roles = jwtUtil.extractRoles(token);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtUtil.validateToken(token, userDetails)) {
                    List<GrantedAuthority> authorities = roles.stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, authorities);
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token");
            return;
        }

        chain.doFilter(request, response);
    }
}*/



package tn.sousse.univ.reservation_app.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tn.sousse.univ.reservation_app.repositories.TokenBlacklistRepository;

import java.io.IOException;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtFilter extends OncePerRequestFilter {


    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final TokenBlacklistRepository tokenBlacklistRepository;

    public JwtFilter(JwtUtil jwtUtil,
                    CustomUserDetailsService userDetailsService,
                    TokenBlacklistRepository tokenBlacklistRepository) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.tokenBlacklistRepository = tokenBlacklistRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) 
        throws ServletException, IOException {
            final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }    
        String token = authHeader.substring(7);
        
        if (token != null && !tokenBlacklistRepository.existsByToken(token)) { // Vérifie si le token est blacklisté
            String email = jwtUtil.extractUsername(token);
            
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(email); // Charge les UserDetails
                
                

                if (jwtUtil.validateToken(token, userDetails)) { // Valide avec UserDetails
                    // Récupérer l'ID depuis le JWT
                    String userId = jwtUtil.extractClaim(token, claims -> claims.get("userId", String.class));
                    List<GrantedAuthority> authorities = jwtUtil.extractRoles(token).stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
    
                    // Créer l'authentification
                    CustomUserDetails customUserDetails = new CustomUserDetails(userId, email, "", authorities);
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(customUserDetails, null, authorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }
        
        chain.doFilter(request, response);
    }
    
// In your JwtFilter class
@Override
protected boolean shouldNotFilter(HttpServletRequest request) {
    return request.getRequestURI().startsWith("/api/chat");
}



   
}
