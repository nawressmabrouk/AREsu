package tn.sousse.univ.reservation_app.config;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
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

    // Browser origins allowed to call the API (APP_CORS_ALLOWED_ORIGINS, defaults to APP_FRONTEND_URL)
    @Value("${app.cors-allowed-origins:http://localhost:4200}")
    private List<String> allowedOrigins;

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
                // No / invalid / expired token -> 401 (the frontend then opens the login page);
                // logged in but without the required role -> 403.
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))

                // Deny by default: every endpoint needs a login unless it is listed as public.
                // Rules are evaluated in order and the first match wins.
                .authorizeHttpRequests(auth -> auth
                        // Spring Boot's error page must stay reachable to return the real error
                        .requestMatchers("/error").permitAll()

                        // --- Public: authentication, registration, activation, chatbot --------
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/logout",
                                "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/utilisateurs/inscription").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/utilisateurs/activer").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/chat").permitAll()

                        // --- Public: read-only catalogue of establishments and spaces --------
                        .requestMatchers(HttpMethod.GET, "/api/espaces/*/reservations").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/etablissements/**", "/api/espaces/**").permitAll()

                        // --- Role dashboards ---------------------------------------------------
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/secretaire/**").hasRole("SECRETAIRE_GENERALE")
                        .requestMatchers("/api/responsable/**").hasRole("RESPONSABLE_SALLE")
                        .requestMatchers("/api/demandeur/**").hasAnyRole("DEMANDEUR_INTERNE", "DEMANDEUR_EXTERNE")
                        .requestMatchers("/api/super-admin/**").hasRole("SUPER_ADMIN")

                        // --- Google Calendar maintenance / repair tools and migration: super admin
                        .requestMatchers(
                                "/api/calendar/add-test-events",
                                "/api/calendar/calendar-details/**",
                                "/api/calendar/check-all-visibility",
                                "/api/calendar/check-ui-status/**",
                                "/api/calendar/cleanup",
                                "/api/calendar/fix-ui-display",
                                "/api/calendar/force-all-ui-visibility",
                                "/api/calendar/grant-access/**",
                                "/api/calendar/share-all-with-user",
                                "/api/calendar/test-visibility/**",
                                "/api/calendar/verify",
                                "/api/calendar/verify-calendar/**",
                                "/api/calendar/visibility-status/**",
                                "/api/calendar/*/reservations",
                                "/api/migrate/**").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/calendar/reservations/*").hasRole("SUPER_ADMIN")

                        // --- Destructive or directory endpoints not used by the frontend ------
                        .requestMatchers(HttpMethod.DELETE, "/api/reservations/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/utilisateurs/parRole/**", "/api/utilisateurs/email/**")
                                .hasAnyRole("ADMIN", "SUPER_ADMIN")

                        // --- Everything else (booking calendar, reservations, profile...) -----
                        .anyRequest().authenticated())

                .addFilterBefore(new RequestLoggingFilter(), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
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