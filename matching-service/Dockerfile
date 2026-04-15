FROM eclipse-temurin:17-jdk AS builder
WORKDIR /workspace

COPY gradlew build.gradle ./
COPY gradle ./gradle

RUN chmod +x ./gradlew

COPY src ./src

RUN ./gradlew bootJar -x test --no-daemon

# Run stage
FROM eclipse-temurin:17-jre AS runner
WORKDIR /app

RUN groupadd --system spring && useradd --system --gid spring spring

COPY --from=builder /workspace/build/libs/*.jar app.jar
COPY application.properties* ./

EXPOSE 8080

ENV SPRING_APPLICATION_NAME=matching-service
ENV SERVER_PORT=8080

USER spring

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
