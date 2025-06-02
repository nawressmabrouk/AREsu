package tn.sousse.univ.reservation_app.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import tn.sousse.univ.reservation_app.services.PythonBridgeService;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin // Autoriser les requêtes Angular
public class ChatController {

    @Autowired
    private PythonBridgeService pythonBridgeService;

    // Ask the bot a question endpoint
    @PostMapping
    public String askBot(@RequestBody String question) {
        return pythonBridgeService.ask(question);
    }
}
