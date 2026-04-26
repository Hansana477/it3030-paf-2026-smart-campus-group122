package backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "tickets")
public class TicketModel {

    @Id
    private String id;

    @Indexed(unique = true)
    private String ticketNumber;

    private String resourceId;
    private String resourceName;
    private String resourceType;
    private String location;

    private String category;
    private String description;
    private String priority; // LOW, MEDIUM, HIGH, CRITICAL
    private String status;   // OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED

    private String preferredContactName;
    private String preferredContactEmail;
    private String preferredContactPhone;

    private List<String> attachmentUrls = new ArrayList<>();

    private String rejectionReason;
    private String resolutionNotes;
    private String reopenReason;

    private String createdByUserId;
    private String createdByUserName;
    private String createdByUserEmail;

    private String assignedTechnicianId;
    private String assignedTechnicianName;
    private LocalDateTime assignedAt;

    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;

    private Integer reopenedCount = 0;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<TicketComment> comments = new ArrayList<>();
    private List<TicketActivityLog> activityLogs = new ArrayList<>();

    public TicketModel() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void applyDefaults() {
        if (status == null || status.isBlank()) {
            status = "OPEN";
        }
        if (priority == null || priority.isBlank()) {
            priority = "MEDIUM";
        }
        if (attachmentUrls == null) {
            attachmentUrls = new ArrayList<>();
        }
        if (comments == null) {
            comments = new ArrayList<>();
        }
        if (activityLogs == null) {
            activityLogs = new ArrayList<>();
        }
        if (reopenedCount == null) {
            reopenedCount = 0;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTicketNumber() {
        return ticketNumber;
    }

    public void setTicketNumber(String ticketNumber) {
        this.ticketNumber = ticketNumber;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPreferredContactName() {
        return preferredContactName;
    }

    public void setPreferredContactName(String preferredContactName) {
        this.preferredContactName = preferredContactName;
    }

    public String getPreferredContactEmail() {
        return preferredContactEmail;
    }

    public void setPreferredContactEmail(String preferredContactEmail) {
        this.preferredContactEmail = preferredContactEmail;
    }

    public String getPreferredContactPhone() {
        return preferredContactPhone;
    }

    public void setPreferredContactPhone(String preferredContactPhone) {
        this.preferredContactPhone = preferredContactPhone;
    }

    public List<String> getAttachmentUrls() {
        return attachmentUrls;
    }

    public void setAttachmentUrls(List<String> attachmentUrls) {
        this.attachmentUrls = attachmentUrls;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public String getReopenReason() {
        return reopenReason;
    }

    public void setReopenReason(String reopenReason) {
        this.reopenReason = reopenReason;
    }

    public String getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(String createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public String getCreatedByUserName() {
        return createdByUserName;
    }

    public void setCreatedByUserName(String createdByUserName) {
        this.createdByUserName = createdByUserName;
    }

    public String getCreatedByUserEmail() {
        return createdByUserEmail;
    }

    public void setCreatedByUserEmail(String createdByUserEmail) {
        this.createdByUserEmail = createdByUserEmail;
    }

    public String getAssignedTechnicianId() {
        return assignedTechnicianId;
    }

    public void setAssignedTechnicianId(String assignedTechnicianId) {
        this.assignedTechnicianId = assignedTechnicianId;
    }

    public String getAssignedTechnicianName() {
        return assignedTechnicianName;
    }

    public void setAssignedTechnicianName(String assignedTechnicianName) {
        this.assignedTechnicianName = assignedTechnicianName;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }

    public Integer getReopenedCount() {
        return reopenedCount;
    }

    public void setReopenedCount(Integer reopenedCount) {
        this.reopenedCount = reopenedCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<TicketComment> getComments() {
        return comments;
    }

    public void setComments(List<TicketComment> comments) {
        this.comments = comments;
    }

    public List<TicketActivityLog> getActivityLogs() {
        return activityLogs;
    }

    public void setActivityLogs(List<TicketActivityLog> activityLogs) {
        this.activityLogs = activityLogs;
    }

    public static class TicketComment {
        private String id;
        private String authorUserId;
        private String authorName;
        private String authorRole;
        private String message;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Boolean edited = false;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getAuthorUserId() {
            return authorUserId;
        }

        public void setAuthorUserId(String authorUserId) {
            this.authorUserId = authorUserId;
        }

        public String getAuthorName() {
            return authorName;
        }

        public void setAuthorName(String authorName) {
            this.authorName = authorName;
        }

        public String getAuthorRole() {
            return authorRole;
        }

        public void setAuthorRole(String authorRole) {
            this.authorRole = authorRole;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public LocalDateTime getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }

        public Boolean getEdited() {
            return edited;
        }

        public void setEdited(Boolean edited) {
            this.edited = edited;
        }
    }

    public static class TicketActivityLog {
        private String id;
        private String actionType;
        private String performedByUserId;
        private String performedByName;
        private String performedByRole;
        private String description;
        private LocalDateTime createdAt;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getActionType() {
            return actionType;
        }

        public void setActionType(String actionType) {
            this.actionType = actionType;
        }

        public String getPerformedByUserId() {
            return performedByUserId;
        }

        public void setPerformedByUserId(String performedByUserId) {
            this.performedByUserId = performedByUserId;
        }

        public String getPerformedByName() {
            return performedByName;
        }

        public void setPerformedByName(String performedByName) {
            this.performedByName = performedByName;
        }

        public String getPerformedByRole() {
            return performedByRole;
        }

        public void setPerformedByRole(String performedByRole) {
            this.performedByRole = performedByRole;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }
}
