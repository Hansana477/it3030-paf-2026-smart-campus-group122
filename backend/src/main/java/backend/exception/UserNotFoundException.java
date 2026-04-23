package backend.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message){
        super(message != null && message.startsWith("Could not find")
                ? message
                : "Could not find id " + message);
    }
}
