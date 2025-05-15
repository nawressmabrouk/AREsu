package tn.sousse.univ.reservation_app.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatRequest {
    private String userId;
    private String message;

}