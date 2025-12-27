// sendEmail.utils.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log('✅ Email sent to:', to);
  } catch (error) {
    console.error('❌ Email error:', error);
    throw error;
  }
};

// Email templates
export const emailTemplates = {
  welcome: (name) => `
    <h1>Welcome ${name}!</h1>
    <p>Thank you for registering with Smart Stay.</p>
  `,
  
  bookingConfirmation: (booking) => `
    <h1>Booking Confirmed!</h1>
    <p>Your booking ID: ${booking._id}</p>
    <p>Check-in: ${booking.checkIn}</p>
    <p>Check-out: ${booking.checkOut}</p>
  `,
  
  resetPassword: (resetUrl) => `
    <h1>Reset Password</h1>
    <p>Click here to reset: <a href="${resetUrl}">Reset Link</a></p>
    <p>Valid for 15 minutes.</p>
  `
};