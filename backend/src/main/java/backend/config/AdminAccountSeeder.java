package backend.config;

import backend.model.UserModel;
import backend.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminAccountSeeder {

    private static final String ADMIN_EMAIL = "admin@smartcampus.local";
    private static final String ADMIN_PASSWORD = "Admin@1234";

    @Bean
    public ApplicationRunner seedAdminAccount(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            UserModel admin = userRepository.findByEmail(ADMIN_EMAIL).orElseGet(UserModel::new);

            admin.setFullName("Admin User");
            admin.setEmail(ADMIN_EMAIL);
            admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
            admin.setRole("ADMIN");
            admin.setPhone("0771234567");
            admin.setActive(true);
            admin.setApproved(true);
            admin.applyDefaults();

            userRepository.save(admin);
        };
    }
}
