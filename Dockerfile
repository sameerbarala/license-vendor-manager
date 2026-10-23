# ---------- Stage 1: build ----------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

COPY Backend/license-manager/.mvn .mvn
COPY Backend/license-manager/mvnw Backend/license-manager/pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

COPY Backend/license-manager/src src

# Put the frontend inside the jar, where Spring Boot serves it from.
COPY index.html login.html vendors.html licenses.html account.html users.html src/main/resources/static/
COPY css src/main/resources/static/css
COPY js src/main/resources/static/js

RUN ./mvnw clean package -DskipTests -q

# ---------- Stage 2: run ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
# The memory flags keep Java inside Render's 512 MB limit.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-XX:+UseSerialGC", "-Xss512k", "-jar", "app.jar"]