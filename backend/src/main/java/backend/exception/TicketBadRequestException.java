package backend.exception;

public class TicketBadRequestException extends RuntimeException {
    public TicketBadRequestException(String message) {
        super(message);
    }
}
