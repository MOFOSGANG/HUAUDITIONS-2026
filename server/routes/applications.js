import express from 'express';
import { supabase } from '../config/database.js';
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
        if (!supabase) {
            return res.status(500).json({
                success: false,
                error: 'Database not initialized',
                code: 'DB_ERROR'
            });
        }

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
        const { data: existingEmail } = await supabase
            .from('applications')
            .select('id')
            .eq('email', sanitizedData.email)
            .single();

        if (existingEmail) {
            return res.status(409).json({
                success: false,
                error: 'An application with this email already exists',
                code: 'DUPLICATE_EMAIL'
            });
        }

        // Check for duplicate phone
        const { data: existingPhone } = await supabase
            .from('applications')
            .select('id')
            .eq('phone', sanitizedData.phone)
            .single();

        if (existingPhone) {
            return res.status(409).json({
                success: false,
                error: 'An application with this phone number already exists',
                code: 'DUPLICATE_PHONE'
            });
        }

        // Generate reference number
        const refNumber = await generateRefNumber();
        const now = new Date().toISOString();

        // Insert application
        const { data: newApp, error: insertError } = await supabase
            .from('applications')
            .insert({
                ref_number: refNumber,
                full_name: sanitizedData.fullName,
                email: sanitizedData.email,
                phone: sanitizedData.phone,
                department: sanitizedData.department,
                level: sanitizedData.level,
                talents: sanitizedData.talents,
                instruments: sanitizedData.instruments,
                other_talent: sanitizedData.otherTalent,
                previous_experience: sanitizedData.previousExperience,
                experience_details: sanitizedData.experienceDetails,
                motivation: sanitizedData.motivation,
                hopes_to_gain: sanitizedData.hopesToGain,
                availability: sanitizedData.availability,
                audition_slot: sanitizedData.auditionSlot,
                status: 'Submitted',
                submitted_at: now,
                updated_at: now,
                status_history: [{ status: 'Submitted', timestamp: now, updatedBy: 'system' }]
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            throw insertError;
        }

        // Send confirmation email to applicant
        await sendEmail(newApp.id, sanitizedData.email, 'application_received', {
            fullName: sanitizedData.fullName,
            refNumber
        });

        // Notify Admin
        await sendEmail(newApp.id, 'Mofosgang123@gmail.com', 'admin_new_application', {
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
router.get('/status/:identifier', statusCheckLimiter, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({
                success: false,
                error: 'Database not initialized',
                code: 'DB_ERROR'
            });
        }

        const { identifier } = req.params;

        // Search by ref_number first
        let { data: application } = await supabase
            .from('applications')
            .select('ref_number, full_name, department, level, talents, status, audition_slot, submitted_at')
            .eq('ref_number', identifier)
            .single();

        // If not found, try phone
        if (!application) {
            const { data: phoneResult } = await supabase
                .from('applications')
                .select('ref_number, full_name, department, level, talents, status, audition_slot, submitted_at')
                .eq('phone', identifier)
                .single();
            application = phoneResult;
        }

        if (!application) {
            return res.status(404).json({
                success: false,
                error: 'Application not found',
                code: 'NOT_FOUND'
            });
        }

        // Format response
        const parsedApplication = {
            refNumber: application.ref_number,
            fullName: application.full_name,
            department: application.department,
            level: application.level,
            talents: application.talents || [],
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
