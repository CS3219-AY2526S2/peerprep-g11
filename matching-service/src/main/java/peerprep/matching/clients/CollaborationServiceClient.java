package peerprep.matching.clients;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import peerprep.matching.dto.MatchNotificationRequestDto;

@Component
public class CollaborationServiceClient {

    private final WebClient webClient;

    public CollaborationServiceClient(
            @Value("${collaboration.service.url:http://localhost:1234}") String url) {
        this.webClient = WebClient.builder().baseUrl(url).build();
    }

    public void notifyMatchCreated(MatchNotificationRequestDto request) {
        webClient.post()
                .uri("/matched")
                .bodyValue(request)
                .retrieve()
                .toBodilessEntity()
                .block();
    }
}
