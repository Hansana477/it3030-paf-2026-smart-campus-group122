package backend.service;

import backend.model.BookingModel;
import backend.model.UserModel;
import jakarta.mail.internet.InternetAddress;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class EmailNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailNotificationService.class);

    private final JavaMailSender mailSender;
    private final String mailFrom;
    private final String mailFromName;
    private final String mailHost;

    public EmailNotificationService(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String mailFrom,
            @Value("${app.mail.from-name:UniNex Team}") String mailFromName,
            @Value("${spring.mail.host:}") String mailHost
    ) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.mailFromName = mailFromName;
        this.mailHost = mailHost;
    }

    public void sendRegistrationEmail(UserModel user) {
        if (user == null || !StringUtils.hasText(user.getEmail())) {
            return;
        }

        String subject = "UniNex registration successful";
        String approvalLine = user.isApproved()
                ? "Your account is active and ready to use."
                : "Your account is waiting for admin approval before full access is granted.";

        String body = String.format(
                "Hello %s,%n%n"
                        + "Your UniNex account has been created successfully.%n"
                        + "Role: %s%n"
                        + "%s%n%n"
                        + "You can now sign in using your registered email address.%n%n"
                        + "UniNex Team",
                safeName(user),
                user.getRole(),
                approvalLine
        );

        sendEmail(user.getEmail(), subject, body);
    }

    public void sendTechnicianApprovedEmail(UserModel user) {
        if (user == null || !StringUtils.hasText(user.getEmail())) {
            return;
        }

        String body = String.format(
                "Hello %s,%n%n"
                        + "Your technician account has been approved by the admin.%n"
                        + "You can now sign in and access the technician dashboard.%n%n"
                        + "UniNex Team",
                safeName(user)
        );

        sendEmail(user.getEmail(), "UniNex technician approval", body);
    }

    public void sendPasswordResetEmail(UserModel user, String resetCode) {
        if (user == null || !StringUtils.hasText(user.getEmail()) || !StringUtils.hasText(resetCode)) {
            return;
        }

        String body = String.format(
                "Hello %s,%n%n"
                        + "We received a password reset request for your UniNex account.%n"
                        + "Your reset code is: %s%n"
                        + "This code will expire in 15 minutes.%n%n"
                        + "If you did not request this, you can ignore this email.%n%n"
                        + "UniNex Team",
                safeName(user),
                resetCode
        );

        sendEmail(user.getEmail(), "UniNex password reset code", body);
    }

    public void sendNotificationEmail(UserModel user, String title, String message, String type) {
        if (user == null || !StringUtils.hasText(user.getEmail()) || !StringUtils.hasText(title) || !StringUtils.hasText(message)) {
            return;
        }

        String typeLabel = formatNotificationType(type);
        String body = String.format(
                "Hello %s,%n%n"
                        + "You have a new UniNex notification.%n%n"
                        + "Type: %s%n"
                        + "Title: %s%n"
                        + "Details: %s%n%n"
                        + "Please sign in to UniNex to view the latest updates.%n%n"
                        + "UniNex Team",
                safeName(user),
                typeLabel,
                title,
                message
        );

        sendEmail(user.getEmail(), "UniNex notification: " + title, body);
    }

    public boolean sendLoginOtpEmail(UserModel user, String otpCode) {
        if (user == null || !StringUtils.hasText(user.getEmail()) || !StringUtils.hasText(otpCode)) {
            return false;
        }

        String body = String.format(
                "Hello %s,%n%n"
                        + "We received a login request for your UniNex account.%n"
                        + "Your login verification code is: %s%n"
                        + "This code will expire in 10 minutes.%n%n"
                        + "UniNex Team",
                safeName(user),
                otpCode
        );

        return sendEmail(user.getEmail(), "UniNex login verification code", body);
    }

    public boolean sendBookingApprovedEmail(BookingModel booking) {
        if (booking == null || !StringUtils.hasText(booking.getRequesterEmail())) {
            return false;
        }

        String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data="
                + urlEncode(booking.getQrPayload());

        String studentName = escapeHtml(booking.getRequesterName());
        String resourceName = escapeHtml(booking.getResourceName());
        String bookingDate = escapeHtml(booking.getDate());
        String bookingTime = escapeHtml(booking.getStartTime()) + " - " + escapeHtml(booking.getEndTime());
        String seats = escapeHtml(booking.getSeatNumbers() == null || booking.getSeatNumbers().isEmpty()
                ? "Resource booking"
                : String.join(", ", booking.getSeatNumbers()));
        String verificationCode = escapeHtml(booking.getVerificationCode());

        String body = String.format(
                "<!doctype html>"
                        + "<html><body style=\"margin:0;padding:0;background:#eaf1f8;font-family:Arial,Helvetica,sans-serif;color:#0f172a;\">"
                        + "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;\">Your UniNex booking is approved. Use the QR or verification code at check-in.</div>"
                        + "<table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#eaf1f8;padding:38px 12px;\">"
                        + "<tr><td align=\"center\">"
                        + "<table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:680px;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #dbe7f3;box-shadow:0 26px 70px rgba(15,23,42,0.18);\">"
                        + "<tr><td style=\"background:#041526;padding:0;color:#ffffff;\">"
                        + "<table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\">"
                        + "<tr><td style=\"padding:28px 32px 20px;\">"
                        + "<table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\">"
                        + "<tr>"
                        + "<td style=\"font-size:12px;font-weight:800;letter-spacing:3.5px;text-transform:uppercase;color:#5eead4;\">UniNex</td>"
                        + "<td align=\"right\"><span style=\"display:inline-block;background:#dcfce7;color:#047857;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:800;letter-spacing:.6px;\">APPROVED</span></td>"
                        + "</tr></table>"
                        + "<table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin-top:26px;\">"
                        + "<tr>"
                        + "<td style=\"width:70px;vertical-align:top;\">"
                        + "<div style=\"width:58px;height:58px;border-radius:20px;background:#10b981;color:#ffffff;text-align:center;line-height:58px;font-size:32px;font-weight:900;box-shadow:0 12px 28px rgba(16,185,129,.35);\">&#10003;</div>"
                        + "</td>"
                        + "<td style=\"vertical-align:top;\">"
                        + "<h1 style=\"margin:0;font-size:34px;line-height:1.1;color:#ffffff;\">Booking Confirmed</h1>"
                        + "<p style=\"margin:10px 0 0;color:#bdd3e8;font-size:15px;line-height:1.7;\">Your seat is ready. Keep this ticket for campus check-in.</p>"
                        + "</td></tr></table>"
                        + "</td></tr>"
                        + "<tr><td style=\"height:12px;background:#10b981;\"></td></tr>"
                        + "</table>"
                        + "</td></tr>"
                        + "<tr><td style=\"padding:30px 34px 12px;\">"
                        + "<p style=\"margin:0 0 22px;font-size:16px;line-height:1.75;color:#334155;\">Hi <strong style=\"color:#0f172a;\">%s</strong>, your booking request has been approved by the campus admin. Here is your digital access ticket.</p>"
                        + "<table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#ffffff;border:1px solid #dbeafe;border-radius:22px;box-shadow:0 12px 30px rgba(14,165,233,0.10);overflow:hidden;\">"
                        + "<tr><td style=\"padding:18px 20px;background:#f0fdfa;border-bottom:1px solid #ccfbf1;\">"
                        + "<div style=\"font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#0f766e;\">Booking Ticket</div>"
                        + "<div style=\"margin-top:6px;font-size:22px;font-weight:900;color:#0f172a;\">%s</div>"
                        + "</td></tr>"
                        + "<tr><td style=\"padding:12px 14px 16px;\">"
                        + "<table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:separate;border-spacing:0 10px;\">"
                        + "%s%s%s%s"
                        + "</table>"
                        + "</td></tr></table>"
                        + "</td></tr>"
                        + "<tr><td style=\"padding:14px 34px 32px;\">"
                        + "<table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#052e2b;border-radius:24px;overflow:hidden;\">"
                        + "<tr><td style=\"padding:24px;vertical-align:top;color:#ffffff;\">"
                        + "<div style=\"font-size:12px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#67e8f9;\">Check-in Pass</div>"
                        + "<div style=\"margin-top:10px;display:inline-block;background:#ffffff;color:#052e2b;border-radius:16px;padding:12px 16px;font-size:28px;font-weight:900;letter-spacing:2.5px;\">%s</div>"
                        + "<p style=\"margin:14px 0 0;color:#ccfbf1;font-size:14px;line-height:1.7;\">Scan the QR code or show this verification code when you arrive.</p>"
                        + "</td><td align=\"center\" style=\"padding:24px;width:190px;\">"
                        + "<div style=\"background:#ffffff;border-radius:22px;padding:12px;border:1px solid #99f6e4;display:inline-block;box-shadow:0 12px 25px rgba(0,0,0,.20);\">"
                        + "<img src=\"%s\" alt=\"Booking verification QR\" width=\"152\" height=\"152\" style=\"display:block;border:0;\" />"
                        + "</div>"
                        + "</td></tr></table>"
                        + "</td></tr>"
                        + "<tr><td style=\"padding:0 34px 32px;\">"
                        + "<table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;\">"
                        + "<tr><td style=\"padding:16px 18px;color:#475569;font-size:14px;line-height:1.65;\">"
                        + "<strong style=\"color:#0f172a;\">Quick note:</strong> Please arrive on time. If your plan changes, cancel or reschedule from <strong>My Booking</strong> so another student can use the seat."
                        + "</td></tr></table>"
                        + "</td></tr>"
                        + "<tr><td style=\"background:#f8fafc;padding:24px 34px;color:#64748b;font-size:13px;line-height:1.7;border-top:1px solid #e2e8f0;\">"
                        + "<span style=\"font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;\">Thank you</span><br/>"
                        + "<strong style=\"color:#0f172a;font-size:15px;\">UniNex Team</strong>"
                        + "</td></tr>"
                        + "</table>"
                        + "</td></tr></table>"
                        + "</body></html>",
                studentName,
                resourceName,
                detailRow("Resource", resourceName),
                detailRow("Date", bookingDate),
                detailRow("Time", bookingTime),
                detailRow("Seats", seats),
                verificationCode,
                qrUrl
        );

        return sendEmail(booking.getRequesterEmail(), "Your UniNex booking ticket is ready", body, true);
    }

    private boolean sendEmail(String to, String subject, String body) {
        return sendEmail(to, subject, body, false);
    }

    private boolean sendEmail(String to, String subject, String body, boolean html) {
        if (!StringUtils.hasText(mailHost)) {
            logger.info("Skipping email to {} because SMTP host is not configured.", to);
            return false;
        }

        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, html, "UTF-8");
            helper.setFrom(new InternetAddress(mailFrom, mailFromName));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, html);
            mailSender.send(message);
            logger.info("Sent email to {} with subject '{}'.", to, subject);
            return true;
        } catch (Exception ex) {
            logger.warn("Failed to send email to {}: {}", to, ex.getMessage());
            return false;
        }
    }

    private String safeName(UserModel user) {
        return StringUtils.hasText(user.getFullName()) ? user.getFullName() : "User";
    }

    private String formatNotificationType(String type) {
        if (!StringUtils.hasText(type)) {
            return "General update";
        }

        return switch (type) {
            case "PASSWORD_CHANGED" -> "Password change";
            case "ACCOUNT_DETAILS_UPDATED" -> "Account details update";
            case "TECHNICIAN_APPROVED" -> "Technician approval";
            case "TECHNICIAN_PENDING" -> "Pending technician approval";
            default -> "General update";
        };
    }

    private String urlEncode(String value) {
        return java.net.URLEncoder.encode(value == null ? "" : value, java.nio.charset.StandardCharsets.UTF_8);
    }

    private String detailRow(String label, String value) {
        return "<tr>"
                + "<td style=\"width:120px;padding:14px 16px;background:#f8fafc;border-radius:14px 0 0 14px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;\">"
                + label
                + "</td>"
                + "<td style=\"padding:14px 16px;background:#f8fafc;border-radius:0 14px 14px 0;color:#0f172a;font-size:15px;font-weight:700;\">"
                + value
                + "</td>"
                + "</tr>";
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}

