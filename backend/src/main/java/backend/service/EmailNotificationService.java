package backend.service;

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
            @Value("${app.mail.from-name:Smart Campus Team}") String mailFromName,
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

        String subject = "Smart Campus registration successful";
        String approvalLine = user.isApproved()
                ? "Your account is active and ready to use."
                : "Your account is waiting for admin approval before full access is granted.";

        String body = String.format(
                "Hello %s,%n%n"
                        + "Your Smart Campus account has been created successfully.%n"
                        + "Role: %s%n"
                        + "%s%n%n"
                        + "You can now sign in using your registered email address.%n%n"
                        + "Smart Campus Team",
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
                        + "Smart Campus Team",
                safeName(user)
        );

        sendEmail(user.getEmail(), "Smart Campus technician approval", body);
    }

    public void sendPasswordResetEmail(UserModel user, String resetCode) {
        if (user == null || !StringUtils.hasText(user.getEmail()) || !StringUtils.hasText(resetCode)) {
            return;
        }

        String body = String.format(
                "Hello %s,%n%n"
                        + "We received a password reset request for your Smart Campus account.%n"
                        + "Your reset code is: %s%n"
                        + "This code will expire in 15 minutes.%n%n"
                        + "If you did not request this, you can ignore this email.%n%n"
                        + "Smart Campus Team",
                safeName(user),
                resetCode
        );

        sendEmail(user.getEmail(), "Smart Campus password reset code", body);
    }

    private void sendEmail(String to, String subject, String body) {
        if (!StringUtils.hasText(mailHost)) {
            logger.info("Skipping email to {} because SMTP host is not configured.", to);
            return;
        }

        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(new InternetAddress(mailFrom, mailFromName));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (Exception ex) {
            logger.warn("Failed to send email to {}: {}", to, ex.getMessage());
        }
    }

    private String safeName(UserModel user) {
        return StringUtils.hasText(user.getFullName()) ? user.getFullName() : "User";
    }
}
