package backend.repository;

import backend.model.NotificationModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends MongoRepository<NotificationModel, String> {

    List<NotificationModel> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

    Optional<NotificationModel> findByIdAndRecipientId(String id, String recipientId);

    List<NotificationModel> findByRecipientIdAndReadFalse(String recipientId);
}
