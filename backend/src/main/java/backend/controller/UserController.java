package backend.controller;

import backend.dto.LoginRequest;
import backend.dto.LoginResponse;
import backend.exception.UserNotFoundException;
import backend.model.UserModel;
import backend.repository.UserRepository;
import backend.security.JwtService;
import org.springframework.http.HttpStatus;
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

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        return userRepository.save(newUser);
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

        userRepository.updateLastLogin(user.getId());

        UserModel loggedInUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new UserNotFoundException(user.getId()));

        return new LoginResponse(
                "Login successful",
                jwtService.generateToken(loggedInUser),
                loggedInUser.getId(),
                loggedInUser.getFullName(),
                loggedInUser.getEmail(),
                loggedInUser.getRole(),
                loggedInUser.getPhone(),
                loggedInUser.isActive(),
                loggedInUser.getCreatedAt(),
                loggedInUser.getLastLogin()
        );
    }

    @GetMapping
    public List<UserModel> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public UserModel getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @GetMapping("/by-email")
    public UserModel getUserByEmail(@RequestParam String email) {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new UserNotFoundException("Could not find user with email " + email));
    }

    @GetMapping("/by-email-and-role")
    public UserModel getUserByEmailAndRole(@RequestParam String email, @RequestParam String role) {
        return userRepository.findByEmailAndRole(normalizeEmail(email), normalizeRole(role))
                .orElseThrow(() -> new UserNotFoundException(
                        "Could not find user with email " + email + " and role " + role));
    }

    @PutMapping("/{id}")
    public UserModel updateUser(@RequestBody UserModel updatedUser, @PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    String normalizedEmail = normalizeEmail(updatedUser.getEmail());

                    if (!user.getEmail().equals(normalizedEmail)
                            && userRepository.existsByEmail(normalizedEmail)) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
                    }

                    user.setFullName(updatedUser.getFullName());
                    user.setEmail(normalizedEmail);
                    if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank()) {
                        user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
                    }
                    if (updatedUser.getRole() != null && !updatedUser.getRole().isBlank()) {
                        user.setRole(normalizeRole(updatedUser.getRole()));
                    }
                    user.setPhone(updatedUser.getPhone());
                    user.setActive(updatedUser.isActive());
                    user.setLastLogin(updatedUser.getLastLogin());
                    return userRepository.save(user);
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
        if (!normalizedRole.equals("STUDENT") && !normalizedRole.equals("TECHNICIAN")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be STUDENT or TECHNICIAN");
        }

        return normalizedRole;
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

    @PatchMapping("/{id}/last-login")
    public UserModel updateLastLogin(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }

        userRepository.updateLastLogin(id);
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteUser(@PathVariable Long id) {
        UserModel user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        userRepository.delete(user);
        return Map.of("message", "User with id " + id + " has been deleted successfully");
    }
}
