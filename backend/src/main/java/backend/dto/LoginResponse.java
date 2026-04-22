package backend.dto;

import java.time.LocalDateTime;

public class LoginResponse {

    private String message;
    private String token;
    private String id;
    private String fullName;
    private String email;
    private String role;
    private String phone;
    private boolean active;
    private boolean approved;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    public LoginResponse(String message, String token, String id, String fullName, String email, String role, String phone,
                         boolean active, boolean approved, LocalDateTime createdAt, LocalDateTime lastLogin) {
        this.message = message;
        this.token = token;
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.phone = phone;
        this.active = active;
        this.approved = approved;
        this.createdAt = createdAt;
        this.lastLogin = lastLogin;
    }

    public String getMessage() {
        return message;
    }

    public String getToken() {
        return token;
    }

    public String getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getPhone() {
        return phone;
    }

    public boolean isActive() {
        return active;
    }

    public boolean isApproved() {
        return approved;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }
}
