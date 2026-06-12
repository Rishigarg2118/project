/**
 * Centralised Email Notification Service
 * Configured with Nodemailer. Fallback to mock log transport if not configured.
 * Students learn: Sending transactional emails in business applications.
 */
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

// Setup email transport
// If SMTP variables are not set, it operates in 'mock' mode logging emails to Winston
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@isoftzone.com';

let transporter = null;
const isMock = !SMTP_HOST || !SMTP_USER;

if (!isMock) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: parseInt(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  logger.info(`📧 Nodemailer SMTP transporter initialized with host ${SMTP_HOST}`);
} else {
  logger.info('📧 Nodemailer running in MOCK mode. Emails will be logged to combined.log');
}

/**
 * Send an email
 */
export async function sendEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: `"i-SOFTZONE Admin" <${FROM_EMAIL}>`,
    to,
    subject,
    text: text || html.replace(/<[^>]*>/g, ''),
    html,
  };

  if (isMock) {
    logger.info(`[MOCK EMAIL SENT]
      TO:      ${to}
      SUBJECT: ${subject}
      BODY:    ${mailOptions.text.trim()}
    `);
    return { mock: true, messageId: `mock-id-${Date.now()}` };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`[EMAIL SENT] Message ID: ${info.messageId} to ${to}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    // Don't crash the main transactional thread if email delivery fails
    return { error: true, message: err.message };
  }
}

/**
 * Send Welcome Email
 */
export async function sendWelcomeEmail(userEmail, userName) {
  const subject = 'Welcome to i-SOFTZONE Technologies Pvt Ltd!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #6366f1;">Welcome to i-SOFTZONE!</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Your user profile has been successfully set up in the Employee leave and attendance tracker system portal.</p>
      <p>You can now log in using your registered email and password to track leave balances, attendance logs, and manage allocations.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #718096; text-align: center;">i-SOFTZONE Technologies Pvt Ltd &copy; ${new Date().getFullYear()}</p>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html });
}

/**
 * Send Leave Approval Status Notification Email
 */
export async function sendLeaveStatusEmail(userEmail, userName, leaveType, status, reason) {
  const subject = `Leave Request Update: ${status.toUpperCase()}`;
  const statusColor = status === 'approved' ? '#10b981' : '#f43f5e';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: ${statusColor};">Leave Application ${status.toUpperCase()}</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Your request for <strong>${leaveType} leave</strong> has been marked as <strong style="color: ${statusColor};">${status}</strong>.</p>
      {reason && <p>Manager notes: "<em>${reason}</em>"</p>}
      <p>Please log in to your employee portal dashboard to review updated leave schedules and available balance grids.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #718096; text-align: center;">i-SOFTZONE Technologies Pvt Ltd &copy; ${new Date().getFullYear()}</p>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html });
}

/**
 * Send Asset Assigned Notification Email
 */
export async function sendAssetAssignedEmail(userEmail, userName, assetName, serialNumber) {
  const subject = `New Hardware Asset Allocated: ${assetName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #6366f1;">Hardware Asset Allocation Alert</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>The following IT inventory device has been assigned to your employee workstation:</p>
      <ul>
        <li><strong>Asset Name:</strong> ${assetName}</li>
        <li><strong>Serial Number:</strong> <code>${serialNumber}</code></li>
        <li><strong>Allocation Date:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>Please contact support to collect your hardware. Handle with care.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #718096; text-align: center;">i-SOFTZONE Technologies Pvt Ltd &copy; ${new Date().getFullYear()}</p>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html });
}
