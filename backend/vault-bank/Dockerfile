# Stage 1: Build the application using Maven and OpenJDK 17
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copy the pom.xml and fetch dependencies first (cached for faster subsequent builds)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy your source code and build the package
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create a lightweight runtime image using OpenJDK JRE 17
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the compiled JAR file from Stage 1
COPY --from=build /app/target/vault-bank-0.0.1-SNAPSHOT.jar app.jar

# Expose Spring Boot's default port
EXPOSE 8080

# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]