package backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "bookings")
public class BookingModel {

    @Id
    private String id;

    private String resourceId;
    private String resourceName;
    private String resourceType;
    private String location;
    private String requesterId;
    private String requesterName;
    private String requesterEmail;
    private String requesterPhone;
    private String date;
    private String startTime;
    private String endTime;
    private String purpose;
    private Integer expectedAttendees;
    private List<String> seatIds = new ArrayList<>();
    private List<String> seatNumbers = new ArrayList<>();
    private String status;
    private String rejectionReason;
    private String cancellationReason;
    private String approverId;
    private String approverName;
    private String verificationCode;
    private String qrPayload;
    private Boolean approvalEmailSent;
    private String approvalEmailStatus;
    private LocalDateTime requestedAt;
    private LocalDateTime updatedAt;

    @Transient
    private Boolean reviewed;
    @Transient
    private String reviewId;
    @Transient
    private Integer reviewRating;
    @Transient
    private String reviewComment;

    public void applyDefaults() {
        if (seatIds == null) {
            seatIds = new ArrayList<>();
        }
        if (seatNumbers == null) {
            seatNumbers = new ArrayList<>();
        }
        if (status == null || status.isBlank()) {
            status = "PENDING";
        }
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }

    public String getResourceName() { return resourceName; }
    public void setResourceName(String resourceName) { this.resourceName = resourceName; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getRequesterId() { return requesterId; }
    public void setRequesterId(String requesterId) { this.requesterId = requesterId; }

    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }

    public String getRequesterEmail() { return requesterEmail; }
    public void setRequesterEmail(String requesterEmail) { this.requesterEmail = requesterEmail; }

    public String getRequesterPhone() { return requesterPhone; }
    public void setRequesterPhone(String requesterPhone) { this.requesterPhone = requesterPhone; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public Integer getExpectedAttendees() { return expectedAttendees; }
    public void setExpectedAttendees(Integer expectedAttendees) { this.expectedAttendees = expectedAttendees; }

    public List<String> getSeatIds() { return seatIds; }
    public void setSeatIds(List<String> seatIds) { this.seatIds = seatIds; }

    public List<String> getSeatNumbers() { return seatNumbers; }
    public void setSeatNumbers(List<String> seatNumbers) { this.seatNumbers = seatNumbers; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public String getApproverId() { return approverId; }
    public void setApproverId(String approverId) { this.approverId = approverId; }

    public String getApproverName() { return approverName; }
    public void setApproverName(String approverName) { this.approverName = approverName; }

    public String getVerificationCode() { return verificationCode; }
    public void setVerificationCode(String verificationCode) { this.verificationCode = verificationCode; }

    public String getQrPayload() { return qrPayload; }
    public void setQrPayload(String qrPayload) { this.qrPayload = qrPayload; }

    public Boolean getApprovalEmailSent() { return approvalEmailSent; }
    public void setApprovalEmailSent(Boolean approvalEmailSent) { this.approvalEmailSent = approvalEmailSent; }

    public String getApprovalEmailStatus() { return approvalEmailStatus; }
    public void setApprovalEmailStatus(String approvalEmailStatus) { this.approvalEmailStatus = approvalEmailStatus; }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getReviewed() { return reviewed; }
    public void setReviewed(Boolean reviewed) { this.reviewed = reviewed; }

    public String getReviewId() { return reviewId; }
    public void setReviewId(String reviewId) { this.reviewId = reviewId; }

    public Integer getReviewRating() { return reviewRating; }
    public void setReviewRating(Integer reviewRating) { this.reviewRating = reviewRating; }

    public String getReviewComment() { return reviewComment; }
    public void setReviewComment(String reviewComment) { this.reviewComment = reviewComment; }
}
