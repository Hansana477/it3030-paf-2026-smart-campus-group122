package backend.repository;

import backend.model.BookingModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<BookingModel, String> {
    List<BookingModel> findByRequesterId(String requesterId);
    List<BookingModel> findByResourceId(String resourceId);
    List<BookingModel> findByResourceIdAndDate(String resourceId, String date);
}
