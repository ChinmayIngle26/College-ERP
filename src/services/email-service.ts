
'use server';

import nodemailer from 'nodemailer';

// Define the interface for mail options for better type-checking
interface MailOptions {
  to: string | string[]; // Recipient(s)
  subject: string;       // Subject line
  text?: string;         // Plain text body
  html: string;          // HTML body
}

/**
 * Sends an email using Nodemailer.
 * This is a server-side function and requires SMTP environment variables to be set.
 * 
 * Required .env.local variables:
 * SMTP_HOST="your_smtp_host"
 * SMTP_PORT=your_smtp_port (e.g., 587 or 465)
 * SMTP_USER="your_smtp_username"
 * SMTP_PASS="your_smtp_password_or_app_key"
 * SMTP_FROM_ADDRESS="Your Name <no-reply@yourdomain.com>"
 */
export async function sendEmail(mailOptions: MailOptions): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_ADDRESS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM_ADDRESS) {
    const errorMessage = "SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM_ADDRESS in your environment variables.";
    console.error(`[EmailService] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  // Create a transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const finalMailOptions = {
    ...mailOptions,
    from: SMTP_FROM_ADDRESS, // Use the configured "from" address
  };

  try {
    console.log(`[EmailService] Attempting to send email to: ${Array.isArray(mailOptions.to) ? mailOptions.to.join(', ') : mailOptions.to}`);
    const info = await transporter.sendMail(finalMailOptions);
    console.log(`[EmailService] Message sent: ${info.messageId}`);
    console.log(`[EmailService] Preview URL: ${nodemailer.getTestMessageUrl(info)}`); // Useful for development with ethereal.email
  } catch (error) {
    console.error("[EmailService] Error sending email:", error);
    // Throw a more user-friendly error to be caught by the calling flow
    throw new Error('Failed to send the email. Please check server logs for details.');
  }
}
