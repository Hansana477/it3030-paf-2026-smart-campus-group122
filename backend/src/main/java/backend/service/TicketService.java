package backend.service;

import backend.dto.AddCommentRequest;
import backend.dto.AssignTicketRequest;
import backend.dto.CreateTicketRequest;
import backend.dto.ReopenTicketRequest;
import backend.dto.UpdateCommentRequest;
import backend.dto.UpdateTicketStatusRequest;
import backend.exception.InvalidTicketOperationException;
import backend.exception.TicketNotFoundException;
import backend.model.ResourceModel;
import backend.model.TicketModel;
import backend.model.UserModel;
import backend.repository.ResourceRepository;
import backend.repository.TicketRepository;
import backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private static final Path IMAGE_UPLOAD_DIR = Path.of("uploads", "ticket-images");
    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            MediaType.IMAGE_GIF_VALUE,
            "image/webp"
    );

    private static final List<String> ALLOWED_CATEGORIES = List.of(
            "ELECTRICAL",
            "NETWORK",
            "PROJECTOR",
            "COMPUTER",
            "FURNITURE",
            "AIR_CONDITIONING",
            "PLUMBING",
            "CLEANING",
            "OTHER"
    );

    private static final List<String> ALLOWED_PRIORITIES = List.of(
            "LOW",
            "MEDIUM",
            "HIGH",
            "CRITICAL"
    );

    private static final List<String> ALLOWED_STATUSES = List.of(
            "OPEN",
            "IN_PROGRESS",
            "RESOLVED",
            "CLOSED",
            "REJECTED"
    );

    private final TicketRepository ticketRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public TicketService(
            TicketRepository ticketRepository,
            ResourceRepository resourceRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.ticketRepository = ticketRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public TicketModel createTicket(
            CreateTicketRequest request,
            List<MultipartFile> images,
            UserModel actor,
            HttpServletRequest httpRequest
    ) throws IOException {
        requireAuthenticated(actor);

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ticket request body is required");
        }

        String resourceId = trimToNull(request.getResourceId());
        if (resourceId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource is required");
        }

        ResourceModel resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected resource does not exist"));

        String category = normalizeCategory(request.getCategory());
        String priority = normalizePriority(request.getPriority());
        String description = trimToNull(request.getDescription());

        if (description == null || description.length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description must be at least 10 characters long");
        }

        List<String> attachmentUrls = buildAttachmentUrls(request.getAttachmentUrls(), images, httpRequest);

        String preferredContactName = firstNonBlank(request.getPreferredContactName(), actor.getFullName());
        String preferredContactEmail = firstNonBlank(request.getPreferredContactEmail(), actor.getEmail());
        String preferredContactPhone = firstNonBlank(request.getPreferredContactPhone(), actor.getPhone());

        if (preferredContactEmail == null && preferredContactPhone == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one contact detail is required");
        }

        TicketModel ticket = new TicketModel();
        ticket.setTicketNumber(generateTicketNumber());
        ticket.setResourceId(resource.getId());
        ticket.setResourceName(resource.getName());
        ticket.setResourceType(resource.getType());
        ticket.setLocation(resource.getLocation());
        ticket.setCategory(category);
        ticket.setDescription(description);
        ticket.setPriority(priority);
        ticket.setStatus("OPEN");
        ticket.setPreferredContactName(preferredContactName);
        ticket.setPreferredContactEmail(preferredContactEmail);
        ticket.setPreferredContactPhone(preferredContactPhone);
        ticket.setAttachmentUrls(attachmentUrls);
        ticket.setCreatedByUserId(actor.getId());
        ticket.setCreatedByUserName(actor.getFullName());
        ticket.setCreatedByUserEmail(actor.getEmail());
        ticket.applyDefaults();

        addActivity(
                ticket,
                "CREATED",
                actor,
                "Ticket created for resource " + safe(resource.getName()) + " with priority " + priority
        );

        TicketModel savedTicket = ticketRepository.save(ticket);
        notificationService.notifyTicketCreated(savedTicket, actor);
        return savedTicket;
    }

    public List<TicketModel> getVisibleTickets(
            UserModel actor,
            String status,
            String priority,
            String category,
            String assignedTo,
            String createdBy,
            String search
    ) {
        requireAuthenticated(actor);

        String normalizedStatus = normalizeOptionalEnum(status, ALLOWED_STATUSES);
        String normalizedPriority = normalizeOptionalEnum(priority, ALLOWED_PRIORITIES);
        String normalizedCategory = normalizeOptionalEnum(category, ALLOWED_CATEGORIES);
        String assignedToFilter = trimToNull(assignedTo);
        String createdByFilter = trimToNull(createdBy);
        String searchFilter = trimToNull(search);

        return ticketRepository.findAll()
                .stream()
                .filter(ticket -> canViewTicket(actor, ticket))
                .filter(ticket -> normalizedStatus == null || normalizedStatus.equals(ticket.getStatus()))
                .filter(ticket -> normalizedPriority == null || normalizedPriority.equals(ticket.getPriority()))
                .filter(ticket -> normalizedCategory == null || normalizedCategory.equals(ticket.getCategory()))
                .filter(ticket -> assignedToFilter == null || assignedToFilter.equals(ticket.getAssignedTechnicianId()))
                .filter(ticket -> createdByFilter == null || createdByFilter.equals(ticket.getCreatedByUserId()))
                .filter(ticket -> matchesSearch(ticket, searchFilter))
                .sorted(Comparator.comparing(TicketModel::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .collect(Collectors.toList());
    }

    public TicketModel getTicketById(String ticketId, UserModel actor) {
        requireAuthenticated(actor);

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        if (!canViewTicket(actor, ticket)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to view this ticket");
        }

        return ticket;
    }

    public TicketModel assignTicket(String ticketId, AssignTicketRequest request, UserModel actor) {
        requireAuthenticated(actor);

        if (!isAdmin(actor) && !isTechnician(actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin or technician can assign tickets");
        }

        if (request == null || trimToNull(request.getTechnicianId()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Technician id is required");
        }

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        if ("CLOSED".equals(ticket.getStatus()) || "REJECTED".equals(ticket.getStatus())) {
            throw new InvalidTicketOperationException("Closed or rejected tickets cannot be assigned");
        }

        String technicianId = request.getTechnicianId().trim();

        if (isTechnician(actor) && !technicianId.equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Technicians can only assign tickets to themselves");
        }

        UserModel technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected technician does not exist"));

        if (!"TECHNICIAN".equals(technician.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected user is not a technician");
        }

        if (!technician.isActive() || !technician.isApproved()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Technician account is not active and approved");
        }

        ticket.setAssignedTechnicianId(technician.getId());
        ticket.setAssignedTechnicianName(technician.getFullName());
        ticket.setAssignedAt(LocalDateTime.now());
        ticket.touch();

        addActivity(
                ticket,
                "ASSIGNED",
                actor,
                "Ticket assigned to technician " + safe(technician.getFullName())
        );

        TicketModel savedTicket = ticketRepository.save(ticket);
        UserModel creator = userRepository.findById(savedTicket.getCreatedByUserId())
                .orElse(null);
        if (creator != null) {
            notificationService.notifyTicketAssigned(savedTicket, creator, technician.getFullName());
        }
        notificationService.notifyTicketAssignedToTechnician(savedTicket, technician, actor);
        return savedTicket;
    }

    public TicketModel updateStatus(String ticketId, UpdateTicketStatusRequest request, UserModel actor) {
        requireAuthenticated(actor);

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status update request is required");
        }

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        String targetStatus = normalizeStatus(request.getStatus());
        String currentStatus = ticket.getStatus();

        if (!isAdmin(actor) && !isTechnician(actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin or technician can update ticket status");
        }

        if (isTechnician(actor)) {
            if (ticket.getAssignedTechnicianId() == null || !actor.getId().equals(ticket.getAssignedTechnicianId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update tickets assigned to you");
            }

            if ("REJECTED".equals(targetStatus) || "CLOSED".equals(targetStatus)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Technicians cannot set REJECTED or CLOSED status");
            }
        }

        validateStatusTransition(currentStatus, targetStatus, actor, ticket);

        if ("IN_PROGRESS".equals(targetStatus) && ticket.getAssignedTechnicianId() == null) {
            throw new InvalidTicketOperationException("A technician must be assigned before moving a ticket to IN_PROGRESS");
        }

        if ("RESOLVED".equals(targetStatus)) {
            String resolutionNotes = trimToNull(request.getResolutionNotes());
            if (resolutionNotes == null || resolutionNotes.length() < 5) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resolution notes are required when resolving a ticket");
            }
            ticket.setResolutionNotes(resolutionNotes);
            ticket.setResolvedAt(LocalDateTime.now());
            ticket.setClosedAt(null);
            ticket.setRejectionReason(null);
        }

        if ("REJECTED".equals(targetStatus)) {
            String rejectionReason = trimToNull(request.getRejectionReason());
            if (rejectionReason == null || rejectionReason.length() < 5) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason is required when rejecting a ticket");
            }
            ticket.setRejectionReason(rejectionReason);
            ticket.setResolvedAt(null);
            ticket.setClosedAt(null);
        }

        if ("CLOSED".equals(targetStatus)) {
            ticket.setClosedAt(LocalDateTime.now());
        }

        if ("IN_PROGRESS".equals(targetStatus)) {
            ticket.setClosedAt(null);
            ticket.setRejectionReason(null);
        }

        ticket.setStatus(targetStatus);
        ticket.touch();

        addActivity(
                ticket,
                "STATUS_CHANGED",
                actor,
                "Status changed from " + currentStatus + " to " + targetStatus
        );

        TicketModel savedTicket = ticketRepository.save(ticket);
        UserModel creator = userRepository.findById(savedTicket.getCreatedByUserId())
                .orElse(null);
        if (creator != null) {
            notificationService.notifyTicketStatusChanged(savedTicket, creator, currentStatus);
        }
        return savedTicket;
    }

    public TicketModel confirmResolution(String ticketId, UserModel actor) {
        requireAuthenticated(actor);

        if (!isStudent(actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the reporting student can confirm the resolution");
        }

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        if (actor.getId() == null || !actor.getId().equals(ticket.getCreatedByUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only confirm resolution for your own tickets");
        }

        if (!"RESOLVED".equals(ticket.getStatus())) {
            throw new InvalidTicketOperationException("Only resolved tickets can be confirmed and closed");
        }

        ticket.setStatus("CLOSED");
        ticket.setClosedAt(LocalDateTime.now());
        ticket.touch();

        addActivity(
                ticket,
                "RESOLUTION_CONFIRMED",
                actor,
                "Student confirmed the fix and closed the ticket"
        );

        TicketModel savedTicket = ticketRepository.save(ticket);
        notificationService.notifyTicketConfirmed(savedTicket, actor);
        return savedTicket;
    }

    public TicketModel reopenTicket(String ticketId, ReopenTicketRequest request, UserModel actor) {
        requireAuthenticated(actor);

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        if (!canViewTicket(actor, ticket)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to reopen this ticket");
        }

        if (isStudent(actor) && !actor.getId().equals(ticket.getCreatedByUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only reopen your own tickets");
        }

        if (!List.of("RESOLVED", "CLOSED", "REJECTED").contains(ticket.getStatus())) {
            throw new InvalidTicketOperationException("Only resolved, closed, or rejected tickets can be reopened");
        }

        String reopenReason = request == null ? null : trimToNull(request.getReason());
        if (reopenReason == null || reopenReason.length() < 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A reopen reason is required");
        }

        ticket.setStatus("OPEN");
        ticket.setClosedAt(null);
        ticket.setResolvedAt(null);
        ticket.setRejectionReason(null);
        ticket.setReopenReason(reopenReason);
        ticket.setReopenedCount((ticket.getReopenedCount() == null ? 0 : ticket.getReopenedCount()) + 1);
        ticket.touch();

        addActivity(
                ticket,
                "REOPENED",
                actor,
                "Ticket reopened. Reason: " + reopenReason
        );

        TicketModel savedTicket = ticketRepository.save(ticket);
        notificationService.notifyTicketReopened(savedTicket, actor);
        return savedTicket;
    }

    public TicketModel addComment(String ticketId, AddCommentRequest request, UserModel actor) {
        requireAuthenticated(actor);

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        if (!canViewTicket(actor, ticket)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to comment on this ticket");
        }

        String message = request == null ? null : trimToNull(request.getMessage());
        if (message == null || message.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment message must be at least 2 characters long");
        }

        TicketModel.TicketComment comment = new TicketModel.TicketComment();
        comment.setId(UUID.randomUUID().toString());
        comment.setAuthorUserId(actor.getId());
        comment.setAuthorName(actor.getFullName());
        comment.setAuthorRole(actor.getRole());
        comment.setMessage(message);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        comment.setEdited(false);

        ticket.getComments().add(comment);
        ticket.touch();

        addActivity(
                ticket,
                "COMMENT_ADDED",
                actor,
                "Comment added by " + safe(actor.getFullName())
        );

        TicketModel savedTicket = ticketRepository.save(ticket);
        notificationService.notifyTicketCommentAdded(savedTicket, actor);
        return savedTicket;
    }

    public TicketModel updateComment(String ticketId, String commentId, UpdateCommentRequest request, UserModel actor) {
        requireAuthenticated(actor);

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        if (!canViewTicket(actor, ticket)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to edit comments on this ticket");
        }

        TicketModel.TicketComment comment = findComment(ticket, commentId);

        if (!actor.getId().equals(comment.getAuthorUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own comments");
        }

        String message = request == null ? null : trimToNull(request.getMessage());
        if (message == null || message.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment message must be at least 2 characters long");
        }

        comment.setMessage(message);
        comment.setUpdatedAt(LocalDateTime.now());
        comment.setEdited(true);
        ticket.touch();

        addActivity(
                ticket,
                "COMMENT_EDITED",
                actor,
                "Comment updated by " + safe(actor.getFullName())
        );

        return ticketRepository.save(ticket);
    }

    public void deleteComment(String ticketId, String commentId, UserModel actor) {
        requireAuthenticated(actor);

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        if (!canViewTicket(actor, ticket)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to delete comments on this ticket");
        }

        TicketModel.TicketComment comment = findComment(ticket, commentId);

        boolean authorOwnsComment = actor.getId().equals(comment.getAuthorUserId());
        if (!authorOwnsComment && !isAdmin(actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own comments unless you are an admin");
        }

        ticket.getComments().removeIf(existingComment -> commentId.equals(existingComment.getId()));
        ticket.touch();

        addActivity(
                ticket,
                "COMMENT_DELETED",
                actor,
                "Comment deleted by " + safe(actor.getFullName())
        );

        ticketRepository.save(ticket);
    }

    private TicketModel.TicketComment findComment(TicketModel ticket, String commentId) {
        return ticket.getComments()
                .stream()
                .filter(comment -> commentId.equals(comment.getId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
    }

    private void validateStatusTransition(String currentStatus, String targetStatus, UserModel actor, TicketModel ticket) {
        if (currentStatus == null) {
            throw new InvalidTicketOperationException("Current ticket status is missing");
        }

        if (currentStatus.equals(targetStatus)) {
            throw new InvalidTicketOperationException("Ticket is already in status " + targetStatus);
        }

        switch (currentStatus) {
            case "OPEN" -> {
                if (!List.of("IN_PROGRESS", "REJECTED").contains(targetStatus)) {
                    throw new InvalidTicketOperationException("OPEN tickets can only move to IN_PROGRESS or REJECTED");
                }
            }
            case "IN_PROGRESS" -> {
                if (!List.of("RESOLVED", "REJECTED").contains(targetStatus)) {
                    throw new InvalidTicketOperationException("IN_PROGRESS tickets can only move to RESOLVED or REJECTED");
                }
            }
            case "RESOLVED" -> {
                if (!List.of("CLOSED", "IN_PROGRESS").contains(targetStatus)) {
                    throw new InvalidTicketOperationException("RESOLVED tickets can only move to CLOSED or back to IN_PROGRESS");
                }
            }
            case "CLOSED", "REJECTED" -> throw new InvalidTicketOperationException(
                    "Use the reopen endpoint to reopen a closed or rejected ticket"
            );
            default -> throw new InvalidTicketOperationException("Unsupported current status: " + currentStatus);
        }

        if ("REJECTED".equals(targetStatus) && !isAdmin(actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin can reject tickets");
        }

        if ("CLOSED".equals(targetStatus) && !isAdmin(actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin can close tickets through this endpoint");
        }
    }

    private boolean canViewTicket(UserModel actor, TicketModel ticket) {
        if (isAdmin(actor)) {
            return true;
        }

        if (isStudent(actor)) {
            return actor.getId() != null && actor.getId().equals(ticket.getCreatedByUserId());
        }

        if (isTechnician(actor)) {
            boolean assignedToThisTechnician = actor.getId() != null && actor.getId().equals(ticket.getAssignedTechnicianId());
            boolean unassignedOpenTicket = "OPEN".equals(ticket.getStatus()) && ticket.getAssignedTechnicianId() == null;
            return assignedToThisTechnician || unassignedOpenTicket;
        }

        return false;
    }

    private boolean matchesSearch(TicketModel ticket, String search) {
        if (search == null) {
            return true;
        }

        String value = search.toLowerCase(Locale.ROOT);

        return contains(ticket.getTicketNumber(), value)
                || contains(ticket.getResourceName(), value)
                || contains(ticket.getLocation(), value)
                || contains(ticket.getCategory(), value)
                || contains(ticket.getPriority(), value)
                || contains(ticket.getStatus(), value)
                || contains(ticket.getCreatedByUserName(), value)
                || contains(ticket.getAssignedTechnicianName(), value)
                || contains(ticket.getDescription(), value);
    }

    private boolean contains(String fieldValue, String searchValue) {
        return fieldValue != null && fieldValue.toLowerCase(Locale.ROOT).contains(searchValue);
    }

    private String normalizeCategory(String category) {
        String normalized = normalizeRequiredEnum(category, ALLOWED_CATEGORIES, "Category");
        return normalized;
    }

    private String normalizePriority(String priority) {
        return normalizeRequiredEnum(priority, ALLOWED_PRIORITIES, "Priority");
    }

    private String normalizeStatus(String status) {
        return normalizeRequiredEnum(status, ALLOWED_STATUSES, "Status");
    }

    private String normalizeRequiredEnum(String value, List<String> allowedValues, String fieldName) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required");
        }

        normalized = normalized.toUpperCase(Locale.ROOT);
        if (!allowedValues.contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " must be one of: " + String.join(", ", allowedValues)
            );
        }

        return normalized;
    }

    private String normalizeOptionalEnum(String value, List<String> allowedValues) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }

        normalized = normalized.toUpperCase(Locale.ROOT);
        if (!allowedValues.contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid filter value. Allowed values: " + String.join(", ", allowedValues)
            );
        }

        return normalized;
    }

    private List<String> sanitizeAttachmentUrls(List<String> attachmentUrls) {
        List<String> sanitized = attachmentUrls == null
                ? List.of()
                : attachmentUrls.stream()
                .map(this::trimToNull)
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .collect(Collectors.toList());

        if (sanitized.size() > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A ticket can include up to 3 image attachments");
        }

        return sanitized;
    }

    private List<String> buildAttachmentUrls(
            List<String> existingAttachmentUrls,
            List<MultipartFile> images,
            HttpServletRequest httpRequest
    ) throws IOException {
        List<String> attachmentUrls = new ArrayList<>(sanitizeAttachmentUrls(existingAttachmentUrls));

        if (images == null || images.isEmpty()) {
            return attachmentUrls;
        }

        List<MultipartFile> filesToStore = images.stream()
                .filter(image -> image != null && !image.isEmpty())
                .collect(Collectors.toList());

        if (attachmentUrls.size() + filesToStore.size() > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A ticket can include up to 3 image attachments");
        }

        if (filesToStore.isEmpty()) {
            return attachmentUrls;
        }

        Files.createDirectories(IMAGE_UPLOAD_DIR);

        for (MultipartFile image : filesToStore) {
            String contentType = image.getContentType();
            if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Only JPG, PNG, GIF, and WEBP images are allowed"
                );
            }

            if (image.getSize() > MAX_IMAGE_SIZE_BYTES) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Each image must be 5MB or smaller"
                );
            }

            String extension = getExtension(image.getOriginalFilename(), contentType);
            String fileName = UUID.randomUUID() + extension;
            Path target = IMAGE_UPLOAD_DIR.resolve(fileName).normalize();

            Files.copy(image.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            attachmentUrls.add(
                    httpRequest.getScheme() + "://" + httpRequest.getServerName() + ":" + httpRequest.getServerPort()
                            + "/uploads/ticket-images/" + fileName
            );
        }

        return attachmentUrls;
    }

    private String getExtension(String originalFilename, String contentType) {
        if (originalFilename != null) {
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex >= 0 && dotIndex < originalFilename.length() - 1) {
                String extension = originalFilename.substring(dotIndex).toLowerCase(Locale.ROOT);
                if (extension.matches("\\.(jpg|jpeg|png|gif|webp)")) {
                    return extension;
                }
            }
        }

        return switch (contentType) {
            case MediaType.IMAGE_PNG_VALUE -> ".png";
            case MediaType.IMAGE_GIF_VALUE -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    private String generateTicketNumber() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        return "TCK-" + datePart + "-" + randomPart;
    }

    private void addActivity(TicketModel ticket, String actionType, UserModel actor, String description) {
        TicketModel.TicketActivityLog log = new TicketModel.TicketActivityLog();
        log.setId(UUID.randomUUID().toString());
        log.setActionType(actionType);
        log.setPerformedByUserId(actor.getId());
        log.setPerformedByName(actor.getFullName());
        log.setPerformedByRole(actor.getRole());
        log.setDescription(description);
        log.setCreatedAt(LocalDateTime.now());

        ticket.getActivityLogs().add(log);
    }

    private void requireAuthenticated(UserModel actor) {
        if (actor == null || actor.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
    }

    private boolean isAdmin(UserModel actor) {
        return actor != null && "ADMIN".equals(actor.getRole());
    }

    private boolean isTechnician(UserModel actor) {
        return actor != null && "TECHNICIAN".equals(actor.getRole());
    }

    private boolean isStudent(UserModel actor) {
        return actor != null && "STUDENT".equals(actor.getRole());
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String firstNonBlank(String first, String second) {
        String value = trimToNull(first);
        return value != null ? value : trimToNull(second);
    }

    private String safe(String value) {
        return value == null ? "Unknown" : value;
    }
}
