package backend.controller;

import backend.exception.UserNotFoundException;
import backend.model.BookingModel;
import backend.model.ResourceModel;
import backend.model.ReviewModel;
import backend.model.UserModel;
import backend.repository.BookingRepository;
import backend.repository.ResourceRepository;
import backend.repository.ReviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@RestController
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
})
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    public ReviewController(
            ReviewRepository reviewRepository,
            BookingRepository bookingRepository,
            ResourceRepository resourceRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
    }

    @GetMapping("/resource/{resourceId}")
    public List<ReviewModel> getResourceReviews(@PathVariable String resourceId) {
        return reviewRepository.findByResourceIdOrderByCreatedAtDesc(resourceId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewModel createReview(@RequestBody ReviewModel request, Authentication authentication) {
        UserModel user = currentUser(authentication);

        if (request.getBookingId() == null || request.getBookingId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking is required");
        }
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        }
        if (reviewRepository.existsByBookingId(request.getBookingId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This booking already has a review");
        }

        BookingModel booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new UserNotFoundException("Could not find booking with id " + request.getBookingId()));
        if (!user.getId().equals(booking.getRequesterId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can review only your own booking");
        }
        if (!"APPROVED".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only approved bookings can be reviewed");
        }

        ReviewModel review = new ReviewModel();
        review.setBookingId(booking.getId());
        review.setResourceId(booking.getResourceId());
        review.setResourceName(booking.getResourceName());
        review.setStudentId(user.getId());
        review.setStudentName(user.getFullName());
        review.setStudentEmail(user.getEmail());
        review.setRating(request.getRating());
        review.setComment(request.getComment() == null ? "" : request.getComment().trim());
        review.applyDefaults();

        ReviewModel savedReview = reviewRepository.save(review);
        updateResourceRating(booking.getResourceId());
        return savedReview;
    }

    private void updateResourceRating(String resourceId) {
        ResourceModel resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new UserNotFoundException("Could not find resource with id " + resourceId));
        List<ReviewModel> reviews = reviewRepository.findByResourceId(resourceId);
        double average = reviews.stream()
                .mapToInt(ReviewModel::getRating)
                .average()
                .orElse(0.0);
        double roundedAverage = BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP).doubleValue();
        resource.setRating(roundedAverage);
        resource.setReviews(reviews.size());
        resourceRepository.save(resource);
    }

    private UserModel currentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserModel user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        return user;
    }
}
