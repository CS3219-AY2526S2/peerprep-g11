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
            List<Map<String, Object>> questions = (List<Map<String, Object>>) (List<?>) webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/questions")
                            .queryParam("topic", topic)
                            .queryParamIfPresent("difficulty", Optional.ofNullable(difficulty).filter(diff -> !diff.isBlank()))
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList()
                    .block();

            return questions == null ? Collections.emptyList() : questions;
        } catch (Exception e) {
            logger.error(
                    "Failed to fetch questions for topic={} difficulty={}: {}",
                    topic,
                    difficulty,
                    e.getMessage());
            return Collections.emptyList();
        }
    }
}
