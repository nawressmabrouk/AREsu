
/* 
@Service
public class ChatService {

    private final OllamaChatClient chatClient;
    private final ChatMessageRepository messageRepository;

    
    public ChatService(OllamaChatClient chatClient, 
                      ChatMessageRepository messageRepository) {
        this.chatClient = chatClient;
        this.messageRepository = messageRepository;
    }

    public Flux<String> streamResponse(String userId, String userInput) {
        // Save user message
        ChatMessage userMessage = new ChatMessage(null, userId, "user", userInput, LocalDateTime.now());
        messageRepository.save(userMessage).subscribe();

        // Stream response from Ollama
        return chatClient.stream(new Prompt(userInput))
                .map(response -> response.getResult().getOutput().getContent())
                .doOnNext(botChunk -> {
                    // Save bot response chunk
                    ChatMessage botMessage = new ChatMessage(null, userId, "bot", botChunk, LocalDateTime.now());
                    messageRepository.save(botMessage).subscribe();
                });
    }

    public Flux<ChatMessage> getChatHistory(String userId) {
        return messageRepository.findByUserIdOrderByTimestampAsc(userId);
    }
}*/

/*package tn.sousse.univ.reservation_app.services;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import tn.sousse.univ.reservation_app.models.ChatMessage;
import tn.sousse.univ.reservation_app.repositories.ChatMessageRepository;

@Service
public class ChatService {

    private final WebClient openRouterClient;
    private final ChatMessageRepository messageRepository;

    public ChatService(WebClient openRouterWebClient,
                       ChatMessageRepository messageRepository) {
        this.openRouterClient = openRouterWebClient;
        this.messageRepository = messageRepository;
    }

    public Flux<String> streamResponse(String userId, String userInput) {
        ChatMessage userMessage = new ChatMessage(null, userId, "user", userInput, LocalDateTime.now());

        return messageRepository.save(userMessage)
                .thenMany(
                        openRouterClient.post()
                                .bodyValue(Map.of(
                                        "model", "mistralai/mistral-7b-instruct",
                                        "messages", new Object[]{
                                            Map.of("role", "user", "content", userInput)
                                        }
                                ))
                                .retrieve()
                                .bodyToMono(Map.class)
                                .flatMapMany(json -> {
                                    String content = ((Map<String, Object>) ((Map<String, Object>) ((java.util.List<?>) json.get("choices")).get(0)).get("message")).get("content").toString();
                                    ChatMessage botMessage = new ChatMessage(null, userId, "bot", content, LocalDateTime.now());
                                    return messageRepository.save(botMessage).thenMany(Flux.just(content));
                                })
                );
    }

    public Flux<ChatMessage> getChatHistory(String userId) {
        return messageRepository.findByUserIdOrderByTimestampAsc(userId);
    }
}*/

package tn.sousse.univ.reservation_app.services;

import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;

@Service
public class PythonBridgeService {

    public String ask(String question) {
        try {
            // Appelle Python avec l'argument de la question
            ProcessBuilder pb = new ProcessBuilder("python", "ask_bot.py", question);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8) // ← ici
            );
            String line;
            StringBuilder result = new StringBuilder();

            while ((line = reader.readLine()) != null) {
                result.append(line);
            }

            process.waitFor();
            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "Erreur de communication avec le bot.";
        }
    }
}
