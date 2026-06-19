
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


export const mailOptions = (bookingDoc) => ({
      from: `"Hotel Booking" <${process.env.SENDER_EMAIL}>`,
      to: bookingDoc?.userId?.email,
      subject: "✅ Booking Confirmed | Your Stay Details",
      html: `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6f8; padding:30px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

      <!-- Header -->
      <div style="background:#0d6efd; padding:20px; text-align:center; color:#ffffff;">
        <h1 style="margin:0;">🏨 Booking Confirmed</h1>
        <p style="margin:5px 0 0;">We look forward to hosting you</p>
      </div>

      <!-- Body -->
      <div style="padding:25px; color:#333;">
        <p>Hi <strong>${bookingDoc?.userId.name}</strong>,</p>

        <p>Thank you for your booking! Your reservation has been successfully created. Below are your booking details:</p>

        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse; margin-top:15px;">
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Booking ID</strong></td>
            <td style="border-bottom:1px solid #eee;">${bookingDoc?._id}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Hotel</strong></td>
            <td style="border-bottom:1px solid #eee;">${bookingDoc?.hotelId.name}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Room Type</strong></td>
            <td style="border-bottom:1px solid #eee;">${bookingDoc?.roomId.title}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Location</strong></td>
            <td style="border-bottom:1px solid #eee;">${bookingDoc?.hotelId.city}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Check-in</strong></td>
            <td style="border-bottom:1px solid #eee;">${bookingDoc?.checkIn.toDateString()}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Check-out</strong></td>
            <td style="border-bottom:1px solid #eee;">${bookingDoc?.checkOut.toDateString()}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Guests</strong></td>
            <td style="border-bottom:1px solid #eee;">${bookingDoc?.totalGuest}</td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid #eee;"><strong>Payment Mode</strong></td>
            <td style="border-bottom:1px solid #eee;">${bookingDoc?.paymentMode}</td>
          </tr>
          <tr>
            <td style="font-size:16px;"><strong>Total Amount</strong></td>
            <td style="font-size:16px; color:#0d6efd;"><strong>₹${bookingDoc?.totalPrice}</strong></td>
          </tr>
        </table>

        <p style="margin-top:20px;">
          If you need to modify or cancel your booking, please contact our support team.
        </p>

        <p>We wish you a comfortable and pleasant stay! 🌟</p>

        <p style="margin-top:25px;">
          Regards,<br/>
          <strong>Hotel Booking Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f1f3f5; padding:15px; text-align:center; font-size:12px; color:#777;">
        <p style="margin:0;">This is an automated email. Please do not reply.</p>
      </div>

    </div>
  </div>
  `
    });