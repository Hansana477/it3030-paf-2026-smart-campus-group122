package backend.config;

import backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/users",
                                "/users/login",
                                "/users/verify-login-otp",
                                "/users/google",
                                "/users/forgot-password",
                                "/users/reset-password"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/resources", "/resources/*").permitAll()
                        .requestMatchers(HttpMethod.POST, "/resources/images").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/resources").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/resources/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/resources/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/users/pending-technicians").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/users/*/approve").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/uploads/**").authenticated()

                        .requestMatchers(HttpMethod.POST, "/tickets").authenticated()
                        .requestMatchers(HttpMethod.GET, "/tickets/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/tickets/*/comments").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/tickets/*/comments/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/tickets/*/comments/*").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/tickets/*/assign").hasAnyRole("ADMIN", "TECHNICIAN")
                        .requestMatchers(HttpMethod.PATCH, "/tickets/*/status").hasAnyRole("ADMIN", "TECHNICIAN")
                        .requestMatchers(HttpMethod.PATCH, "/tickets/*/reopen").authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://127.0.0.1:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
