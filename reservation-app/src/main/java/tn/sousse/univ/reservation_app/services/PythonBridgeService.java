package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

/**
 * Bridge to the Python chatbot (ask_bot.py). The chatbot is optional: if Python,
 * its packages (see requirements.txt) or the script are missing, the endpoint
 * answers with a friendly message instead of failing.
 */
@Service
public class PythonBridgeService {

    private static final Logger log = LoggerFactory.getLogger(PythonBridgeService.class);

    static final String UNAVAILABLE = "Le chatbot n'est pas disponible pour le moment. "
            + "Vous pouvez consulter la page d'aide ou contacter l'administration de votre établissement.";
    static final String FAILED = "Désolé, le chatbot n'a pas pu répondre. Veuillez réessayer dans quelques instants.";

    private final String configuredPython;
    private final String configuredScript;
    private final long timeoutSeconds;

    public PythonBridgeService(
            @Value("${chatbot.python:}") String configuredPython,
            @Value("${chatbot.script:ask_bot.py}") String configuredScript,
            @Value("${chatbot.timeout-seconds:120}") long timeoutSeconds) {
        this.configuredPython = configuredPython == null ? "" : configuredPython.trim();
        this.configuredScript = configuredScript;
        this.timeoutSeconds = timeoutSeconds;
    }

    // Takes a question and returns the bot's answer (never throws)
    public String ask(String question) {
        Path script = resolveScript();
        if (script == null) {
            log.warn("Chatbot indisponible : script introuvable ({})", configuredScript);
            return UNAVAILABLE;
        }
        if (question == null || question.isBlank()) {
            return FAILED;
        }

        Path stderr = null;
        try {
            stderr = Files.createTempFile("chatbot-", ".log");
            ProcessBuilder pb = new ProcessBuilder(resolvePython(), script.toString(), "--stdin");
            pb.directory(script.getParent().toFile()); // so BotTrainingData.json is found
            pb.environment().put("PYTHONIOENCODING", "utf-8");
            pb.environment().put("PYTHONUTF8", "1");
            pb.redirectError(stderr.toFile()); // errors go to the server log, never to the user

            Process process = pb.start();
            CompletableFuture<byte[]> stdout = CompletableFuture.supplyAsync(() -> {
                try {
                    return process.getInputStream().readAllBytes();
                } catch (IOException e) {
                    return new byte[0];
                }
            });
            // The question is sent on stdin (UTF-8): no command-line quoting or length issues
            try (OutputStream in = process.getOutputStream()) {
                in.write(question.trim().getBytes(StandardCharsets.UTF_8));
            }

            if (!process.waitFor(timeoutSeconds, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                log.warn("Chatbot : pas de réponse après {} s, processus arrêté", timeoutSeconds);
                return FAILED;
            }
            String answer = new String(stdout.get(5, TimeUnit.SECONDS), StandardCharsets.UTF_8).trim();
            if (process.exitValue() != 0 || answer.isEmpty()) {
                String error = lastLines(stderr, 5);
                log.warn("Chatbot : échec (code {}). {}", process.exitValue(), error);
                if (error.contains("ModuleNotFoundError")) {
                    return UNAVAILABLE;
                }
                return answer.isEmpty() ? FAILED : answer;
            }
            return answer;

        } catch (IOException e) {
            // Typically: the Python executable does not exist
            log.warn("Chatbot indisponible : impossible de lancer Python ({}). Voir reservation-app/requirements.txt",
                    e.getMessage());
            return UNAVAILABLE;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return FAILED;
        } catch (Exception e) {
            log.warn("Chatbot : erreur inattendue", e);
            return FAILED;
        } finally {
            if (stderr != null) {
                try {
                    Files.deleteIfExists(stderr);
                } catch (IOException ignored) {
                    // best effort
                }
            }
        }
    }

    /** Logs at startup (in the background, without delaying startup) whether the chatbot can run. */
    @EventListener(ApplicationReadyEvent.class)
    public void logAvailability() {
        CompletableFuture.runAsync(() -> {
            Path script = resolveScript();
            if (script == null) {
                log.warn("Chatbot désactivé : script {} introuvable.", configuredScript);
                return;
            }
            String python = resolvePython();
            try {
                Process p = new ProcessBuilder(python, "-c", "import torch, sentence_transformers")
                        .redirectErrorStream(true).start();
                p.getInputStream().readAllBytes();
                boolean done = p.waitFor(60, TimeUnit.SECONDS);
                if (done && p.exitValue() == 0) {
                    log.info("Chatbot disponible (Python : {}).", python);
                } else {
                    log.warn("Chatbot désactivé : torch / sentence-transformers manquants pour {}. "
                            + "Voir reservation-app/requirements.txt.", python);
                }
            } catch (Exception e) {
                log.warn("Chatbot désactivé : Python introuvable ({}). Voir reservation-app/requirements.txt.", python);
            }
        });
    }

    // CHATBOT_PYTHON, else the project's .venv, else "python" from the PATH
    String resolvePython() {
        if (!configuredPython.isEmpty()) {
            return configuredPython;
        }
        Path script = resolveScript();
        Path base = script != null ? script.getParent() : Paths.get("").toAbsolutePath();
        for (String candidate : List.of(".venv/Scripts/python.exe", ".venv/bin/python")) {
            Path p = base.resolve(candidate);
            if (Files.isRegularFile(p)) {
                return p.toString();
            }
        }
        return "python";
    }

    // The script path as configured, also tried relative to reservation-app/ (when run from the repo root)
    Path resolveScript() {
        for (Path p : List.of(Paths.get(configuredScript), Paths.get("reservation-app").resolve(configuredScript))) {
            if (Files.isRegularFile(p)) {
                return p.toAbsolutePath();
            }
        }
        return null;
    }

    private static String lastLines(Path file, int n) {
        try {
            List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
            return String.join(" | ", lines.subList(Math.max(0, lines.size() - n), lines.size()));
        } catch (IOException e) {
            return "";
        }
    }
}
