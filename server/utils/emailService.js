import nodemailer from 'nodemailer';
import { runQuery, getAll } from '../config/database.js';

/**
 * Real Email Service using Nodemailer
 */

// Create reusable transporter
const createTransporter = () => {
    const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    };

    if (!config.auth.user || !config.auth.pass) {
        return null;
    }

    return nodemailer.createTransport(config);
};

const EMAIL_TEMPLATES = {
    application_received: {
        subject: 'Your HUDT Application - {refNumber}',
        body: `Dear {fullName},

Thank you for applying to join Hallmark University Drama Troops (HUDT) 2026!

Your application has been received and your reference number is: {refNumber}

Please save this reference number to check your application status at any time.

What happens next:
1. Our team will review your application within 48 hours
2. You'll receive an email with updates
3. If selected, you'll be invited for an audition

If you have any questions, please contact us at hudt@hallmarkuniversity.edu

Best regards,
HUDT Recruitment Team
🎭 Where Stars Are Born`
    },

    audition_scheduled: {
        subject: '🎭 Your HUDT Audition is Scheduled!',
        body: `Dear {fullName},

Great news! Your audition has been scheduled!

📅 Date & Time: {auditionSlot}
📍 Venue: Main Theatre Hall, Arts Building, Hallmark University

What to bring:
- A prepared monologue or performance piece (2-3 minutes)
- Comfortable clothing for movement
- Your student ID
- Water bottle
- Positive energy!

Tips for success:
- Arrive 15 minutes early
- Warm up your voice and body
- Be yourself and have fun!

Reference Number: {refNumber}

If you need to reschedule, please contact us at hudt@hallmarkuniversity.edu

Break a leg! 🌟
HUDT Recruitment Team`
    },

    accepted: {
        subject: '🎉 Congratulations! Welcome to HUDT!',
        body: `Dear {fullName},

CONGRATULATIONS! 🎭✨

We are thrilled to inform you that you have been ACCEPTED into Hallmark University Drama Troops!

Your talent and passion truly shone during the audition process, and we can't wait to have you as part of our family.

Next Steps:
1. Orientation Meeting: [Date TBD]
2. Complete member registration form
3. Join our WhatsApp group for updates: https://chat.whatsapp.com/JIyFdFsw3t5JT2C7vEBYoq
4. Get your official HUDT member badge

Your Reference Number: {refNumber}

Welcome to the stage where stars are born! 🌟

With excitement,
HUDT Leadership Team`,
        html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #581c87; margin-bottom: 10px;">CONGRATULATIONS! 🎭✨</h1>
                <p style="font-size: 18px; color: #4a5568;">Welcome to the HUDT Family</p>
            </div>
            
            <p>Dear <strong>{fullName}</strong>,</p>
            
            <p>We are thrilled to inform you that you have been <strong>ACCEPTED</strong> into Hallmark University Drama Troops!</p>
            
            <p>Your talent and passion truly shone during the audition process, and we can't wait to have you as part of our family.</p>
            
            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="margin-top: 0; color: #2d3748;">Next Steps:</h3>
                <ol style="color: #4a5568; line-height: 1.6;">
                    <li>Orientation Meeting: <strong>[Date TBD]</strong></li>
                    <li>Complete member registration form</li>
                    <li><strong>Join our WhatsApp group for updates:</strong></li>
                </ol>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="https://chat.whatsapp.com/JIyFdFsw3t5JT2C7vEBYoq" style="background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">Join WhatsApp Group</a>
                </div>
            </div>
            
            <p style="color: #718096; font-size: 14px;">Your Reference Number: <strong>{refNumber}</strong></p>
            
            <p style="margin-top: 30px;">Welcome to the stage where stars are born! 🌟</p>
            
            <p>With excitement,<br><strong>HUDT Leadership Team</strong></p>
        </div>
        `
    },

    waitlisted: {
        subject: 'HUDT Application Update - Waitlisted',
        body: `Dear {fullName},

Thank you for auditioning for HUDT. Your performance was appreciated!

We want to inform you that you have been placed on our WAITLIST.

This means:
- We were impressed by your audition
- Due to limited spots, we couldn't offer immediate admission
- As spots become available, we will consider waitlisted applicants

Your Reference Number: {refNumber}

We encourage you to:
- Continue developing your talents
- Stay connected with HUDT events
- Consider re-applying next season

Thank you for your interest in HUDT.

Best regards,
HUDT Recruitment Team`
    },

    not_selected: {
        subject: 'Thank You for Your Interest in HUDT',
        body: `Dear {fullName},

Thank you for taking the time to audition for Hallmark University Drama Troops.

After careful consideration, we regret to inform you that we are unable to offer you a place at this time.

This decision was extremely difficult, as we had many talented applicants.

Please know that:
- Your effort and courage in auditioning are commendable
- This is not a reflection of your worth or talent
- We encourage you to continue pursuing your passion
- You are welcome to apply again in future seasons

Your Reference Number: {refNumber}

Keep shining! ✨

Warm regards,
HUDT Recruitment Team`
    },

    custom: {
        subject: '{subject}',
        body: '{body}'
    },

    admin_new_application: {
        subject: '🔔 New HUDT Application: {fullName}',
        body: `Admin Notification,

A new application has been submitted for HUDT Auditions 2026.

Applicant: {fullName}
Department: {department}
Ref Number: {refNumber}

Please log in to the Admin Dashboard to review the details and schedule an audition.

Dashboard Link: {dashboardUrl}
`
    }
};

/**
 * Send an email
 */
export const sendEmail = async (applicationId, recipient, templateType, data) => {
    const template = EMAIL_TEMPLATES[templateType] || EMAIL_TEMPLATES.custom;

    let subject = template.subject;
    let body = template.body;
    let html = template.html || null;

    // Replace placeholders
    const placeholders = {
        fullName: data.fullName || 'Applicant',
        refNumber: data.refNumber || 'N/A',
        auditionSlot: data.auditionSlot || 'TBD',
        department: data.department || 'N/A',
        dashboardUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/admin` : 'http://localhost:5173/admin',
        subject: data.subject || '',
        body: data.body || ''
    };

    for (const [key, value] of Object.entries(placeholders)) {
        subject = subject.replace(new RegExp(`{${key}}`, 'g'), value);
        body = body.replace(new RegExp(`{${key}}`, 'g'), value);
        if (html) {
            html = html.replace(new RegExp(`{${key}}`, 'g'), value);
        }
    }

    const now = new Date().toISOString();
    const transporter = createTransporter();

    try {
        if (transporter) {
            await transporter.sendMail({
                from: `"HUDT Auditions" <${process.env.SMTP_USER}>`,
                to: recipient,
                subject: subject,
                text: body,
                ...(html ? { html } : {})
            });
            console.log(`✅ Success: Real email sent to ${recipient}`);
        } else {
            console.log(`⚠️ Simulation Mode: Email to ${recipient} logged to DB only.`);
        }

        runQuery(`
            INSERT INTO email_logs (application_id, recipient, subject, body, sent_at, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [applicationId, recipient, subject, body, now, 'sent']);

        return { success: true, message: 'Email processed successfully' };
    } catch (error) {
        console.error('❌ Email Error:', error);

        runQuery(`
            INSERT INTO email_logs (application_id, recipient, subject, body, sent_at, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [applicationId, recipient, subject, body, now, 'failed']);

        return { success: false, error: 'Failed to send actual email' };
    }
};

/**
 * Get email history for an application
 */
export const getEmailHistory = (applicationId) => {
    return getAll(`
    SELECT * FROM email_logs WHERE application_id = ? ORDER BY sent_at DESC
  `, [applicationId]);
};

export { EMAIL_TEMPLATES };
