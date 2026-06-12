import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {

    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Task Manager",
            link: "https://taskmanagerlink.com",
        },
    });

    const emailText = mailGenerator.generatePlaintext(
        options.mailgencontent
    );

    const emailHtml = mailGenerator.generate(
        options.mailgencontent
    );

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS,
        },
    });

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailText,
        html: emailHtml,
    };

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error(
            "Email service failed silently. Please try again."
        );

        console.error("Error:", error);
    }
};

const emailVerificationContent = (
    username,
    verificationUrl
) => {
    return {
        body: {
            name: username,

            intro:
                "Welcome to Base Camp! We're very excited to have you onboard.",

            action: {
                instructions:
                    "To verify your email please click here:",

                button: {
                    color: "#22BC66",

                    text: "Confirm your account",

                    link: verificationUrl,
                },
            },

            outro:
                "Need help? Reply to this email and we'll help you.",
        },
    };
};

const forgotPasswordBaseCampContent = (
    username,
    passwordResetUrl
) => {
    return {
        body: {
            name: username,

            intro:
                "You requested a password reset.",

            action: {
                instructions:
                    "Click below to reset your password:",

                button: {
                    color: "#CD0F0F",

                    text: "Reset my password",

                    link: passwordResetUrl,
                },
            },

            outro:
                "If you didn't request this, please ignore this email.",
        },
    };
};

export {
    sendEmail,
    emailVerificationContent,
    forgotPasswordBaseCampContent,
};