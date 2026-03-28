package peerprep.matching.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Component
public class QuestionServiceClient {

    private final WebClient webClient;

    private static final List<String> DIFFICULTY_ORDER = Arrays.asList("Easy", "Medium", "Hard");

    public QuestionServiceClient(@Value("${question.service.url:http://localhost:8000}") String questionServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(questionServiceUrl)
                .build();
    }

    public String getQuestionByTopicAndDifficulty(String topic, String difficulty) {
        if (topic == null || topic.isEmpty()) {
            return null;
        }

        List<String> difficultiesToTry = new ArrayList<>();
        
        if (difficulty != null && !difficulty.isEmpty()) {
            int requestedIndex = DIFFICULTY_ORDER.indexOf(difficulty);
            if (requestedIndex >= 0) {
                difficultiesToTry.addAll(DIFFICULTY_ORDER.subList(requestedIndex, DIFFICULTY_ORDER.size()));
            }
        } else {
            difficultiesToTry.addAll(DIFFICULTY_ORDER);
        }

        for (String diff : difficultiesToTry) {
            String slug = tryGetQuestion(topic, diff);
            if (slug != null) {
                return slug;
            }
        }

        return null;
    }

    @SuppressWarnings("unchecked")
    private String tryGetQuestion(String topic, String difficulty) {
        try {
            List<Map<String, Object>> questions = (List<Map<String, Object>>) (List<?>) webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/questions/topic/{topic}")
                            .queryParam("difficulty", difficulty)
                            .build(topic))
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList()
                    .block();

            if (questions == null || questions.isEmpty()) {
                return null;
            }

            Map<String, Object> randomQuestion = questions.get(new Random().nextInt(questions.size()));
            return (String) randomQuestion.get("slug");
        } catch (Exception e) {
            System.err.println("Failed to fetch questions for topic=" + topic + ", difficulty=" + difficulty + ": " + e.getMessage());
            return null;
        }
    }
}
