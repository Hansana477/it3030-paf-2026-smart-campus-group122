package backend.exception;

public class TicketNotFoundException extends RuntimeException {

    public TicketNotFoundException(String ticketId) {
        super("Could not find ticket with id " + ticketId);
    }
}