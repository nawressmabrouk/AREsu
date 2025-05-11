/*package tn.sousse.univ.reservation_app.controllers;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import tn.sousse.univ.reservation_app.models.ChatMessage;
import tn.sousse.univ.reservation_app.services.ChatService;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestParam String message, @RequestParam String userId) {
        return chatService.streamResponse(userId, message);
    }

    @GetMapping("/history")
    public Flux<ChatMessage> getHistory(@RequestParam String userId) {
        return chatService.getChatHistory(userId);
    }
}*/
package tn.sousse.univ.reservation_app.controllers;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Flux;
import tn.sousse.univ.reservation_app.models.ChatMessage;
import tn.sousse.univ.reservation_app.services.ChatService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // Changed to POST for better REST semantics

   
   @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<String> streamChat(@RequestParam String userId, @RequestBody String message) {
    System.out.println(">>> streamChat called");
    System.out.println(">>> userId = " + userId);
    System.out.println(">>> message = " + message);
    return chatService.streamResponse(userId, message);
}
    
     @PostMapping(value = "/test", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> testStream(@RequestBody String message) {
        return Flux.just("Hello from server: " + message);
    }

    @GetMapping("/history")
    public Flux<ChatMessage> getHistory(@RequestParam String userId) {
        return chatService.getChatHistory(userId);
    }
}
