'use strict';

const nodemailer = require('nodemailer');

const hasCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS;

let transporter = null;
if (hasCredentials) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  console.warn('[Email Service] Warning: EMAIL_USER and EMAIL_PASS environment variables are not set. Emails will be logged to the console instead.');
}

/**
 * Generic send function
 */
const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@transitops.dev',
    to,
    subject,
    html
  };

  if (!transporter) {
    console.log('\n=================== [MOCK EMAIL LOG] ===================');
    console.log(`FROM: ${mailOptions.from}`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`HTML BODY:\n${html}`);
    console.log('========================================================\n');
    return { mock: true, response: 'Mock email logged successfully' };
  }

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('[Email Service] Error sending mail:', error);
        return reject(error);
      }
      console.log('[Email Service] Email sent successfully:', info.response);
      resolve(info);
    });
  });
};

/**
 * Trip Dispatch Template
 */
const sendTripDispatchEmail = async ({
  driverEmail,
  driverName,
  tripNumber,
  source,
  destination,
  vehicleReg,
  vehicleModel,
  cargoWeight,
  plannedDistance
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">TRANSITOPS</h1>
        <p style="margin: 4px 0 0 0; color: #38bdf8; font-size: 14px; font-weight: 600;">NEW TRIP DISPATCH ORDER</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 16px; line-height: 1.5; margin-top: 0;">Hello <strong>${driverName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          You have been assigned to a new trip. Please review the details below before departing.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; width: 40%; color: #64748b;">Trip Number</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">#${tripNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Source / Origin</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${source}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Destination</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${destination}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Vehicle</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${vehicleModel} (${vehicleReg})</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Cargo Weight</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${cargoWeight} kg</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Planned Distance</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${plannedDistance} km</td>
          </tr>
        </table>
        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="background-color: #0ea5e9; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
            View Trip on Portal
          </a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        This is an automated notification. Please do not reply directly to this email.
      </div>
    </div>
  `;

  return sendEmail({
    to: driverEmail,
    subject: `🚨 Dispatch Assigned: Trip #${tripNumber}`,
    html
  });
};

/**
 * Incident Alert Template
 */
const sendIncidentAlertEmail = async ({
  recipients,
  tripId,
  reporterName,
  incidentType,
  location,
  comments,
  photoUrl
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #fca5a5; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <div style="background-color: #ef4444; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">⚠️ INCIDENT ALERT</h1>
        <p style="margin: 4px 0 0 0; color: #fee2e2; font-size: 14px; font-weight: 600;">TRANSITOPS OPERATIONS SECURITY</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 15px; line-height: 1.6; color: #1e293b; margin-top: 0;">
          A new incident has been reported. Immediate action or monitoring may be required.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; width: 40%; color: #64748b;">Incident Type</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #b91c1c; font-weight: 600;">${incidentType}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Associated Trip</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">Trip #${tripId || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Reported By</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${reporterName || 'Anonymous / Public Report'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Location</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${location || 'Not Specified'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Details / Comments</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; line-height: 1.4;">${comments || 'No comment provided.'}</td>
          </tr>
          ${photoUrl ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Attachment</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
              <a href="${photoUrl}" target="_blank" style="color: #ef4444; font-weight: 600; text-decoration: underline;">View Photo Attachment</a>
            </td>
          </tr>
          ` : ''}
        </table>
        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/trips" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
            Open Management Console
          </a>
        </div>
      </div>
      <div style="background-color: #fee2e2; padding: 16px; text-align: center; font-size: 12px; color: #ef4444; border-top: 1px solid #fca5a5; font-weight: 600;">
        CRITICAL OPERATIONAL UPDATE
      </div>
    </div>
  `;

  // Send to all recipients
  const promises = recipients.map(email => sendEmail({ to: email, subject: `⚠️ TransitOps Incident: ${incidentType}`, html }));
  return Promise.all(promises);
};

/**
 * Maintenance Notification Template
 */
const sendMaintenanceAlertEmail = async ({
  recipients,
  vehicleReg,
  vehicleModel,
  status, // 'Open' or 'Closed'
  description,
  cost
}) => {
  const isClosed = status === 'Closed';
  const headerBg = isClosed ? '#22c55e' : '#f59e0b';
  const labelText = isClosed ? 'MAINTENANCE COMPLETE' : 'VEHICLE PLACED IN MAINTENANCE';

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <div style="background-color: ${headerBg}; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; letter-spacing: 1px;">🔧 FLEET MAINTENANCE</h1>
        <p style="margin: 4px 0 0 0; color: #ffffff; font-size: 13px; font-weight: 600; opacity: 0.9;">${labelText}</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 15px; line-height: 1.5; margin-top: 0;">
          A vehicle maintenance record has been updated.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; width: 40%; color: #64748b;">Vehicle Registration</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;"><strong>${vehicleReg}</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Vehicle Model</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${vehicleModel}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Status</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: ${headerBg}; font-weight: 600;">${status}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Work Description</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; line-height: 1.4;">${description}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Maintenance Cost</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">₹ ${cost ?? 0}</td>
          </tr>
        </table>
        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/maintenance" style="background-color: #64748b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
            View Maintenance Dashboard
          </a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        This is an automated operational notification.
      </div>
    </div>
  `;

  // Send to all recipients
  const promises = recipients.map(email => sendEmail({ to: email, subject: `🔧 Maintenance ${status}: Vehicle ${vehicleReg}`, html }));
  return Promise.all(promises);
};

module.exports = {
  sendEmail,
  sendTripDispatchEmail,
  sendIncidentAlertEmail,
  sendMaintenanceAlertEmail
};
