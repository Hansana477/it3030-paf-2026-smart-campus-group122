package backend.security;

import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class GoogleTokenVerifierService {

    private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final String googleClientId;
    private final HttpClient httpClient;
    private final JsonParser jsonParser;

    public GoogleTokenVerifierService(@Value("${app.google.client-id:}") String googleClientId) {
        this.googleClientId = googleClientId == null ? "" : googleClientId.trim();
        this.httpClient = HttpClient.newHttpClient();
        this.jsonParser = JsonParserFactory.getJsonParser();
    }

    public GoogleUserProfile verify(String credential) {
        if (googleClientId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Google sign-in is not configured on the server"
            );
        }

        if (credential == null || credential.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google credential is required");
        }

        GoogleTokenInfo tokenInfo;
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_TOKEN_INFO_URL + URLEncoder.encode(credential, StandardCharsets.UTF_8)))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google credential");
            }

            tokenInfo = GoogleTokenInfo.fromMap(jsonParser.parseMap(response.body()));
        } catch (Exception exception) {
            if (exception instanceof ResponseStatusException responseStatusException) {
                throw responseStatusException;
            }

            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google credential");
        }

        if (tokenInfo.getAudience() == null || !googleClientId.equals(tokenInfo.getAudience())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google credential");
        }

        String issuer = tokenInfo.getIssuer();
        if (!"accounts.google.com".equals(issuer) && !"https://accounts.google.com".equals(issuer)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google credential");
        }

        String email = tokenInfo.getEmail();
        String emailVerified = tokenInfo.getEmailVerified();

        if (email == null || email.isBlank() || !"true".equalsIgnoreCase(emailVerified)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google account email is not verified");
        }

        String fullName = tokenInfo.getName();
        if (fullName == null || fullName.isBlank()) {
            fullName = email;
        }

        return new GoogleUserProfile(tokenInfo.getSubject(), email, fullName);
    }

    public static class GoogleUserProfile {

        private final String subject;
        private final String email;
        private final String fullName;

        public GoogleUserProfile(String subject, String email, String fullName) {
            this.subject = subject;
            this.email = email;
            this.fullName = fullName;
        }

        public String getSubject() {
            return subject;
        }

        public String getEmail() {
            return email;
        }

        public String getFullName() {
            return fullName;
        }
    }

    public static class GoogleTokenInfo {
        private String subject;
        private String audience;
        private String issuer;
        private String email;
        private String emailVerified;
        private String name;

        public static GoogleTokenInfo fromMap(Map<String, Object> values) {
            GoogleTokenInfo tokenInfo = new GoogleTokenInfo();
            tokenInfo.setSubject(asString(values.get("sub")));
            tokenInfo.setAudience(asString(values.get("aud")));
            tokenInfo.setIssuer(asString(values.get("iss")));
            tokenInfo.setEmail(asString(values.get("email")));
            tokenInfo.setEmailVerified(asString(values.get("email_verified")));
            tokenInfo.setName(asString(values.get("name")));
            return tokenInfo;
        }

        private static String asString(Object value) {
            return value == null ? null : String.valueOf(value);
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public String getAudience() {
            return audience;
        }

        public void setAudience(String audience) {
            this.audience = audience;
        }

        public String getIssuer() {
            return issuer;
        }

        public void setIssuer(String issuer) {
            this.issuer = issuer;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getEmailVerified() {
            return emailVerified;
        }

        public void setEmailVerified(String emailVerified) {
            this.emailVerified = emailVerified;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }
}
