/*package tn.sousse.univ.reservation_app.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class ChatConfig {

    @Value("${ai.openrouter.base-url}")
    private String baseUrl;

    @Value("${ai.openrouter.api-key}")
    private String apiKey;

    @Bean
    public WebClient openRouterWebClient() {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}*/
