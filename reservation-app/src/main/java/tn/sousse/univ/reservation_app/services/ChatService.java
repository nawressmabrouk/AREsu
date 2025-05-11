package tn.sousse.univ.reservation_app.services;

import java.time.LocalDateTime;

import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.ollama.OllamaChatClient;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;
import tn.sousse.univ.reservation_app.models.ChatMessage;
import tn.sousse.univ.reservation_app.repositories.ChatMessageRepository;
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
        System.out.println("Sending request to Ollama...");
        // Save user message reactively
        ChatMessage userMessage = new ChatMessage(null, userId, "user", userInput, LocalDateTime.now());
        
        return messageRepository.save(userMessage)
            .thenMany(chatClient.stream(new Prompt(userInput)))
            .map(response -> response.getResult().getOutput().getContent())
            .flatMap(botChunk -> 
                messageRepository.save(new ChatMessage(null, userId, "bot", botChunk, LocalDateTime.now())))
            .map(savedMessage -> savedMessage.getContent());
            
    }

    public Flux<ChatMessage> getChatHistory(String userId) {
        return messageRepository.findByUserIdOrderByTimestampAsc(userId);
    }
}