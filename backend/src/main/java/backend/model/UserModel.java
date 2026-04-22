package backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "users")
public class UserModel {

    @Id
    private String id;

    private String fullName;

    @Indexed(unique = true)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String role; // STUDENT, TECHNICIAN

    private String phone;

    private Boolean active = Boolean.TRUE;

    private Boolean approved = Boolean.TRUE;

    private LocalDateTime createdAt;

    private LocalDateTime lastLogin;

    @JsonIgnore
    private String passwordResetCode;

    @JsonIgnore
    private LocalDateTime passwordResetExpiry;

    @JsonIgnore
    @org.springframework.data.mongodb.core.mapping.Field(name = "login_otp_code")
    private String loginOtpCode;

    @JsonIgnore
    @org.springframework.data.mongodb.core.mapping.Field(name = "login_otp_expiry")
    private LocalDateTime loginOtpExpiry;

    public UserModel() {
        this.createdAt = LocalDateTime.now();
    }

    public UserModel(String fullName, String email, String password, String role, String phone) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role;
        this.phone = phone;
        this.active = Boolean.TRUE;
        this.approved = Boolean.TRUE;
        this.createdAt = LocalDateTime.now();
    }

    public void applyDefaults() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        if (approved == null) {
            approved = Boolean.TRUE;
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public boolean isActive() { return active == null || active; }
    public Boolean getActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public void setActive(Boolean active) { this.active = active; }

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

    public String getLoginOtpCode() { return loginOtpCode; }
    public void setLoginOtpCode(String loginOtpCode) { this.loginOtpCode = loginOtpCode; }

    public LocalDateTime getLoginOtpExpiry() { return loginOtpExpiry; }
    public void setLoginOtpExpiry(LocalDateTime loginOtpExpiry) { this.loginOtpExpiry = loginOtpExpiry; }
}
