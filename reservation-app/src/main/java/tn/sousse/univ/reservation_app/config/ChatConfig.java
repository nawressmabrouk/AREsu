package tn.sousse.univ.reservation_app.config;

import org.springframework.ai.ollama.OllamaChatClient;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import tn.sousse.univ.reservation_app.repositories.ChatMessageRepository;
import tn.sousse.univ.reservation_app.services.ChatService;
@Configuration
public class ChatConfig {

    @Value("${spring.ai.ollama.base-url}")
    private String baseUrl;

    @Value("${spring.ai.ollama.model}")
    private String model;

    @Bean
    public OllamaApi ollamaApi() {
        return new OllamaApi(baseUrl);
    }

    @Bean
    public OllamaChatClient chatClient(OllamaApi ollamaApi) {
        return new OllamaChatClient(ollamaApi)
                .withModel(model);
    }

    @Bean
    public ChatService chatService(OllamaChatClient chatClient,
                                  ChatMessageRepository messageRepository) {
        return new ChatService(chatClient, messageRepository);
    }
}