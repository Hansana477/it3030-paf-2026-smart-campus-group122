package backend.service;

import backend.model.NotificationModel;
import backend.model.UserModel;
import backend.repository.NotificationRepository;
import backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailNotificationService emailNotificationService;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            EmailNotificationService emailNotificationService
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.emailNotificationService = emailNotificationService;
    }

    public NotificationModel createNotification(UserModel recipient, String title, String message, String type) {
        NotificationModel notification = new NotificationModel();
        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRead(false);
        NotificationModel savedNotification = notificationRepository.save(notification);
        emailNotificationService.sendNotificationEmail(recipient, title, message, type);
        return savedNotification;
    }

    public List<NotificationModel> getNotificationsForUser(String userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public NotificationModel markAsRead(NotificationModel notification) {
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead(String userId) {
        List<NotificationModel> unread = notificationRepository.findByRecipientIdAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void notifyAdminsOfPendingTechnician(UserModel technician) {
        List<UserModel> admins = userRepository.findByRole("ADMIN");
        for (UserModel admin : admins) {
            createNotification(
                    admin,
                    "New technician approval needed",
                    technician.getFullName() + " is waiting for admin approval as a technician.",
                    "TECHNICIAN_PENDING"
            );
        }
    }

    public void notifyTechnicianApproved(UserModel technician) {
        createNotification(
                technician,
                "Technician account approved",
                "Your technician account has been approved by an admin. You can now access technician features.",
                "TECHNICIAN_APPROVED"
        );
    }

    public void notifyAccountDetailsUpdated(UserModel user, List<String> changedFields, boolean updatedByAdmin) {
        if (changedFields == null || changedFields.isEmpty()) {
            return;
        }

        String intro = updatedByAdmin
                ? "An administrator updated your account details"
                : "Your account details were updated";
        String details = String.join(", ", changedFields);

        createNotification(
                user,
                "Account details updated",
                intro + ": " + details + ".",
                "ACCOUNT_DETAILS_UPDATED"
        );
    }

    public void notifyPasswordChanged(UserModel user) {
        createNotification(
                user,
                "Password changed",
                "Your account password was changed successfully.",
                "PASSWORD_CHANGED"
        );
    }
}
