import express from 'express';
import { getOne, runQuery } from '../config/database.js';
import { validateApplication, sanitizeApplication } from '../utils/validators.js';
import { generateRefNumber } from '../utils/refNumberGenerator.js';
import { sendEmail } from '../utils/emailService.js';
import { applicationLimiter, statusCheckLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * POST /api/applications
 * Submit a new application
 */
router.post('/', applicationLimiter, async (req, res) => {
    try {
        // Sanitize input
        const sanitizedData = sanitizeApplication(req.body);

        // Validate input
        const validation = validateApplication(sanitizedData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: validation.errors
            });
        }

        // Check for duplicate email
        const existingEmail = getOne('SELECT id FROM applications WHERE email = ?', [sanitizedData.email]);
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                error: 'An application with this email already exists',
                code: 'DUPLICATE_EMAIL'
            });
        }

        // Check for duplicate phone
        const existingPhone = getOne('SELECT id FROM applications WHERE phone = ?', [sanitizedData.phone]);
        if (existingPhone) {
            return res.status(409).json({
                success: false,
                error: 'An application with this phone number already exists',
                code: 'DUPLICATE_PHONE'
            });
        }

        // Generate reference number
        const refNumber = generateRefNumber();
        const now = new Date().toISOString();

        // Insert application
        const result = runQuery(`
      INSERT INTO applications (
        ref_number, full_name, email, phone, department, level,
        talents, instruments, other_talent, previous_experience,
        experience_details, motivation, hopes_to_gain, availability,
        audition_slot, status, submitted_at, updated_at, status_history
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            refNumber,
            sanitizedData.fullName,
            sanitizedData.email,
            sanitizedData.phone,
            sanitizedData.department,
            sanitizedData.level,
            JSON.stringify(sanitizedData.talents),
            sanitizedData.instruments,
            sanitizedData.otherTalent,
            sanitizedData.previousExperience,
            sanitizedData.experienceDetails,
            sanitizedData.motivation,
            sanitizedData.hopesToGain,
            JSON.stringify(sanitizedData.availability),
            sanitizedData.auditionSlot,
            'Submitted',
            now,
            now,
            JSON.stringify([{ status: 'Submitted', timestamp: now, updatedBy: 'system' }])
        ]);

        // Send confirmation email to applicant
        await sendEmail(result.lastInsertRowid, sanitizedData.email, 'application_received', {
            fullName: sanitizedData.fullName,
            refNumber
        });

        // Notify Admin
        await sendEmail(result.lastInsertRowid, 'Mofosgang123@gmail.com', 'admin_new_application', {
            fullName: sanitizedData.fullName,
            department: sanitizedData.department,
            refNumber
        });

        res.status(201).json({
            success: true,
            refNumber,
            message: 'Application submitted successfully'
        });

    } catch (error) {
        console.error('Application submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit application',
            code: 'SERVER_ERROR'
        });
    }
});

/**
 * GET /api/applications/status/:identifier
 * Check application status by reference number or phone
 */
router.get('/status/:identifier', statusCheckLimiter, (req, res) => {
    try {
        const { identifier } = req.params;

        // Search by ref_number or phone
        const application = getOne(`
      SELECT 
        ref_number, full_name, department, level, talents,
        status, audition_slot, submitted_at
      FROM applications 
      WHERE ref_number = ? OR phone = ?
    `, [identifier, identifier]);

        if (!application) {
            return res.status(404).json({
                success: false,
                error: 'Application not found',
                code: 'NOT_FOUND'
            });
        }

        // Parse JSON fields
        const parsedApplication = {
            refNumber: application.ref_number,
            fullName: application.full_name,
            department: application.department,
            level: application.level,
            talents: JSON.parse(application.talents || '[]'),
            status: application.status,
            auditionSlot: application.audition_slot,
            submittedAt: application.submitted_at
        };

        res.json({
            success: true,
            application: parsedApplication
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check status',
            code: 'SERVER_ERROR'
        });
    }
});

export default router;
