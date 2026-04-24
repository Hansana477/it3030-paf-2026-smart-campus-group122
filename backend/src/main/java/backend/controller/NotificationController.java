package backend.controller;

import backend.model.NotificationModel;
import backend.model.UserModel;
import backend.repository.NotificationRepository;
import backend.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    public NotificationController(
            NotificationService notificationService,
            NotificationRepository notificationRepository
    ) {
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public List<NotificationModel> getMyNotifications(Authentication authentication) {
        UserModel user = getAuthenticatedUser(authentication);
        return notificationService.getNotificationsForUser(user.getId());
    }

    @PatchMapping("/{id}/read")
    public NotificationModel markAsRead(@PathVariable String id, Authentication authentication) {
        UserModel user = getAuthenticatedUser(authentication);
        NotificationModel notification = notificationRepository.findByIdAndRecipientId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        return notificationService.markAsRead(notification);
    }

    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllAsRead(Authentication authentication) {
        UserModel user = getAuthenticatedUser(authentication);
        notificationService.markAllAsRead(user.getId());
    }

    private UserModel getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserModel user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        return user;
    }
}
