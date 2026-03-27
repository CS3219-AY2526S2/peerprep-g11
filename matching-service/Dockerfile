FROM eclipse-temurin:17 AS builder
WORKDIR /workspace

# Copy working files and run gradle wrapper build
COPY . .
RUN chmod +x ./gradlew && ./gradlew bootJar -x test --no-daemon

# Run stage
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy application properties
COPY application.properties application.properties

# Copy jar from builder
COPY --from=builder /workspace/build/libs/*.jar app.jar

EXPOSE 8080

# Environment variables - only use external config file
ENV SPRING_CONFIG_LOCATION=file:./application.properties
ENV SPRING_APPLICATION_NAME=matching-service

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
