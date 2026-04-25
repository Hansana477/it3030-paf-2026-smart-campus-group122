package backend.dto;

public class GoogleAuthResponse {

    private final String message;
    private final boolean requiresRoleSelection;
    private final String fullName;
    private final String email;

    public GoogleAuthResponse(String message, boolean requiresRoleSelection, String fullName, String email) {
        this.message = message;
        this.requiresRoleSelection = requiresRoleSelection;
        this.fullName = fullName;
        this.email = email;
    }

    public String getMessage() {
        return message;
    }

    public boolean isRequiresRoleSelection() {
        return requiresRoleSelection;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }
}
