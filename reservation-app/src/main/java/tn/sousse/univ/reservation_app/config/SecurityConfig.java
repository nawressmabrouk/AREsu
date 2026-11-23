package tn.sousse.univ.reservation_app.config;

import java.io.IOException;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tn.sousse.univ.reservation_app.security.JwtFilter;
import tn.sousse.univ.reservation_app.services.CustomUserDetailsService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter; 
    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(JwtFilter jwtFilter, CustomUserDetailsService customUserDetailsService) {
        this.jwtFilter = jwtFilter;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(authProvider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/notifications/**",
                                "/api/chat/**",
                                "/api/calendar/**",
                                "/api/calendar/verify",
                                "/api/calendar/test-visibility/{calendarId}",
                                "/calendar-details/{calendarId}",
                                "/visibility-status/{calendarId}",
                                "/verify-calendar/{calendarId}",
                                "/check-ui-status/{calendarId}",
                                "/grant-access/{calendarId}",
                                "/check-all-visibility",
                                "/cleanup")
                        .permitAll()

                        // Authenticated endpoints
                        .requestMatchers(
                                "/api/calendar/view",
                                "/api/utilisateurs/modifierProfil",
                                "/api/utilisateurs/changer-mot-de-passe",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/share-all-with-user",
                                "/force-all-ui-visibility",
                                "/add-test-events",
                                "/fix-ui-display",
                                "/{calendarId}/reservations")
                        .authenticated()

                        // Role-based endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/secretaire/**").hasRole("SECRETAIRE_GENERALE")
                        .requestMatchers("/api/responsable/**").hasRole("RESPONSABLE_SALLE")
                        .requestMatchers("/api/demandeur/**").hasAnyRole("DEMANDEUR_INTERNE", "DEMANDEUR_EXTERNE")
                        .requestMatchers("/api/super-admin/**").hasRole("SUPER_ADMIN")

                        // reservations
                        .requestMatchers("/api/reservations/**").permitAll()

                        // General fallback
                        .anyRequest().permitAll()) // just for testing

                .addFilterBefore(new RequestLoggingFilter(), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:4200"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "Origin"));
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept", // Added for SSE support
                "X-Requested-With",
                "X-User-Id",
                "X-User-Role",
                "Origin"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private static class RequestLoggingFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request,
                HttpServletResponse response,
                FilterChain filterChain)
                throws ServletException, IOException {
            // Request logging implementation
            filterChain.doFilter(request, response);
        }

    }

}