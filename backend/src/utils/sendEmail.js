const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter using Mailtrap or other SMTP service
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Base HTML template with Niti-Setu branding
  const baseHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Niti-Setu Engine</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff; color: #1f2937;">
        ${options.html}
      </div>
      <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #6b7280;">
        <p style="margin: 0;">This is an automated message from the Niti-Setu Agricultural AI System.</p>
        <p style="margin: 4px 0 0 0;">Please do not reply to this email.</p>
      </div>
    </div>
  `;

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: baseHtml,
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
