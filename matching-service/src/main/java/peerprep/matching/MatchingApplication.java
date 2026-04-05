package peerprep.matching;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MatchingApplication {
    public static void main(String[] args) {
        SpringApplication.run(MatchingApplication.class, args);
    }
}