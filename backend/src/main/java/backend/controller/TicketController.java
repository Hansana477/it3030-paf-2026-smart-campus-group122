package backend.controller;

import backend.dto.AddCommentRequest;
import backend.dto.AssignTicketRequest;
import backend.dto.CreateTicketRequest;
import backend.dto.ReopenTicketRequest;
import backend.dto.UpdateCommentRequest;
import backend.dto.UpdateTicketStatusRequest;
import backend.model.TicketModel;
import backend.model.UserModel;
import backend.service.TicketService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
@RequestMapping("/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public TicketModel createTicket(
            @RequestParam("resourceId") String resourceId,
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam("priority") String priority,
            @RequestParam(value = "preferredContactName", required = false) String preferredContactName,
            @RequestParam(value = "preferredContactEmail", required = false) String preferredContactEmail,
            @RequestParam(value = "preferredContactPhone", required = false) String preferredContactPhone,
            @RequestParam(value = "images", required = false) MultipartFile[] images,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) throws IOException {
        CreateTicketRequest ticketRequest = new CreateTicketRequest();
        ticketRequest.setResourceId(resourceId);
        ticketRequest.setCategory(category);
        ticketRequest.setDescription(description);
        ticketRequest.setPriority(priority);
        ticketRequest.setPreferredContactName(preferredContactName);
        ticketRequest.setPreferredContactEmail(preferredContactEmail);
        ticketRequest.setPreferredContactPhone(preferredContactPhone);

        return ticketService.createTicket(
                ticketRequest,
                images == null ? List.of() : List.of(images),
                getAuthenticatedUser(authentication),
                httpRequest
        );
    }

    @GetMapping
    public List<TicketModel> getTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String assignedTo,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String search,
            Authentication authentication
    ) {
        return ticketService.getVisibleTickets(
                getAuthenticatedUser(authentication),
                status,
                priority,
                category,
                assignedTo,
                createdBy,
                search
        );
    }

    @GetMapping("/{ticketId}")
    public TicketModel getTicketById(@PathVariable String ticketId, Authentication authentication) {
        return ticketService.getTicketById(ticketId, getAuthenticatedUser(authentication));
    }

    @PatchMapping("/{ticketId}/assign")
    public TicketModel assignTicket(
            @PathVariable String ticketId,
            @RequestBody AssignTicketRequest request,
            Authentication authentication
    ) {
        return ticketService.assignTicket(ticketId, request, getAuthenticatedUser(authentication));
    }

    @PatchMapping("/{ticketId}/status")
    public TicketModel updateTicketStatus(
            @PathVariable String ticketId,
            @RequestBody UpdateTicketStatusRequest request,
            Authentication authentication
    ) {
        return ticketService.updateStatus(ticketId, request, getAuthenticatedUser(authentication));
    }

    @PatchMapping("/{ticketId}/confirm-resolution")
    public TicketModel confirmResolution(
            @PathVariable String ticketId,
            Authentication authentication
    ) {
        return ticketService.confirmResolution(ticketId, getAuthenticatedUser(authentication));
    }

    @PatchMapping("/{ticketId}/reopen")
    public TicketModel reopenTicket(
            @PathVariable String ticketId,
            @RequestBody ReopenTicketRequest request,
            Authentication authentication
    ) {
        return ticketService.reopenTicket(ticketId, request, getAuthenticatedUser(authentication));
    }

    @PostMapping("/{ticketId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public TicketModel addComment(
            @PathVariable String ticketId,
            @RequestBody AddCommentRequest request,
            Authentication authentication
    ) {
        return ticketService.addComment(ticketId, request, getAuthenticatedUser(authentication));
    }

    @PutMapping("/{ticketId}/comments/{commentId}")
    public TicketModel updateComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @RequestBody UpdateCommentRequest request,
            Authentication authentication
    ) {
        return ticketService.updateComment(ticketId, commentId, request, getAuthenticatedUser(authentication));
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public Map<String, String> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            Authentication authentication
    ) {
        ticketService.deleteComment(ticketId, commentId, getAuthenticatedUser(authentication));
        return Map.of("message", "Comment deleted successfully");
    }

    private UserModel getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserModel authenticatedUser)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return authenticatedUser;
    }
}
