package backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import backend.repository.TicketRepository;
import backend.dto.CreateTicketRequest;
import backend.exception.TicketBadRequestException;
import backend.exception.TicketForbiddenException;
import backend.model.TicketAttachmentModel;
import backend.model.TicketModel;
import backend.model.TicketStatus;
import backend.model.UserModel;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/tickets")
public class TicketController {
    private final TicketRepository ticketRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public TicketController(
            TicketRepository ticketRepository
    ) {
        this.ticketRepository = ticketRepository;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public TicketModel createTicket(
        @AuthenticationPrincipal UserModel currentUser,
        @RequestPart("ticket") CreateTicketRequest request,
        @RequestPart(value = "images", required = false) List<MultipartFile> images 
    ) {
        if(currentUser == null) {
            throw new TicketForbiddenException("Authentication required");
        }

        if (request.getLocation() == null || request.getLocation().isBlank()
                || request.getDescription() == null || request.getDescription().isBlank()
                || request.getCategory() == null
                || request.getPriority() == null
                || request.getPreferredContact() == null || request.getPreferredContact().isBlank()) {
            throw new TicketBadRequestException("All required ticket fields must be provided");
        }

        if (images != null && images.size() > 3) {
            throw new TicketBadRequestException("Maximum 3 image attachments are allowed");
        }

        TicketModel ticket = new TicketModel();
        ticket.setCreatedBy(currentUser);
        ticket.setResourceName(request.getResourceName());
        ticket.setLocation(request.getLocation());
        ticket.setCategory(request.getCategory());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(request.getPriority());
        ticket.setPreferredContact(request.getPreferredContact());
        ticket.setStatus(TicketStatus.OPEN);

        if (images != null) {
            for (MultipartFile file : images) {
                if (file.isEmpty()) {
                    continue;
                }

                String contentType = file.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    throw new TicketBadRequestException("Only image files are allowed");
                }

                String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                Path uploadPath = Paths.get(uploadDir, "tickets");
                Path filePath = uploadPath.resolve(fileName);

                try {
                    Files.createDirectories(uploadPath);
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                } catch (IOException e) {
                    throw new TicketBadRequestException("Failed to save image: " + file.getOriginalFilename());
                }

                TicketAttachmentModel attachment = new TicketAttachmentModel();
                attachment.setOriginalFileName(file.getOriginalFilename());
                attachment.setStoredFileName(fileName);
                attachment.setFileUrl("/uploads/tickets/" + fileName);

                ticket.addAttachment(attachment);
            }
        }

        return ticketRepository.save(ticket);
    }
}
