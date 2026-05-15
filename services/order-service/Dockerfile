FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven && mvn -q package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/order-service-1.0.0.jar app.jar
COPY --from=build /app/target/newrelic/newrelic.jar newrelic/newrelic.jar
COPY src/main/resources/newrelic/newrelic.yml newrelic/newrelic.yml
EXPOSE 8081
ENV JAVA_OPTS="-javaagent:/app/newrelic/newrelic.jar -Dnewrelic.config.file=/app/newrelic/newrelic.yml"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
