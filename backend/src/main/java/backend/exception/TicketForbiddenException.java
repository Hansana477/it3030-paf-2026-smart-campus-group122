package backend.exception;

public class TicketForbiddenException extends RuntimeException {
    public TicketForbiddenException(String message) {
        super(message);
    }
}
