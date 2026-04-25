package backend.service;

import backend.model.BookingModel;
import backend.model.NotificationModel;
import backend.model.ResourceModel;
import backend.model.TicketModel;
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

    public NotificationModel createSilentNotification(UserModel recipient, String title, String message, String type) {
        NotificationModel notification = new NotificationModel();
        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRead(false);
        return notificationRepository.save(notification);
    }

    public void notifyWelcome(UserModel user) {
        createSilentNotification(
                user,
                "Welcome to Smart Campus!",
                "Hi " + user.getFullName() + ", welcome to Smart Campus. We are glad to have you here!",
                "GENERAL"
        );
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

    public void notifyBookingCreated(BookingModel booking, UserModel user) {
        createNotification(
                user,
                "Booking request received",
                "Your booking request for " + booking.getResourceName() + " on " + booking.getDate() + " is pending approval.",
                "BOOKING_CREATED"
        );

        // Notify admins
        List<UserModel> admins = userRepository.findByRole("ADMIN");
        for (UserModel admin : admins) {
            createNotification(
                    admin,
                    "New booking request",
                    "A new booking request for " + booking.getResourceName() + " has been submitted by " + user.getFullName() + ".",
                    "ADMIN_BOOKING_CREATED"
            );
        }
    }

    public void notifyBookingApproved(BookingModel booking, UserModel user) {
        createNotification(
                user,
                "Booking approved!",
                "Your booking for " + booking.getResourceName() + " on " + booking.getDate() + " has been approved. Check your email for the access ticket.",
                "BOOKING_APPROVED"
        );
    }

    public void notifyBookingRejected(BookingModel booking, UserModel user, String reason) {
        createNotification(
                user,
                "Booking rejected",
                "Your booking for " + booking.getResourceName() + " on " + booking.getDate() + " was rejected. Reason: " + reason,
                "BOOKING_REJECTED"
        );
    }

    public void notifyBookingCancelled(BookingModel booking, UserModel user) {
        createNotification(
                user,
                "Booking cancelled",
                "Your booking for " + booking.getResourceName() + " on " + booking.getDate() + " has been cancelled.",
                "BOOKING_CANCELLED"
        );

        // Notify admins
        List<UserModel> admins = userRepository.findByRole("ADMIN");
        for (UserModel admin : admins) {
            createNotification(
                    admin,
                    "Booking cancelled",
                    "Booking for " + booking.getResourceName() + " on " + booking.getDate() + " has been cancelled by " + user.getFullName() + ".",
                    "ADMIN_BOOKING_CANCELLED"
            );
        }
    }

    public void notifyBookingRescheduled(BookingModel booking, UserModel user, String oldDate, String oldTime) {
        createNotification(
                user,
                "Booking rescheduled",
                "Your booking for " + booking.getResourceName() + " has been rescheduled from " + oldDate + " (" + oldTime + ") to " + booking.getDate() + " (" + booking.getStartTime() + ").",
                "BOOKING_RESCHEDULED"
        );

        // Notify admins
        List<UserModel> admins = userRepository.findByRole("ADMIN");
        for (UserModel admin : admins) {
            createNotification(
                    admin,
                    "Booking rescheduled",
                    "Booking for " + booking.getResourceName() + " has been rescheduled by " + user.getFullName() + " to " + booking.getDate() + ".",
                    "ADMIN_BOOKING_RESCHEDULED"
            );
        }
    }

    public void notifyTicketCreated(TicketModel ticket, UserModel user) {
        createNotification(
                user,
                "Ticket opened: " + ticket.getTicketNumber(),
                "A new support ticket has been created for " + ticket.getResourceName() + ". Priority: " + ticket.getPriority(),
                "TICKET_CREATED"
        );

        // Notify admins
        List<UserModel> admins = userRepository.findByRole("ADMIN");
        for (UserModel admin : admins) {
            createNotification(
                    admin,
                    "New support ticket: " + ticket.getTicketNumber(),
                    "A new support ticket has been submitted by " + user.getFullName() + " for " + ticket.getResourceName() + ".",
                    "ADMIN_TICKET_CREATED"
            );
        }
    }

    public void notifyTicketStatusChanged(TicketModel ticket, UserModel user, String oldStatus) {
        createNotification(
                user,
                "Ticket status updated: " + ticket.getTicketNumber(),
                "Your ticket for " + ticket.getResourceName() + " is now in the " + ticket.getStatus() + " stage.",
                "TICKET_STATUS_CHANGED"
        );
    }

    public void notifyTicketAssigned(TicketModel ticket, UserModel user, String technicianName) {
        createNotification(
                user,
                "Ticket assigned: " + ticket.getTicketNumber(),
                "Your ticket has been assigned to technician " + technicianName + ".",
                "TICKET_ASSIGNED"
        );
    }

    public void notifyTicketReopened(TicketModel ticket, UserModel student) {
        // Notify admins
        List<UserModel> admins = userRepository.findByRole("ADMIN");
        for (UserModel admin : admins) {
            createNotification(
                    admin,
                    "Ticket reopened: " + ticket.getTicketNumber(),
                    "Ticket for " + ticket.getResourceName() + " has been reopened by " + student.getFullName() + ". Reason: " + ticket.getReopenReason(),
                    "ADMIN_TICKET_REOPENED"
            );
        }

        // Notify assigned technician if any
        if (ticket.getAssignedTechnicianId() != null) {
            userRepository.findById(ticket.getAssignedTechnicianId()).ifPresent(technician -> {
                createNotification(
                        technician,
                        "Assigned ticket reopened: " + ticket.getTicketNumber(),
                        "The ticket you were assigned for " + ticket.getResourceName() + " has been reopened by the student.",
                        "TECHNICIAN_TICKET_REOPENED"
                );
            });
        }
    }

    public void notifyTicketConfirmed(TicketModel ticket, UserModel student) {
        // Notify admins
        List<UserModel> admins = userRepository.findByRole("ADMIN");
        for (UserModel admin : admins) {
            createNotification(
                    admin,
                    "Ticket resolution confirmed: " + ticket.getTicketNumber(),
                    "Student " + student.getFullName() + " has confirmed the resolution and closed the ticket for " + ticket.getResourceName() + ".",
                    "ADMIN_TICKET_CONFIRMED"
            );
        }

        // Notify assigned technician if any
        if (ticket.getAssignedTechnicianId() != null) {
            userRepository.findById(ticket.getAssignedTechnicianId()).ifPresent(technician -> {
                createNotification(
                        technician,
                        "Ticket resolution confirmed: " + ticket.getTicketNumber(),
                        "The student has confirmed your fix and closed the ticket for " + ticket.getResourceName() + ".",
                        "TECHNICIAN_TICKET_CONFIRMED"
                );
            });
        }
    }

    public void notifyResourceCreated(ResourceModel resource) {
        List<UserModel> users = userRepository.findAll();
        for (UserModel user : users) {
            createSilentNotification(
                    user,
                    "New resource available!",
                    "A new resource '" + resource.getName() + "' is now available at " + resource.getLocation() + ". Check it out!",
                    "RESOURCE_CREATED"
            );
        }
    }
}
