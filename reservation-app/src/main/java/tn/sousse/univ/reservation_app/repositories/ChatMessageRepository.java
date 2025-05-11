package tn.sousse.univ.reservation_app.repositories;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import tn.sousse.univ.reservation_app.models.ChatMessage;
import reactor.core.publisher.Flux;

public interface ChatMessageRepository extends ReactiveMongoRepository<ChatMessage, String> {
    Flux<ChatMessage> findByUserIdOrderByTimestampAsc(String userId);
}






