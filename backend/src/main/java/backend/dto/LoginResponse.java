package backend.dto;

import java.time.LocalDateTime;

public class LoginResponse {

    private String message;
    private String token;
    private boolean requiresOtp;
    private String otpDestination;
    private String id;
    private String fullName;
    private String email;
    private String role;
    private String phone;
    private boolean active;
    private boolean approved;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

   

    public LoginResponse(String message, boolean requiresOtp, String otpDestination, String email, String role) {
        this(message, null, requiresOtp, otpDestination, null, null, email, role, null, false, false, null, null);
    }

    public LoginResponse(String message, String token, boolean requiresOtp, String otpDestination, String id, String fullName, String email, String role, String phone,
                         boolean active, boolean approved, LocalDateTime createdAt, LocalDateTime lastLogin) {
        this.message = message;
        this.token = token;
        this.requiresOtp = requiresOtp;
        this.otpDestination = otpDestination;
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

    public boolean isRequiresOtp() {
        return requiresOtp;
    }

    public String getOtpDestination() {
        return otpDestination;
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
