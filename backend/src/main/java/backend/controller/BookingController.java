package backend.controller;

import backend.exception.UserNotFoundException;
import backend.model.BookingModel;
import backend.model.ResourceModel;
import backend.model.UserModel;
import backend.repository.BookingRepository;
import backend.repository.ResourceRepository;
import backend.repository.ReviewRepository;
import backend.service.EmailNotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
})
@RequestMapping("/bookings")
public class BookingController {

    private static final List<String> CONFLICT_STATUSES = List.of("PENDING", "APPROVED");
    private static final int STUDENT_CANCELLATION_MIN_HOURS = 3;

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final ReviewRepository reviewRepository;
    private final EmailNotificationService emailNotificationService;

    public BookingController(
            BookingRepository bookingRepository,
            ResourceRepository resourceRepository,
            ReviewRepository reviewRepository,
            EmailNotificationService emailNotificationService
    ) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.reviewRepository = reviewRepository;
        this.emailNotificationService = emailNotificationService;
    }

    @GetMapping
    public List<BookingModel> getBookings(
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String status,
            Authentication authentication
    ) {
        UserModel user = currentUser(authentication);
        List<BookingModel> bookings = "ADMIN".equals(user.getRole())
                ? bookingRepository.findAll()
                : bookingRepository.findByRequesterId(user.getId());

        return bookings.stream()
                .filter(booking -> resourceId == null || resourceId.isBlank() || resourceId.equals(booking.getResourceId()))
                .filter(booking -> date == null || date.isBlank() || date.equals(booking.getDate()))
                .filter(booking -> status == null || status.isBlank() || status.equalsIgnoreCase(booking.getStatus()))
                .toList();
    }

    @GetMapping("/my")
    public List<BookingModel> getMyBookings(Authentication authentication) {
        return bookingRepository.findByRequesterId(currentUser(authentication).getId()).stream()
                .map(this::attachReviewSummary)
                .toList();
    }

    @GetMapping("/resource/{resourceId}")
    public List<BookingModel> getResourceBookings(
            @PathVariable String resourceId,
            @RequestParam(required = false) String date
    ) {
        if (date == null || date.isBlank()) {
            return bookingRepository.findByResourceId(resourceId);
        }
        return bookingRepository.findByResourceIdAndDate(resourceId, date);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingModel createBooking(@RequestBody BookingModel booking, Authentication authentication) {
        UserModel user = currentUser(authentication);
        ResourceModel resource = resourceRepository.findById(booking.getResourceId())
                .orElseThrow(() -> new UserNotFoundException("Could not find resource with id " + booking.getResourceId()));

        populateBooking(booking, user, resource);
        validateBooking(booking, null);
        ensureNoConflict(booking, null);
        booking.applyDefaults();
        return bookingRepository.save(booking);
    }

    @PatchMapping("/{id}/approve")
    public BookingModel approveBooking(@PathVariable String id, Authentication authentication) {
        UserModel admin = requireAdmin(authentication);
        BookingModel booking = getBooking(id);
        if (!"PENDING".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending bookings can be approved");
        }
        ensureNoConflict(booking, booking.getId());
        booking.setStatus("APPROVED");
        booking.setApproverId(admin.getId());
        booking.setApproverName(admin.getFullName());
        applyVerificationDetails(booking);
        booking.applyDefaults();
        BookingModel savedBooking = bookingRepository.save(booking);
        return sendApprovalEmailAndRecord(savedBooking);
    }

    @PatchMapping("/{id}/send-approval-email")
    public BookingModel resendApprovalEmail(@PathVariable String id, Authentication authentication) {
        requireAdmin(authentication);
        BookingModel booking = getBooking(id);
        if (!"APPROVED".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only approved bookings can receive verification email");
        }
        applyVerificationDetails(booking);
        booking.applyDefaults();
        BookingModel savedBooking = bookingRepository.save(booking);
        return sendApprovalEmailAndRecord(savedBooking);
    }

    @PatchMapping("/{id}/reject")
    public BookingModel rejectBooking(@PathVariable String id, @RequestBody Map<String, String> body, Authentication authentication) {
        UserModel admin = requireAdmin(authentication);
        BookingModel booking = getBooking(id);
        if (!"PENDING".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending bookings can be rejected");
        }
        String reason = body.getOrDefault("reason", "").trim();
        if (reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason is required");
        }
        booking.setStatus("REJECTED");
        booking.setRejectionReason(reason);
        booking.setApproverId(admin.getId());
        booking.setApproverName(admin.getFullName());
        booking.applyDefaults();
        return bookingRepository.save(booking);
    }

    @PatchMapping("/{id}/cancel")
    public BookingModel cancelBooking(@PathVariable String id, @RequestBody(required = false) Map<String, String> body, Authentication authentication) {
        UserModel user = currentUser(authentication);
        BookingModel booking = getBooking(id);
        requireOwnerOrAdmin(user, booking);
        if (!"APPROVED".equals(booking.getStatus()) && !"PENDING".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending or approved bookings can be cancelled");
        }
        enforceCancellationPolicy(user, booking);
        booking.setStatus("CANCELLED");
        booking.setCancellationReason(body == null ? null : body.get("reason"));
        booking.applyDefaults();
        return bookingRepository.save(booking);
    }

    @PatchMapping("/{id}/reschedule")
    public BookingModel rescheduleBooking(@PathVariable String id, @RequestBody BookingModel request, Authentication authentication) {
        UserModel user = currentUser(authentication);
        BookingModel booking = getBooking(id);
        requireOwnerOrAdmin(user, booking);
        if ("CANCELLED".equals(booking.getStatus()) || "REJECTED".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelled or rejected bookings cannot be rescheduled");
        }

        booking.setDate(request.getDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setSeatIds(request.getSeatIds());
        booking.setSeatNumbers(request.getSeatNumbers());
        if (request.getPurpose() != null) {
            booking.setPurpose(request.getPurpose());
        }
        if (request.getExpectedAttendees() != null) {
            booking.setExpectedAttendees(request.getExpectedAttendees());
        }
        booking.setStatus("PENDING");
        booking.setRejectionReason(null);
        booking.setApproverId(null);
        booking.setApproverName(null);
        booking.setVerificationCode(null);
        booking.setQrPayload(null);
        booking.setApprovalEmailSent(null);
        booking.setApprovalEmailStatus(null);
        validateBooking(booking, booking.getId());
        ensureNoConflict(booking, booking.getId());
        booking.applyDefaults();
        return bookingRepository.save(booking);
    }

    private BookingModel sendApprovalEmailAndRecord(BookingModel booking) {
        boolean emailSent = emailNotificationService.sendBookingApprovedEmail(booking);
        booking.setApprovalEmailSent(emailSent);
        booking.setApprovalEmailStatus(emailSent ? "SENT" : "FAILED");
        booking.applyDefaults();
        return bookingRepository.save(booking);
    }

    private void populateBooking(BookingModel booking, UserModel user, ResourceModel resource) {
        booking.setResourceName(resource.getName());
        booking.setResourceType(resource.getType());
        booking.setLocation(resource.getLocation());
        booking.setRequesterId(user.getId());
        booking.setRequesterName(user.getFullName());
        booking.setRequesterEmail(user.getEmail());
        booking.setRequesterPhone(user.getPhone());
        booking.setStatus("PENDING");

        if (booking.getSeatIds() == null) {
            booking.setSeatIds(new ArrayList<>());
        }
        if (booking.getSeatNumbers() == null) {
            booking.setSeatNumbers(new ArrayList<>());
        }
    }

    private void applyVerificationDetails(BookingModel booking) {
        if (booking.getVerificationCode() == null || booking.getVerificationCode().isBlank()) {
            booking.setVerificationCode("BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        booking.setQrPayload(String.join("|",
                "SMART_CAMPUS_BOOKING",
                "bookingId=" + safeQrValue(booking.getId()),
                "code=" + safeQrValue(booking.getVerificationCode()),
                "resource=" + safeQrValue(booking.getResourceName()),
                "student=" + safeQrValue(booking.getRequesterEmail()),
                "date=" + safeQrValue(booking.getDate()),
                "time=" + safeQrValue(booking.getStartTime()) + "-" + safeQrValue(booking.getEndTime()),
                "seats=" + safeQrValue(booking.getSeatNumbers() == null ? "" : String.join(",", booking.getSeatNumbers()))
        ));
    }

    private String safeQrValue(String value) {
        return value == null ? "" : value.replace("|", "/");
    }

    private void validateBooking(BookingModel booking, String currentBookingId) {
        if (booking.getResourceId() == null || booking.getResourceId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource is required");
        }
        if (booking.getDate() == null || booking.getDate().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking date is required");
        }
        if (booking.getStartTime() == null || booking.getEndTime() == null
                || booking.getStartTime().isBlank() || booking.getEndTime().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time range is required");
        }
        try {
            LocalDate bookingDate = LocalDate.parse(booking.getDate());
            LocalTime startTime = LocalTime.parse(booking.getStartTime());
            LocalTime endTime = LocalTime.parse(booking.getEndTime());
            if (!startTime.isBefore(endTime)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
            }
            if (!LocalDateTime.of(bookingDate, startTime).isAfter(LocalDateTime.now())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This time slot has already started");
            }
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date or time");
        }
        if (booking.getPurpose() == null || booking.getPurpose().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Purpose is required");
        }
        if (booking.getSeatIds() != null && booking.getSeatIds().size() > 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A student can book a maximum of 4 seats per time slot");
        }
        if (booking.getSeatIds() != null && booking.getSeatIds().isEmpty() && booking.getExpectedAttendees() != null
                && booking.getExpectedAttendees() > 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A student can book a maximum of 4 attendees per time slot");
        }
    }

    private void ensureNoConflict(BookingModel candidate, String currentBookingId) {
        ensureRequesterHasNoOverlap(candidate, currentBookingId);

        List<BookingModel> sameDayBookings = bookingRepository.findByResourceIdAndDate(candidate.getResourceId(), candidate.getDate());
        LocalTime candidateStart = LocalTime.parse(candidate.getStartTime());
        LocalTime candidateEnd = LocalTime.parse(candidate.getEndTime());

        boolean hasSeatSelection = candidate.getSeatIds() != null && !candidate.getSeatIds().isEmpty();
        for (BookingModel existing : sameDayBookings) {
            if (currentBookingId != null && currentBookingId.equals(existing.getId())) {
                continue;
            }
            if (!CONFLICT_STATUSES.contains(existing.getStatus())) {
                continue;
            }
            LocalTime existingStart = LocalTime.parse(existing.getStartTime());
            LocalTime existingEnd = LocalTime.parse(existing.getEndTime());
            boolean overlaps = candidateStart.isBefore(existingEnd) && candidateEnd.isAfter(existingStart);
            if (!overlaps) {
                continue;
            }

            if (!hasSeatSelection || existing.getSeatIds() == null || existing.getSeatIds().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "This resource already has an overlapping booking");
            }

            boolean seatConflict = candidate.getSeatIds().stream().anyMatch(existing.getSeatIds()::contains);
            if (seatConflict) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "One or more selected seats are already booked for this time");
            }
        }
    }

    private void ensureRequesterHasNoOverlap(BookingModel candidate, String currentBookingId) {
        if (candidate.getRequesterId() == null) {
            return;
        }

        LocalTime candidateStart = LocalTime.parse(candidate.getStartTime());
        LocalTime candidateEnd = LocalTime.parse(candidate.getEndTime());
        for (BookingModel existing : bookingRepository.findByRequesterId(candidate.getRequesterId())) {
            if (currentBookingId != null && currentBookingId.equals(existing.getId())) {
                continue;
            }
            if (!candidate.getDate().equals(existing.getDate()) || !CONFLICT_STATUSES.contains(existing.getStatus())) {
                continue;
            }
            LocalTime existingStart = LocalTime.parse(existing.getStartTime());
            LocalTime existingEnd = LocalTime.parse(existing.getEndTime());
            boolean overlaps = candidateStart.isBefore(existingEnd) && candidateEnd.isAfter(existingStart);
            if (overlaps) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a booking request during this time");
            }
        }
    }

    private BookingModel getBooking(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Could not find booking with id " + id));
    }

    private BookingModel attachReviewSummary(BookingModel booking) {
        reviewRepository.findByBookingId(booking.getId()).ifPresentOrElse(review -> {
            booking.setReviewed(true);
            booking.setReviewId(review.getId());
            booking.setReviewRating(review.getRating());
            booking.setReviewComment(review.getComment());
        }, () -> booking.setReviewed(false));
        return booking;
    }

    private UserModel currentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserModel user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        return user;
    }

    private UserModel requireAdmin(Authentication authentication) {
        UserModel user = currentUser(authentication);
        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        return user;
    }

    private void requireOwnerOrAdmin(UserModel user, BookingModel booking) {
        if (!"ADMIN".equals(user.getRole()) && !user.getId().equals(booking.getRequesterId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot update this booking");
        }
    }

    private void enforceCancellationPolicy(UserModel user, BookingModel booking) {
        if ("ADMIN".equals(user.getRole())) {
            return;
        }
        try {
            LocalDateTime bookingStart = LocalDateTime.of(
                    LocalDate.parse(booking.getDate()),
                    LocalTime.parse(booking.getStartTime())
            );
            if (LocalDateTime.now().plusHours(STUDENT_CANCELLATION_MIN_HOURS).isAfter(bookingStart)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cancellation must be done at least 3 hours before the booking start time"
                );
            }
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid booking date or time for cancellation");
        }
    }
}
