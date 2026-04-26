package backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "resources")
public class ResourceModel {

    @Id
    private String id;

    private String name;
    private String type;
    private String location;
    private Integer capacity;
    private String status;
    private String description;
    private List<String> amenities = new ArrayList<>();
    private List<AvailabilityWindow> availabilityWindows = new ArrayList<>();
    private List<String> images = new ArrayList<>();
    private SeatingLayout seatingLayout;
    private Map<String, Object> equipmentSpecs;
    private Double rating;
    private Integer reviews;

    public void applyDefaults() {
        if (status == null || status.isBlank()) {
            status = "ACTIVE";
        }
        if (amenities == null) {
            amenities = new ArrayList<>();
        }
        if (availabilityWindows == null) {
            availabilityWindows = new ArrayList<>();
        }
        if (images == null) {
            images = new ArrayList<>();
        }
        if (rating == null) {
            rating = 0.0;
        }
        if (reviews == null) {
            reviews = 0;
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getAmenities() { return amenities; }
    public void setAmenities(List<String> amenities) { this.amenities = amenities; }

    public List<AvailabilityWindow> getAvailabilityWindows() { return availabilityWindows; }
    public void setAvailabilityWindows(List<AvailabilityWindow> availabilityWindows) { this.availabilityWindows = availabilityWindows; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public SeatingLayout getSeatingLayout() { return seatingLayout; }
    public void setSeatingLayout(SeatingLayout seatingLayout) { this.seatingLayout = seatingLayout; }

    public Map<String, Object> getEquipmentSpecs() { return equipmentSpecs; }
    public void setEquipmentSpecs(Map<String, Object> equipmentSpecs) { this.equipmentSpecs = equipmentSpecs; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Integer getReviews() { return reviews; }
    public void setReviews(Integer reviews) { this.reviews = reviews; }

    public static class AvailabilityWindow {
        private Integer dayOfWeek;
        private String date;
        private String startDate;
        private String endDate;
        private String startTime;
        private String endTime;

        public Integer getDayOfWeek() { return dayOfWeek; }
        public void setDayOfWeek(Integer dayOfWeek) { this.dayOfWeek = dayOfWeek; }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }

        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }

        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }

        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
    }

    public static class SeatingLayout {
        private Integer rows;
        private Integer cols;
        private List<Seat> seats = new ArrayList<>();

        public Integer getRows() { return rows; }
        public void setRows(Integer rows) { this.rows = rows; }

        public Integer getCols() { return cols; }
        public void setCols(Integer cols) { this.cols = cols; }

        public List<Seat> getSeats() { return seats; }
        public void setSeats(List<Seat> seats) { this.seats = seats; }
    }

    public static class Seat {
        private String id;
        private String number;
        private String type;
        private String status;
        private Boolean hasPower;
        private Boolean hasUsb;
        private Boolean accessible;
        private Integer x;
        private Integer y;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getNumber() { return number; }
        public void setNumber(String number) { this.number = number; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public Boolean getHasPower() { return hasPower; }
        public void setHasPower(Boolean hasPower) { this.hasPower = hasPower; }

        public Boolean getHasUsb() { return hasUsb; }
        public void setHasUsb(Boolean hasUsb) { this.hasUsb = hasUsb; }

        public Boolean getAccessible() { return accessible; }
        public void setAccessible(Boolean accessible) { this.accessible = accessible; }

        public Boolean getIsAccessible() { return accessible; }
        public void setIsAccessible(Boolean accessible) { this.accessible = accessible; }

        public Integer getX() { return x; }
        public void setX(Integer x) { this.x = x; }

        public Integer getY() { return y; }
        public void setY(Integer y) { this.y = y; }
    }
}
