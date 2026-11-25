package tn.sousse.univ.reservation_app.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Browser origins allowed to call the API (APP_CORS_ALLOWED_ORIGINS, defaults to APP_FRONTEND_URL)
    @Value("${app.cors-allowed-origins:http://localhost:4200}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Global CORS configuration for all endpoints
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins) // Serveur Angular
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
