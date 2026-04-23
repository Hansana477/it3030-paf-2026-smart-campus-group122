package backend.repository;

import backend.model.UserModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<UserModel, String> {

    Optional<UserModel> findByEmail(String email);

    Optional<UserModel> findByEmailAndRole(String email, String role);

    List<UserModel> findByRole(String role);

    List<UserModel> findByRoleAndApproved(String role, boolean approved);

    default void updateLastLogin(String id) {
        findById(id).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            save(user);
        });
    }

    boolean existsByEmail(String email);
}
