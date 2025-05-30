package tn.sousse.univ.reservation_app.services;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

import org.springframework.stereotype.Service;

@Service
public class PythonBridgeService {

    public String ask(String question) {
        try {
            // Appelle Python avec l'argument de la question
            ProcessBuilder pb = new ProcessBuilder(
                    "C:\\Windows\\py.exe", // Full path to Python launcher
                    "C:\\Users\\mabro\\Downloads\\reservation-app\\reservation-app\\ask_bot.py",
                    question);
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
