package tn.sousse.univ.reservation_app.services;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

import org.springframework.stereotype.Service;

@Service
public class PythonBridgeService {

    // Method that takes a question string as input and returns the bot's response
    public String ask(String question) {
        try {
            // Creates a ProcessBuilder to execute an external Python process
            ProcessBuilder pb = new ProcessBuilder(
                    "C:\\Windows\\py.exe",
                    "C:\\Users\\mabro\\Downloads\\reservation-app\\reservation-app\\ask_bot.py",
                    question);

            // Configures the process to merge error stream with standard output
            pb.redirectErrorStream(true);

            // Starts the external process
            Process process = pb.start();
            // Creates a BufferedReader to read the process output stream using UTF-8
            // encoding to properly handle special characters
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8) // ← ici
            );

            // Variables to store each line of output and the complete result
            String line;
            StringBuilder result = new StringBuilder();

            // Reads the process output line by line
            while ((line = reader.readLine()) != null) {
                result.append(line);
            }

            // Waits for the process to complete execution
            process.waitFor();

            // Returns the accumulated output as a string
            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "Erreur de communication avec le bot.";
        }
    }
}
