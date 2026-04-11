package backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class UserModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "password", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Column(name = "role", nullable = false)
    private String role; // STUDENT, TECHNICIAN

    @Column(name = "phone")
    private String phone;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "is_approved")
    private Boolean approved = Boolean.TRUE;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @JsonIgnore
    @Column(name = "password_reset_code")
    private String passwordResetCode;

    @JsonIgnore
    @Column(name = "password_reset_expiry")
    private LocalDateTime passwordResetExpiry;

    public UserModel() {
        this.createdAt = LocalDateTime.now();
    }

    public UserModel(String fullName, String email, String password, String role, String phone) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role;
        this.phone = phone;
        this.isActive = true;
        this.approved = Boolean.TRUE;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    @PreUpdate
    private void applyDefaults() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        if (approved == null) {
            approved = Boolean.TRUE;
        }
    }

    @PostLoad
    private void applyLegacyDefaults() {
        if (approved == null) {
            approved = Boolean.TRUE;
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public boolean isApproved() { return approved == null || approved; }
    public Boolean getApproved() { return approved; }

    public void setApproved(boolean approved) { this.approved = approved; }
    public void setApproved(Boolean approved) { this.approved = approved; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    public String getPasswordResetCode() { return passwordResetCode; }
    public void setPasswordResetCode(String passwordResetCode) { this.passwordResetCode = passwordResetCode; }

    public LocalDateTime getPasswordResetExpiry() { return passwordResetExpiry; }
    public void setPasswordResetExpiry(LocalDateTime passwordResetExpiry) { this.passwordResetExpiry = passwordResetExpiry; }
}
