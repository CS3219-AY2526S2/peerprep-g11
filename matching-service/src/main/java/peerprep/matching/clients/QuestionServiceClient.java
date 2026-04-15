package peerprep.matching.clients;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class QuestionServiceClient {

    private final Logger logger = LoggerFactory.getLogger(QuestionServiceClient.class);
    private final WebClient webClient;
    private final Random random = new Random();

    public QuestionServiceClient(@Value("${question.service.url:http://localhost:8000}") String questionServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(questionServiceUrl)
                .build();
    }

    public boolean hasQuestionsByTopicAndDifficulty(String topic, String difficulty) {
        return !getQuestionsByTopicAndDifficulty(topic, difficulty).isEmpty();
    }

    public String getQuestionByTopicAndDifficulty(String topic, String difficulty) {
        List<Map<String, Object>> questions = getQuestionsByTopicAndDifficulty(topic, difficulty);
        if (questions.isEmpty()) {
            return null;
        }

        Map<String, Object> randomQuestion = questions.get(random.nextInt(questions.size()));
        return (String) randomQuestion.get("slug");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getQuestionsByTopicAndDifficulty(String topic, String difficulty) {
        if (topic == null || topic.isBlank()) {
            return Collections.emptyList();
        }

        try {
            Object payload = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/questions")
                            .queryParam("topic", topic)
                            .queryParamIfPresent("difficulty", Optional.ofNullable(difficulty).filter(diff -> !diff.isBlank()))
                            .queryParam("size", 100)
                            .build())
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block();

            return extractQuestions(payload);
        } catch (Exception e) {
            logger.error(
                    "Failed to fetch questions for topic={} difficulty={}: {}",
                    topic,
                    difficulty,
                    e.getMessage());
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    static List<Map<String, Object>> extractQuestions(Object payload) {
        if (payload == null) {
            return Collections.emptyList();
        }

        if (payload instanceof List<?> rawList) {
            List<Map<String, Object>> questions = new ArrayList<>();
            for (Object item : rawList) {
                if (item instanceof Map<?, ?> rawMap) {
                    questions.add((Map<String, Object>) rawMap);
                }
            }
            return questions;
        }

        if (payload instanceof Map<?, ?> rawMap) {
            Object data = rawMap.get("data");
            if (data instanceof List<?> rawList) {
                List<Map<String, Object>> questions = new ArrayList<>();
                for (Object item : rawList) {
                    if (item instanceof Map<?, ?> itemMap) {
                        questions.add((Map<String, Object>) itemMap);
                    }
                }
                return questions;
            }
        }

        return Collections.emptyList();
    }
}
