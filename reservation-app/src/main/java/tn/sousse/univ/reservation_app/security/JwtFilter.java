package tn.sousse.univ.reservation_app.security;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tn.sousse.univ.reservation_app.repositories.TokenBlacklistRepository;
import tn.sousse.univ.reservation_app.services.CustomUserDetailsService;

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

        // Get Authorization header from request
        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        // Check if header is missing or doesn't start with Bearer
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {

            // If no token is present, continue the filter chain without authentication
            chain.doFilter(request, response);
            return;
        }

        // Extract token from header (remove "Bearer " prefix)
        String token = authHeader.substring(7);

        // Check if token exists and isn't blacklisted
        if (token != null && !tokenBlacklistRepository.existsByToken(token)) {

            // Extract username (email) from token
            String email = jwtUtil.extractUsername(token);

            // Check if email exists and no existing authentication
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Load user details from database
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // Validate the token with user details
                if (jwtUtil.validateToken(token, userDetails)) {

                    // Extract user ID from token claims
                    String userId = jwtUtil.extractClaim(token, claims -> claims.get("userId", String.class));

                    // Extract and convert roles to authorities
                    List<GrantedAuthority> authorities = jwtUtil.extractRoles(token).stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());

                    // Create custom user details with extracted info
                    CustomUserDetails customUserDetails = new CustomUserDetails(userId, email, "", authorities);

                    // Create authentication token with user details and authorities
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            customUserDetails, null, authorities);

                    // Set authentication details from request
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // Set authentication in security context
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }
        // Continue filter chain
        chain.doFilter(request, response);
    }

}
