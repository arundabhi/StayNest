
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  secure:false
});

export default transporter

export const sendEmail = async ({ to, subject, body }) => {
  try {
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to,
      subject,
      html:body,
      text: body.replace(/<[^>]+>/g, ""),

    });
    console.log('✅ Email sent to:', to);
  } catch (error) {
    console.error('❌ Email error:', error);
    throw error;
  }
};


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