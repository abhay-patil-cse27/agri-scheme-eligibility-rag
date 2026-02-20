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

  // Government of India styled HTML email template
  const baseHtml = `
    <div style="font-family: 'Times New Roman', Georgia, serif; max-width: 640px; margin: 0 auto; background-color: #ffffff; border: 1px solid #cccccc;">

      <!-- Tricolor top bar (table-based for email client compatibility) -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
        <td style="height:5px; background-color:#FF9933;" width="33%"></td>
        <td style="height:5px; background-color:#ffffff; border-top:1px solid #cccccc;" width="34%"></td>
        <td style="height:5px; background-color:#138808;" width="33%"></td>
      </tr></table>

      <!-- Official Header -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#1a3a5c;">
        <tr>
          <td style="padding:16px 12px 16px 20px; width:56px; vertical-align:middle; text-align:center;">
            <span style="font-size:34px;">🏛️</span>
          </td>
          <td style="padding:16px 20px 16px 8px; vertical-align:middle;">
            <p style="margin:0; color:#aac4e0; font-family:Arial,sans-serif; font-size:10px; letter-spacing:1.5px; text-transform:uppercase;">Government of India &nbsp;|&nbsp; Ministry of Agriculture &amp; Farmers Welfare</p>
            <p style="margin:5px 0 0 0; color:#ffffff; font-family:'Times New Roman',Georgia,serif; font-size:20px; font-weight:bold;">Niti-Setu Farmers Portal</p>
            <p style="margin:2px 0 0 0; color:#aac4e0; font-family:Arial,sans-serif; font-size:11px; font-style:italic;">&#2344;&#2368;&#2340;&#2367;-&#2360;&#2375;&#2340;&#2369; &nbsp;|&nbsp; Agricultural Scheme Eligibility System</p>
          </td>
        </tr>
      </table>

      <!-- Subject line bar -->
      <div style="background-color: #f0f4f8; border-bottom: 1px solid #d0dae5; padding: 10px 24px;">
        <p style="margin: 0; font-size: 13px; color: #555555;">
          <strong>Subject:</strong> ${options.subject}
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 28px; color: #1a1a1a; font-size: 15px; line-height: 1.7;">
        ${options.html}
        <p style="margin-top: 32px; font-size: 13px; color: #555555;">
          Yours faithfully,<br/>
          <strong>System Administrator</strong><br/>
          Niti-Setu Farmers Portal<br/>
          Ministry of Agriculture &amp; Farmers Welfare, Government of India
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #1a3a5c; padding: 14px 24px; text-align: center;">
        <p style="margin: 0; color: #aac4e0; font-size: 11px;">This is an official system-generated communication. Please do not reply to this email.</p>
        <p style="margin: 4px 0 0 0; color: #7a9bb5; font-size: 10px;">© Government of India. All Rights Reserved. | Confidential Communication</p>
      </div>

      <!-- Tricolor bottom bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
        <td style="height:5px; background-color:#FF9933;" width="33%"></td>
        <td style="height:5px; background-color:#ffffff; border-bottom:1px solid #cccccc;" width="34%"></td>
        <td style="height:5px; background-color:#138808;" width="33%"></td>
      </tr></table>

    </div>
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
