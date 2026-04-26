package backend.controller;

import backend.dto.LoginRequest;
import backend.dto.LoginResponse;
import backend.dto.GoogleAuthRequest;
import backend.dto.GoogleAuthResponse;
import backend.dto.ChangePasswordRequest;
import backend.dto.ForgotPasswordRequest;
import backend.dto.ResetPasswordRequest;
import backend.dto.VerifyLoginOtpRequest;
import backend.exception.UserNotFoundException;
import backend.model.UserModel;
import backend.repository.UserRepository;
import backend.security.GoogleTokenVerifierService;
import backend.security.JwtService;
import backend.service.EmailNotificationService;
import backend.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@RestController
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
})
@RequestMapping("/users")
public class UserController {
    private static final String STUDENT_EMAIL_SUFFIX = "@my.sliit.lk";
    private static final String PASSWORD_REQUIREMENTS_MESSAGE =
            "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol";
    private static final String PHONE_REQUIREMENTS_MESSAGE =
            "Phone number must be a valid Sri Lankan mobile number such as +947XXXXXXXX or 07XXXXXXXX";
    private static final int RESET_CODE_EXPIRY_MINUTES = 15;
    private static final int LOGIN_OTP_EXPIRY_MINUTES = 10;
    private static final SecureRandom RESET_CODE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final EmailNotificationService emailNotificationService;
    private final NotificationService notificationService;

    public UserController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            GoogleTokenVerifierService googleTokenVerifierService,
            EmailNotificationService emailNotificationService,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleTokenVerifierService = googleTokenVerifierService;
        this.emailNotificationService = emailNotificationService;
        this.notificationService = notificationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserModel createUser(@RequestBody UserModel newUser) {
        String normalizedEmail = normalizeEmail(newUser.getEmail());
        String normalizedRole = normalizeRole(newUser.getRole());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }

        if (newUser.getPassword() == null || newUser.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }

        newUser.setEmail(normalizedEmail);
        newUser.setRole(normalizedRole);
        validateStudentEmailForRole(normalizedEmail, normalizedRole);
        validatePasswordStrength(newUser.getPassword());
        newUser.setPhone(normalizePhone(newUser.getPhone()));
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        newUser.setApproved(!"TECHNICIAN".equals(normalizedRole));

        UserModel savedUser = userRepository.save(newUser);
        emailNotificationService.sendRegistrationEmail(savedUser);
        if ("TECHNICIAN".equals(savedUser.getRole()) && !savedUser.isApproved()) {
            notificationService.notifyAdminsOfPendingTechnician(savedUser);
        }
        return savedUser;
    }

    @PostMapping("/login")
    public LoginResponse loginUser(@RequestBody LoginRequest loginRequest) {
        if (loginRequest.getEmail() == null || loginRequest.getEmail().isBlank()
                || loginRequest.getPassword() == null || loginRequest.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }

        String email = normalizeEmail(loginRequest.getEmail());

        UserModel user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User account is inactive");
        }

        boolean passwordMatches = passwordMatches(loginRequest.getPassword(), user);
        if (!passwordMatches) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        if (shouldRequireLoginOtp(user)) {
            issueLoginOtp(user);
            return new LoginResponse(
                    "A first-time login verification code has been sent to your email address.",
                    true,
                    user.getEmail(),
                    user.getEmail(),
                    user.getRole()
            );
        }

        if (user.getLastLogin() == null) {
            notificationService.notifyWelcome(user);
        }

        userRepository.updateLastLogin(user.getId());

        UserModel loggedInUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new UserNotFoundException(user.getId()));

        return buildLoginResponse("Login successful", loggedInUser);
    }

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleAuthRequest googleAuthRequest) {
        GoogleTokenVerifierService.GoogleUserProfile googleProfile =
                googleTokenVerifierService.verify(googleAuthRequest.getCredential());

        String email = normalizeEmail(googleProfile.getEmail());

        UserModel user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            if (googleAuthRequest.getRole() == null || googleAuthRequest.getRole().isBlank()) {
                return ResponseEntity.ok(new GoogleAuthResponse(
                        "Select Student or Technician to finish Google sign-in.",
                        true,
                        googleProfile.getFullName(),
                        email
                ));
            }

            user = createGoogleUser(googleProfile, normalizeGoogleSignupRole(googleAuthRequest.getRole()));
        }

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User account is inactive");
        }

        String userId = user.getId();
        if (user.getLastLogin() == null) {
            notificationService.notifyWelcome(user);
        }

        userRepository.updateLastLogin(userId);

        UserModel loggedInUser = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        return ResponseEntity.ok(buildLoginResponse("Login successful", loggedInUser));
    }

    @PostMapping("/verify-login-otp")
    public LoginResponse verifyLoginOtp(@RequestBody VerifyLoginOtpRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()
                || request.getCode() == null || request.getCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and verification code are required");
        }

        String email = normalizeEmail(request.getEmail());
        String otpCode = request.getCode().trim();

        UserModel user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired verification code"));

        if (!shouldRequireLoginOtp(user)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This account does not require login verification");
        }

        if (!otpCode.equals(user.getLoginOtpCode())
                || user.getLoginOtpExpiry() == null
                || user.getLoginOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired verification code");
        }

        clearLoginOtpState(user);
        userRepository.save(user);
        if (user.getLastLogin() == null) {
            notificationService.notifyWelcome(user);
        }

        userRepository.updateLastLogin(user.getId());

        UserModel loggedInUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new UserNotFoundException(user.getId()));

        return buildLoginResponse("Login successful", loggedInUser);
    }

    @GetMapping
    public List<UserModel> getAllUsers(Authentication authentication) {
        requireAdmin(authentication);
        return userRepository.findAll();
    }

    @GetMapping("/pending-technicians")
    public List<UserModel> getPendingTechnicians() {
        return userRepository.findByRoleAndApproved("TECHNICIAN", false);
    }

    @GetMapping("/{id}")
    public UserModel getUserById(@PathVariable String id, Authentication authentication) {
        requireSelfOrAdmin(authentication, id);
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @GetMapping("/by-email")
    public UserModel getUserByEmail(@RequestParam String email, Authentication authentication) {
        requireAdmin(authentication);
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new UserNotFoundException("Could not find user with email " + email));
    }

    @GetMapping("/search")
    public List<UserModel> searchUsersByEmail(@RequestParam String email, Authentication authentication) {
        requireAdmin(authentication);
        return userRepository.findByEmailContainingIgnoreCase(email.trim().toLowerCase());
    }

    @GetMapping("/by-email-and-role")
    public UserModel getUserByEmailAndRole(
            @RequestParam String email,
            @RequestParam String role,
            Authentication authentication
    ) {
        requireAdmin(authentication);
        return userRepository.findByEmailAndRole(normalizeEmail(email), normalizeRole(role))
                .orElseThrow(() -> new UserNotFoundException(
                        "Could not find user with email " + email + " and role " + role));
    }

    @PutMapping("/{id}")
    public UserModel updateUser(@RequestBody UserModel updatedUser, @PathVariable String id, Authentication authentication) {
        UserModel authenticatedUser = requireSelfOrAdmin(authentication, id);
        boolean isAdmin = isAdmin(authenticatedUser);
        boolean updatingAnotherUser = isAdmin && !authenticatedUser.getId().equals(id);

        return userRepository.findById(id)
                .map(user -> {
                    String normalizedEmail = normalizeEmail(updatedUser.getEmail());
                    List<String> changedFields = new ArrayList<>();
                    boolean wasApproved = user.isApproved();
                    String existingPhone = normalizePhone(user.getPhone());
                    String nextPhone = normalizePhone(updatedUser.getPhone());

                    if (!user.getEmail().equals(normalizedEmail)
                            && userRepository.existsByEmail(normalizedEmail)) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
                    }

                    if (!Objects.equals(user.getFullName(), updatedUser.getFullName())) {
                        changedFields.add("full name");
                    }
                    if (!Objects.equals(user.getEmail(), normalizedEmail)) {
                        changedFields.add("email address");
                    }
                    if (!Objects.equals(existingPhone, nextPhone)) {
                        changedFields.add("phone number");
                    }

                    user.setFullName(updatedUser.getFullName());
                    user.setEmail(normalizedEmail);
                    if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank()) {
                        validatePasswordStrength(updatedUser.getPassword());
                        user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
                    }
                    if (isAdmin && updatedUser.getRole() != null && !updatedUser.getRole().isBlank()) {
                        String normalizedRole = normalizeRole(updatedUser.getRole());
                        if (!Objects.equals(user.getRole(), normalizedRole)) {
                            changedFields.add("role");
                        }
                        user.setRole(normalizedRole);
                        if (!"TECHNICIAN".equals(normalizedRole)) {
                            user.setApproved(true);
                        }
                    }
                    validateStudentEmailForRole(user.getEmail(), user.getRole());
                    user.setPhone(nextPhone);

                    if (isAdmin) {
                        if (user.isActive() != updatedUser.isActive()) {
                            changedFields.add("account status");
                        }
                        user.setActive(updatedUser.isActive());
                        if ("TECHNICIAN".equals(user.getRole())) {
                            if (user.isApproved() != updatedUser.isApproved()) {
                                changedFields.add("approval status");
                            }
                            user.setApproved(updatedUser.isApproved());
                        } else {
                            user.setApproved(true);
                        }
                        user.setLastLogin(updatedUser.getLastLogin());
                    }

                    UserModel savedUser = userRepository.save(user);
                    if (!changedFields.isEmpty()) {
                        notificationService.notifyAccountDetailsUpdated(savedUser, changedFields, updatingAnotherUser);
                    }
                    if (isAdmin && "TECHNICIAN".equals(savedUser.getRole()) && !wasApproved && savedUser.isApproved()) {
                        notificationService.notifyTechnicianApproved(savedUser);
                    }

                    return savedUser;
                })
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        return email.trim().toLowerCase();
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role is required");
        }

        String normalizedRole = role.trim().toUpperCase();
        if (!normalizedRole.equals("STUDENT")
                && !normalizedRole.equals("TECHNICIAN")
                && !normalizedRole.equals("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be STUDENT, TECHNICIAN, or ADMIN");
        }

        return normalizedRole;
    }

    private void validateStudentEmailForRole(String normalizedEmail, String normalizedRole) {
        if ("STUDENT".equals(normalizedRole) && !normalizedEmail.endsWith(STUDENT_EMAIL_SUFFIX)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Student email must end with @my.sliit.lk"
            );
        }
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }

        boolean hasUppercase = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLowercase = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSymbol = password.chars().anyMatch(character ->
                !Character.isLetterOrDigit(character) && !Character.isWhitespace(character)
        );

        if (!hasUppercase || !hasLowercase || !hasDigit || !hasSymbol) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PASSWORD_REQUIREMENTS_MESSAGE);
        }
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }

        String normalizedPhone = phone.trim();
        if (normalizedPhone.isBlank()) {
            return null;
        }

        String digitsOnlyPhone = normalizedPhone.replaceAll("\\s+", "");

        if (digitsOnlyPhone.matches("\\+94\\d{9}")) {
            return digitsOnlyPhone;
        }

        if (digitsOnlyPhone.matches("94\\d{9}")) {
            return "+" + digitsOnlyPhone;
        }

        if (digitsOnlyPhone.matches("0\\d{9}")) {
            return "+94" + digitsOnlyPhone.substring(1);
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PHONE_REQUIREMENTS_MESSAGE);
    }

    private boolean passwordMatches(String rawPassword, UserModel user) {
        String storedPassword = user.getPassword();

        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }

        if (isBcryptHash(storedPassword)) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }

        if (storedPassword.equals(rawPassword)) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            return true;
        }

        return false;
    }

    private boolean isBcryptHash(String value) {
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }

    private String normalizeGoogleSignupRole(String role) {
        String normalizedRole = normalizeRole(role);
        if (!"STUDENT".equals(normalizedRole) && !"TECHNICIAN".equals(normalizedRole)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Google sign-up role must be STUDENT or TECHNICIAN"
            );
        }

        return normalizedRole;
    }

    private UserModel createGoogleUser(
            GoogleTokenVerifierService.GoogleUserProfile googleProfile,
            String normalizedRole
    ) {
        UserModel user = new UserModel();
        user.setFullName(googleProfile.getFullName());
        user.setEmail(normalizeEmail(googleProfile.getEmail()));
        validateStudentEmailForRole(user.getEmail(), normalizedRole);
        user.setPassword(passwordEncoder.encode(
                "GOOGLE_AUTH_" + googleProfile.getSubject() + "_" + UUID.randomUUID()
        ));
        user.setRole(normalizedRole);
        user.setPhone(null);
        user.setActive(true);
        user.setApproved(!"TECHNICIAN".equals(normalizedRole));
        UserModel savedUser = userRepository.save(user);
        emailNotificationService.sendRegistrationEmail(savedUser);
        if ("TECHNICIAN".equals(savedUser.getRole()) && !savedUser.isApproved()) {
            notificationService.notifyAdminsOfPendingTechnician(savedUser);
        }
        return savedUser;
    }

    private LoginResponse buildLoginResponse(String message, UserModel user) {
        return new LoginResponse(
                message,
                jwtService.generateToken(user),
                false,
                null,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getPhone(),
                user.isActive(),
                user.isApproved(),
                user.getCreatedAt(),
                user.getLastLogin()
        );
    }

    @PatchMapping("/{id}/approve")
    public UserModel approveTechnician(@PathVariable String id, Authentication authentication) {
        requireAdmin(authentication);
        return userRepository.findById(id)
                .map(user -> {
                    if (!"TECHNICIAN".equals(user.getRole())) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only technicians can be approved");
                    }

                    user.setApproved(true);
                    UserModel savedUser = userRepository.save(user);
                    notificationService.notifyTechnicianApproved(savedUser);
                    return savedUser;
                })
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @PatchMapping("/{id}/password")
    public Map<String, String> changePassword(
            @PathVariable String id,
            @RequestBody ChangePasswordRequest request,
            Authentication authentication
    ) {
        requireSelfOrAdmin(authentication, id);

        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()
                || request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Current password and new password are required"
            );
        }

        if (request.getNewPassword().length() < 6) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "New password must be at least 6 characters long"
            );
        }

        validatePasswordStrength(request.getNewPassword());

        UserModel user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        if (!isAdmin(getAuthenticatedUser(authentication)) && !passwordMatches(request.getCurrentPassword(), user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        clearPasswordResetState(user);
        userRepository.save(user);
        notificationService.notifyPasswordChanged(user);

        return Map.of("message", "Password changed successfully");
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());

        userRepository.findByEmail(email).ifPresent(user -> {
            String resetCode = generateResetCode();
            user.setPasswordResetCode(resetCode);
            user.setPasswordResetExpiry(LocalDateTime.now().plusMinutes(RESET_CODE_EXPIRY_MINUTES));
            userRepository.save(user);
            emailNotificationService.sendPasswordResetEmail(user, resetCode);
        });

        return Map.of("message", "If an account exists for that email, a password reset code has been sent.");
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request.getCode() == null || request.getCode().isBlank()
                || request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email, reset code, and new password are required"
            );
        }

        if (request.getNewPassword().length() < 6) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "New password must be at least 6 characters long"
            );
        }

        validatePasswordStrength(request.getNewPassword());

        String email = normalizeEmail(request.getEmail());
        String resetCode = request.getCode().trim();

        UserModel user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid or expired reset code"
                ));

        if (!resetCode.equals(user.getPasswordResetCode())
                || user.getPasswordResetExpiry() == null
                || user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset code");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        clearPasswordResetState(user);
        userRepository.save(user);
        notificationService.notifyPasswordChanged(user);

        return Map.of("message", "Password has been reset successfully");
    }

    @PatchMapping("/{id}/last-login")
    public UserModel updateLastLogin(@PathVariable String id, Authentication authentication) {
        requireSelfOrAdmin(authentication, id);
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }

        userRepository.updateLastLogin(id);
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteUser(@PathVariable String id, Authentication authentication) {
        requireSelfOrAdmin(authentication, id);

        UserModel user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        userRepository.delete(user);
        return Map.of("message", "User with id " + id + " has been deleted successfully");
    }

    private String generateResetCode() {
        return String.format("%06d", RESET_CODE_RANDOM.nextInt(1_000_000));
    }

    private boolean shouldRequireLoginOtp(UserModel user) {
        return user != null
                && "STUDENT".equals(user.getRole())
                && user.getLastLogin() == null;
    }

    private void issueLoginOtp(UserModel user) {
        String otpCode = generateResetCode();
        user.setLoginOtpCode(otpCode);
        user.setLoginOtpExpiry(LocalDateTime.now().plusMinutes(LOGIN_OTP_EXPIRY_MINUTES));
        userRepository.save(user);

        boolean sent = emailNotificationService.sendLoginOtpEmail(user, otpCode);
        if (!sent) {
            clearLoginOtpState(user);
            userRepository.save(user);
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Login verification email could not be sent. Please check email configuration and try again."
            );
        }
    }

    private void clearPasswordResetState(UserModel user) {
        user.setPasswordResetCode(null);
        user.setPasswordResetExpiry(null);
    }

    private void clearLoginOtpState(UserModel user) {
        user.setLoginOtpCode(null);
        user.setLoginOtpExpiry(null);
    }

    private UserModel getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserModel authenticatedUser)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        return authenticatedUser;
    }

    private UserModel requireSelfOrAdmin(Authentication authentication, String targetUserId) {
        UserModel authenticatedUser = getAuthenticatedUser(authentication);
        if (!isAdmin(authenticatedUser) && !authenticatedUser.getId().equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission for this action");
        }

        return authenticatedUser;
    }

    private void requireAdmin(Authentication authentication) {
        if (!isAdmin(getAuthenticatedUser(authentication))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access is required");
        }
    }

    private boolean isAdmin(UserModel user) {
        return user != null && "ADMIN".equals(user.getRole());
    }
}
