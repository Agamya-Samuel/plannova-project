import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter object using the default SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST!,
    port: parseInt(process.env.EMAIL_PORT!),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL!}/auth/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"Plannova Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - Plannova',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ec4899;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your Plannova account. If you didn't make this request, you can safely ignore this email.</p>
        <p>To reset your password, click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>Thank you,<br>The Plannova Team</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          If you're having trouble clicking the button, copy and paste the URL into your web browser.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
};