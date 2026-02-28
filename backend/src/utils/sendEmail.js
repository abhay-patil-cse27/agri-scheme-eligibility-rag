const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const baseHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6; -webkit-font-smoothing: antialiased; }
          .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .main { background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #065f46 0%, #064e3b 100%); padding: 40px 32px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
          .body { padding: 48px 40px; color: #334155; font-size: 16px; line-height: 1.8; }
          .footer { padding: 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; }
          .footer p { margin: 4px 0; color: #94a3b8; font-size: 13px; font-weight: 500; }
          .badge { display: inline-block; padding: 6px 16px; background-color: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; border-radius: 9999px; text-transform: uppercase; margin-bottom: 24px; letter-spacing: 0.05em; }
          .divider { height: 1px; background-color: #f1f5f9; margin: 32px 0; }
          @media (max-width: 480px) { .body { padding: 32px 24px; } }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="main">
            <div class="header">
              <h1>Niti-Setu</h1>
            </div>
            <div class="body">
              <div class="badge">Security Notification</div>
              <div style="color: #1e293b;">
                ${options.html}
              </div>
              <div class="divider"></div>
              <p style="font-size: 14px; color: #64748b; margin: 0; font-style: italic;">
                Ref: NS-IDENTITY-SECURE &bull; AI Verification Enabled
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Niti-Setu Systems. Engineering Agricultural Equity.</p>
              <p>Confidential &bull; System-Generated &bull; Secure Protocol</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: `[Niti-Setu] ${options.subject}`,
    html: baseHtml,
  };

  const info = await transporter.sendMail(message);
  console.log("Message sent: %s", info.messageId);
};

module.exports = sendEmail;
