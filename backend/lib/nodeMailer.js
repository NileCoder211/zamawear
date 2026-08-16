import nodeMailer from "nodemailer";

const transport = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        // Must be a Gmail App Password (Google Account > Security > App
        // Passwords), not your regular account password — Gmail no
        // longer accepts plain-password SMTP auth.
        pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
    },
    connectionTimeout: 10000, // fail fast instead of hanging the request
});

// Verify the connection once at startup so a bad app password or
// network issue shows up immediately in your logs, not the first time
// a real user tries to sign up and their verification email silently
// fails to send.
transport.verify((error) => {
    if (error) {
        console.error("❌ Email transport verification failed:", error.message);
    } else {
        console.log("✅ Email transport ready");
    }
});

export default transport;