package backend.service;

import backend.model.BookingModel;
import backend.model.NotificationModel;
import backend.model.ResourceModel;
import backend.model.TicketModel;
import backend.model.UserModel;
import backend.repository.NotificationRepository;
import backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationService {

    private static final long SSE_TIMEOUT_MS = 30L * 60L * 1000L;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailNotificationService emailNotificationService;
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emittersByUserId = new ConcurrentHashMap<>();

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
        broadcastNotificationCreated(savedNotification);
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
        NotificationModel savedNotification = notificationRepository.save(notification);
        broadcastNotificationCreated(savedNotification);
        return savedNotification;
    }

    public void notifyWelcome(UserModel user) {
        createSilentNotification(
                user,
                "Welcome to UniNex!",
                "Hi " + user.getFullName() + ", welcome to UniNex. We are glad to have you here!",
                "GENERAL"
        );
    }

    public List<NotificationModel> getNotificationsForUser(String userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public SseEmitter subscribe(UserModel user) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        emittersByUserId.computeIfAbsent(user.getId(), ignored -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(user.getId(), emitter));
        emitter.onTimeout(() -> removeEmitter(user.getId(), emitter));
        emitter.onError(error -> removeEmitter(user.getId(), emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of(
                            "message", "Notification stream connected",
                            "unreadCount", notificationRepository.findByRecipientIdAndReadFalse(user.getId()).size()
                    )));
        } catch (IOException exception) {
            removeEmitter(user.getId(), emitter);
            emitter.completeWithError(exception);
        }

        return emitter;
    }

    public NotificationModel markAsRead(NotificationModel notification) {
        notification.setRead(true);
        NotificationModel savedNotification = notificationRepository.save(notification);
        broadcastNotificationUpdated(savedNotification);
        return savedNotification;
    }

    public void markAllAsRead(String userId) {
        List<NotificationModel> unread = notificationRepository.findByRecipientIdAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        broadcastAllNotificationsRead(userId, unread);
    }

    public void notifyAdminsOfPendingTechnician(UserModel technician) {
        notifyUsers(
                activeAdmins(),
                "New technician approval needed",
                technician.getFullName() + " is waiting for admin approval as a technician.",
                "TECHNICIAN_PENDING",
                false
        );
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

        notifyUsers(
                activeAdminsExcluding(user == null ? null : user.getId()),
                "New booking request",
                "A new booking request for " + booking.getResourceName() + " has been submitted by " + user.getFullName() + ".",
                "ADMIN_BOOKING_CREATED",
                false
        );
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

    public void notifyBookingCancelled(BookingModel booking, UserModel user, UserModel actor) {
        createNotification(
                user,
                "Booking cancelled",
                "Your booking for " + booking.getResourceName() + " on " + booking.getDate() + " has been cancelled.",
                "BOOKING_CANCELLED"
        );

        notifyUsers(
                activeAdminsExcluding(actor == null ? null : actor.getId()),
                "Booking cancelled",
                "Booking for " + booking.getResourceName() + " on " + booking.getDate() + " has been cancelled by " + user.getFullName() + ".",
                "ADMIN_BOOKING_CANCELLED",
                false
        );
    }

    public void notifyBookingRescheduled(BookingModel booking, UserModel user, String oldDate, String oldTime, UserModel actor) {
        createNotification(
                user,
                "Booking rescheduled",
                "Your booking for " + booking.getResourceName() + " has been rescheduled from " + oldDate + " (" + oldTime + ") to " + booking.getDate() + " (" + booking.getStartTime() + ").",
                "BOOKING_RESCHEDULED"
        );

        notifyUsers(
                activeAdminsExcluding(actor == null ? null : actor.getId()),
                "Booking rescheduled",
                "Booking for " + booking.getResourceName() + " has been rescheduled by " + user.getFullName() + " to " + booking.getDate() + ".",
                "ADMIN_BOOKING_RESCHEDULED",
                false
        );
    }

    public void notifyTicketCreated(TicketModel ticket, UserModel user) {
        createNotification(
                user,
                "Ticket opened: " + ticket.getTicketNumber(),
                "A new support ticket has been created for " + ticket.getResourceName() + ". Priority: " + ticket.getPriority(),
                "TICKET_CREATED"
        );

        notifyUsers(
                activeAdminsExcluding(user == null ? null : user.getId()),
                "New support ticket: " + ticket.getTicketNumber(),
                "A new support ticket has been submitted by " + user.getFullName() + " for " + ticket.getResourceName() + ".",
                "ADMIN_TICKET_CREATED",
                false
        );
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

    public void notifyTicketAssignedToTechnician(TicketModel ticket, UserModel technician, UserModel assignedBy) {
        createNotification(
                technician,
                "New assigned ticket: " + ticket.getTicketNumber(),
                "You have been assigned to " + ticket.getResourceName() + " by " + safeName(assignedBy) + ".",
                "TECHNICIAN_TICKET_ASSIGNED"
        );
    }

    public void notifyTicketReopened(TicketModel ticket, UserModel actor) {
        notifyUsers(
                activeAdminsExcluding(actor == null ? null : actor.getId()),
                "Ticket reopened: " + ticket.getTicketNumber(),
                "Ticket for " + ticket.getResourceName() + " has been reopened by " + safeName(actor) + ". Reason: " + ticket.getReopenReason(),
                "ADMIN_TICKET_REOPENED",
                false
        );

        if (ticket.getAssignedTechnicianId() != null) {
            userRepository.findById(ticket.getAssignedTechnicianId()).ifPresent(technician -> {
                if (!sameUser(technician, actor)) {
                    createNotification(
                            technician,
                            "Assigned ticket reopened: " + ticket.getTicketNumber(),
                            "The ticket you were assigned for " + ticket.getResourceName() + " has been reopened by " + safeName(actor) + ".",
                            "TECHNICIAN_TICKET_REOPENED"
                    );
                }
            });
        }

        userRepository.findById(ticket.getCreatedByUserId()).ifPresent(creator -> {
            if (!sameUser(creator, actor)) {
                createNotification(
                        creator,
                        "Ticket reopened: " + ticket.getTicketNumber(),
                        "Your ticket for " + ticket.getResourceName() + " has been reopened by " + safeName(actor) + ".",
                        "TICKET_STATUS_CHANGED"
                );
            }
        });
    }

    public void notifyTicketConfirmed(TicketModel ticket, UserModel student) {
        notifyUsers(
                activeAdminsExcluding(student == null ? null : student.getId()),
                "Ticket resolution confirmed: " + ticket.getTicketNumber(),
                "Student " + student.getFullName() + " has confirmed the resolution and closed the ticket for " + ticket.getResourceName() + ".",
                "ADMIN_TICKET_CONFIRMED",
                false
        );

        if (ticket.getAssignedTechnicianId() != null) {
            userRepository.findById(ticket.getAssignedTechnicianId()).ifPresent(technician -> {
                if (!sameUser(technician, student)) {
                    createNotification(
                            technician,
                            "Ticket resolution confirmed: " + ticket.getTicketNumber(),
                            "The student has confirmed your fix and closed the ticket for " + ticket.getResourceName() + ".",
                            "TECHNICIAN_TICKET_CONFIRMED"
                    );
                }
            });
        }
    }

    public void notifyTicketCommentAdded(TicketModel ticket, UserModel commenter) {
        Set<String> notifiedUserIds = new HashSet<>();

        userRepository.findById(ticket.getCreatedByUserId()).ifPresent(creator -> {
            if (!sameUser(creator, commenter)) {
                createNotification(
                        creator,
                        "New ticket comment: " + ticket.getTicketNumber(),
                        safeName(commenter) + " added a new comment to your ticket for " + ticket.getResourceName() + ".",
                        "TICKET_COMMENT_ADDED"
                );
                notifiedUserIds.add(creator.getId());
            }
        });

        if (ticket.getAssignedTechnicianId() != null) {
            userRepository.findById(ticket.getAssignedTechnicianId()).ifPresent(technician -> {
                if (!sameUser(technician, commenter) && !notifiedUserIds.contains(technician.getId())) {
                    createNotification(
                            technician,
                            "New ticket comment: " + ticket.getTicketNumber(),
                            safeName(commenter) + " added a new comment on the ticket assigned to you.",
                            "TECHNICIAN_TICKET_COMMENT_ADDED"
                    );
                    notifiedUserIds.add(technician.getId());
                }
            });
        }

        for (UserModel admin : activeAdminsExcluding(commenter == null ? null : commenter.getId())) {
            if (!sameUser(admin, commenter) && !notifiedUserIds.contains(admin.getId())) {
                createSilentNotification(
                        admin,
                        "Ticket comment added: " + ticket.getTicketNumber(),
                        safeName(commenter) + " commented on " + ticket.getResourceName() + ".",
                        "ADMIN_TICKET_COMMENT_ADDED"
                );
            }
        }
    }

    public void notifyResourceCreated(ResourceModel resource, UserModel actor) {
        notifyUsers(
                activeAdminsExcluding(actor == null ? null : actor.getId()),
                "New resource available!",
                "A new resource '" + resource.getName() + "' was added at " + resource.getLocation() + ".",
                "RESOURCE_CREATED",
                true
        );
    }

    public void notifyResourceUpdated(ResourceModel resource, UserModel actor) {
        notifyUsers(
                activeAdminsExcluding(actor == null ? null : actor.getId()),
                "Resource updated",
                "The resource '" + resource.getName() + "' was updated. Review the latest details in resource management.",
                "RESOURCE_UPDATED",
                true
        );
    }

    public void notifyResourceDeleted(ResourceModel resource, UserModel actor) {
        notifyUsers(
                activeAdminsExcluding(actor == null ? null : actor.getId()),
                "Resource removed",
                "The resource '" + resource.getName() + "' was removed from UniNex.",
                "RESOURCE_DELETED",
                true
        );
    }

    private void broadcastNotificationCreated(NotificationModel notification) {
        broadcastToUser(
                notification.getRecipient().getId(),
                "notification-created",
                Map.of("notification", notification)
        );
    }

    private void broadcastNotificationUpdated(NotificationModel notification) {
        broadcastToUser(
                notification.getRecipient().getId(),
                "notification-updated",
                Map.of("notification", notification)
        );
    }

    private void broadcastAllNotificationsRead(String userId, List<NotificationModel> notifications) {
        if (notifications == null || notifications.isEmpty()) {
            return;
        }

        List<String> notificationIds = new ArrayList<>();
        for (NotificationModel notification : notifications) {
            notificationIds.add(notification.getId());
        }

        broadcastToUser(
                userId,
                "notifications-read-all",
                Map.of("notificationIds", notificationIds)
        );
    }

    private void broadcastToUser(String userId, String eventName, Object payload) {
        if (userId == null) {
            return;
        }

        CopyOnWriteArrayList<SseEmitter> emitters = emittersByUserId.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> staleEmitters = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload));
            } catch (IOException exception) {
                staleEmitters.add(emitter);
                emitter.completeWithError(exception);
            }
        }

        staleEmitters.forEach(stale -> removeEmitter(userId, stale));
    }

    private void removeEmitter(String userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = emittersByUserId.get(userId);
        if (emitters == null) {
            return;
        }

        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            emittersByUserId.remove(userId);
        }
    }

    private boolean sameUser(UserModel left, UserModel right) {
        if (left == null || right == null || left.getId() == null || right.getId() == null) {
            return false;
        }
        return left.getId().equals(right.getId());
    }

    private String safeName(UserModel user) {
        return user == null || user.getFullName() == null || user.getFullName().isBlank()
                ? "Someone"
                : user.getFullName();
    }

    private void notifyUsers(List<UserModel> recipients, String title, String message, String type, boolean silent) {
        if (recipients == null || recipients.isEmpty()) {
            return;
        }

        Set<String> notifiedUserIds = new HashSet<>();
        for (UserModel recipient : recipients) {
            if (!shouldReceiveNotification(recipient) || recipient.getId() == null || !notifiedUserIds.add(recipient.getId())) {
                continue;
            }

            if (silent) {
                createSilentNotification(recipient, title, message, type);
            } else {
                createNotification(recipient, title, message, type);
            }
        }
    }

    private List<UserModel> activeAdmins() {
        return userRepository.findByRole("ADMIN")
                .stream()
                .filter(this::shouldReceiveNotification)
                .toList();
    }

    private List<UserModel> activeAdminsExcluding(String excludedUserId) {
        return activeAdmins()
                .stream()
                .filter(user -> excludedUserId == null || !excludedUserId.equals(user.getId()))
                .toList();
    }

    private List<UserModel> activeNonAdminUsers() {
        return userRepository.findAll()
                .stream()
                .filter(this::shouldReceiveNotification)
                .filter(user -> !"ADMIN".equals(user.getRole()))
                .toList();
    }

    private boolean shouldReceiveNotification(UserModel user) {
        if (user == null || user.getId() == null || !user.isActive()) {
            return false;
        }

        return !"TECHNICIAN".equals(user.getRole()) || user.isApproved();
    }
}

