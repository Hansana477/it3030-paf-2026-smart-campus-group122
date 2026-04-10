# PAF Project

PAF Project is a **Smart Campus Operations Hub** developed for the **IT3030 – Programming Applications and Frameworks** assignment.  
The system is designed to support university day-to-day operations by managing **facility and asset bookings**, **maintenance and incident tickets**, **notifications**, and **role-based access control** through a modern web application.

---

## Module Information

- **Module:** IT3030 – Programming Applications and Frameworks
- **Project Type:** Group Coursework
- **Backend:** Spring Boot REST API
- **Frontend:** React Web Application

---

## Project Description

This project provides a centralized platform for managing university resources such as lecture halls, labs, meeting rooms, and equipment.  
Users can request bookings, report incidents, receive notifications, and track updates through a user-friendly web interface.  
Admins and staff can manage approvals, ticket workflows, technician assignments, and system operations securely.

---

## Main Features

### Facilities & Assets Catalogue
- View and manage bookable resources
- Store resource details such as type, capacity, location, availability, and status
- Search and filter resources

### Booking Management
- Request bookings for resources
- Approve, reject, or cancel bookings
- Prevent overlapping booking conflicts
- View booking history and status

### Maintenance & Incident Ticketing
- Create incident reports for resources or locations
- Attach evidence images
- Track ticket progress through multiple statuses
- Assign technicians and add resolution notes
- Add and manage comments

### Notifications
- Receive updates for booking approvals/rejections
- Get notified about ticket status changes
- Receive alerts for new comments and updates

### Authentication & Authorization
- Secure login using OAuth 2.0
- Role-based access control for different users
- Protected backend endpoints and frontend routes

---

## Technology Stack

### Frontend
- React
- Axios
- React Router
- CSS / Bootstrap / Tailwind (update based on your project)

### Backend
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- OAuth 2.0
- Maven

### Database
- MySQL / MongoDB / PostgreSQL (update with your actual database)

### Tools
- Git & GitHub
- GitHub Actions
- Postman
- VS Code / IntelliJ IDEA

---

## Project Structure

```text
PAF-Project/
├── backend/        # Spring Boot REST API
├── frontend/       # React client application
├── docs/           # Diagrams, screenshots, report assets
├── .github/
│   └── workflows/  # GitHub Actions workflows
├── README.md
└── .gitignore


check ci