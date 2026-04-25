package backend.repository;

import backend.model.TicketModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TicketRepository extends MongoRepository<TicketModel, String> {
    Optional<TicketModel> findByTicketNumber(String ticketNumber);
}