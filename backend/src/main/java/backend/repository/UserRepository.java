package backend.repository;

import backend.model.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserModel, Long> {

    Optional<UserModel> findByEmail(String email);

    Optional<UserModel> findByEmailAndRole(String email, String role);

    @Modifying
    @Transactional
    @Query("UPDATE UserModel u SET u.lastLogin = CURRENT_TIMESTAMP WHERE u.id = :id")
    void updateLastLogin(@Param("id") Long id);

    boolean existsByEmail(String email);
}