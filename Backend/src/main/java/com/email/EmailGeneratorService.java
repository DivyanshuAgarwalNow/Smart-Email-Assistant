package com.email.email;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class EmailGeneratorService {

    private final WebClient webClient;
    private final String apiKey;
    private final String model;

    public EmailGeneratorService(
            WebClient.Builder webClientBuilder,
            @Value("${spring.ai.openai.audio.transcription.base-url}") String baseUrl,
            @Value("${spring.ai.openai.api-key}") String apiKey,
            @Value("${spring.ai.openai.audio.transcription.options.model}") String model
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
    }

    public String generateEmailReply(EmailRequest emailRequest) {
        String prompt = buildPrompt(emailRequest);

        Map<String, Object> requestBody = Map.of(
            "model", model,
            "messages", List.of(
                Map.of("role", "system", "content", 
                    "You are a professional email assistant. Write concise, polite replies."),
                Map.of("role", "user", "content", prompt)
            ),
            "max_tokens", 500,
            "temperature", 0.7
        );

        String response = webClient.post()
            .uri("/v1/chat/completions")
            .header("Authorization", "Bearer " + apiKey)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(String.class)
            .block();

        return extractResponse(response);
    }
    
    private String extractResponse(String response) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            return root.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse OpenAI response", e);
        }
    }

    private String buildPrompt(EmailRequest emailRequest) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Write a professional email reply, do not include subject heading as it is already there, do not add email id at the last, also write emails which looks like human written not AI written, give human feel or human touch");

        if (emailRequest.getTone() != null && !emailRequest.getTone().isEmpty()) {
            prompt.append(" Use a ").append(emailRequest.getTone()).append(" tone.");
        }

        prompt.append("\n\nOriginal Email:\n")
              .append(emailRequest.getEmailContent());

        return prompt.toString();
    }
}
