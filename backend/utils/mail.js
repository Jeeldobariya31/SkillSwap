/**
 * Email Utility using Nodemailer
 * --------------------------------------------------------------------
 * Handles sending HTML emails for all backend flows:
 *  - User registration
 *  - OTP verification
 *  - Password change notifications
 *  - Email change confirmation
 * --------------------------------------------------------------------
 * Expects environment variables:
 *  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */

import nodemailer from "nodemailer";


/**
 * Send an email using Nodemailer.
 *
 * @param {Object} options - email parameters
 * @param {string} options.to - recipient email address
 * @param {string} options.subject - subject line
 * @param {string} options.html - email HTML body
 * @throws {ApiError} 500 - if email fails to send
 */
const sendEmail = async (options) => {
  // 1️⃣ Create a reusable SMTP transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false otherwise
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      // Do not fail on invalid certs (for some dev/test servers)
      rejectUnauthorized: false,
    },
  });

  // 2️⃣ Prepare email content
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || "Our Platform"}" <${
      process.env.SMTP_USER
    }>`, 
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  // 3️⃣ Send email and handle potential errors gracefully
  try {
    const info = await transporter.sendMail(mailOptions);

   

    // Return info if needed by caller (optional)
    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export { sendEmail };
