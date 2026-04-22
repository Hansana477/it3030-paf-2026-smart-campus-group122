package backend.controller;

import backend.exception.UserNotFoundException;
import backend.model.ResourceModel;
import backend.repository.ResourceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
@RequestMapping("/resources")
public class ResourceController {

    private final ResourceRepository resourceRepository;

    public ResourceController(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @GetMapping
    public List<ResourceModel> getResources(@RequestParam(required = false) String status) {
        if (status == null || status.isBlank()) {
            return resourceRepository.findAll();
        }

        return resourceRepository.findByStatus(status.trim().toUpperCase());
    }

    @GetMapping("/{id}")
    public ResourceModel getResource(@PathVariable String id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Could not find resource with id " + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceModel createResource(@RequestBody ResourceModel resource) {
        normalizeResource(resource);
        validateResource(resource);
        resource.setId(null);
        resource.applyDefaults();
        return resourceRepository.save(resource);
    }

    @PutMapping("/{id}")
    public ResourceModel updateResource(@PathVariable String id, @RequestBody ResourceModel updatedResource) {
        if (!resourceRepository.existsById(id)) {
            throw new UserNotFoundException("Could not find resource with id " + id);
        }

        normalizeResource(updatedResource);
        validateResource(updatedResource);
        updatedResource.setId(id);
        updatedResource.applyDefaults();
        return resourceRepository.save(updatedResource);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteResource(@PathVariable String id) {
        ResourceModel resource = resourceRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Could not find resource with id " + id));

        resourceRepository.delete(resource);
        return Map.of("message", "Resource deleted successfully");
    }

    private void normalizeResource(ResourceModel resource) {
        if (resource.getType() != null && "EQUIPMENT".equalsIgnoreCase(resource.getType())) {
            resource.setCapacity(1);
            resource.setSeatingLayout(null);
        }
    }

    private void validateResource(ResourceModel resource) {
        if (resource.getName() == null || resource.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource name is required");
        }
        if (resource.getType() == null || resource.getType().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource type is required");
        }
        if (resource.getLocation() == null || resource.getLocation().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location is required");
        }
        if (resource.getCapacity() == null || resource.getCapacity() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Capacity must be at least 1");
        }
        if (resource.getDescription() == null || resource.getDescription().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is required");
        }
    }
}
