package backend.repository;

import backend.model.ReviewModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends MongoRepository<ReviewModel, String> {
    Optional<ReviewModel> findByBookingId(String bookingId);
    boolean existsByBookingId(String bookingId);
    List<ReviewModel> findByResourceId(String resourceId);
    List<ReviewModel> findByResourceIdOrderByCreatedAtDesc(String resourceId);
}
