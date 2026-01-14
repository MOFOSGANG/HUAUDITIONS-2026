import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/database.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { sendEmail } from '../utils/emailService.js';
import { VALID_STATUSES } from '../utils/validators.js';

const router = express.Router();

// ==================== AUTH ROUTES ====================

/**
 * POST /api/admin/login
 * Admin authentication
 */
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }

        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !admin || !bcrypt.compareSync(password, admin.password_hash)) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Update last login
        const now = new Date().toISOString();
        await supabase.from('admins').update({ last_login: now }).eq('id', admin.id);

        // Generate token
        const token = generateToken(admin);

        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
            code: 'SERVER_ERROR'
        });
    }
});

/**
 * POST /api/admin/logout
 */
router.post('/logout', authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// ==================== DASHBOARD ROUTES ====================

/**
 * GET /api/admin/dashboard/stats
 */
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        // Total applications
        const { count: totalApps } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true });

        // Status counts
        const { data: allApps } = await supabase.from('applications').select('status, talents, department, level');

        const statusMap = {};
        VALID_STATUSES.forEach(s => statusMap[s] = 0);

        const talentCounts = {};
        const departmentMap = {};
        const levelMap = {};

        (allApps || []).forEach(app => {
            statusMap[app.status] = (statusMap[app.status] || 0) + 1;
            departmentMap[app.department] = (departmentMap[app.department] || 0) + 1;
            levelMap[app.level] = (levelMap[app.level] || 0) + 1;
            (app.talents || []).forEach(t => {
                talentCounts[t] = (talentCounts[t] || 0) + 1;
            });
        });

        // Recent applications
        const { data: recentApps } = await supabase
            .from('applications')
            .select('id, ref_number, full_name, email, department, status, submitted_at')
            .order('submitted_at', { ascending: false })
            .limit(10);

        res.json({
            success: true,
            stats: {
                totalApplications: totalApps || 0,
                statusCounts: statusMap,
                talentCounts,
                departmentCounts: departmentMap,
                levelCounts: levelMap,
                recentApplications: (recentApps || []).map(app => ({
                    id: app.id,
                    refNumber: app.ref_number,
                    fullName: app.full_name,
                    email: app.email,
                    department: app.department,
                    status: app.status,
                    submittedAt: app.submitted_at
                }))
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats', code: 'SERVER_ERROR' });
    }
});

// ==================== APPLICATION MANAGEMENT ====================

/**
 * GET /api/admin/applications
 */
router.get('/applications', authenticateToken, async (req, res) => {
    try {
        const { search, status, department, level, page = 1, limit = 20 } = req.query;

        let query = supabase.from('applications').select('*', { count: 'exact' });

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,ref_number.ilike.%${search}%`);
        }
        if (status && status !== 'All') query = query.eq('status', status);
        if (department && department !== 'All') query = query.eq('department', department);
        if (level && level !== 'All') query = query.eq('level', level);

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        query = query.order('submitted_at', { ascending: false }).range(offset, offset + limitNum - 1);

        const { data, count, error } = await query;

        if (error) throw error;

        const parsedApps = (data || []).map(app => ({
            id: app.id,
            refNumber: app.ref_number,
            fullName: app.full_name,
            email: app.email,
            phone: app.phone,
            department: app.department,
            level: app.level,
            talents: app.talents || [],
            instruments: app.instruments,
            otherTalent: app.other_talent,
            previousExperience: app.previous_experience,
            experienceDetails: app.experience_details,
            motivation: app.motivation,
            hopesToGain: app.hopes_to_gain,
            availability: app.availability || [],
            auditionSlot: app.audition_slot,
            status: app.status,
            adminNotes: app.admin_notes,
            rating: app.rating,
            tags: app.tags || [],
            submittedAt: app.submitted_at,
            updatedAt: app.updated_at,
            statusHistory: app.status_history || []
        }));

        res.json({
            success: true,
            applications: parsedApps,
            totalCount: count || 0,
            page: pageNum,
            totalPages: Math.ceil((count || 0) / limitNum),
            limit: limitNum
        });

    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch applications', code: 'SERVER_ERROR' });
    }
});

/**
 * GET /api/admin/applications/:id
 */
router.get('/applications/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: app, error } = await supabase
            .from('applications')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !app) {
            return res.status(404).json({ success: false, error: 'Application not found', code: 'NOT_FOUND' });
        }

        res.json({
            success: true,
            application: {
                id: app.id,
                refNumber: app.ref_number,
                fullName: app.full_name,
                email: app.email,
                phone: app.phone,
                department: app.department,
                level: app.level,
                talents: app.talents || [],
                instruments: app.instruments,
                otherTalent: app.other_talent,
                previousExperience: app.previous_experience,
                experienceDetails: app.experience_details,
                motivation: app.motivation,
                hopesToGain: app.hopes_to_gain,
                availability: app.availability || [],
                auditionSlot: app.audition_slot,
                status: app.status,
                adminNotes: app.admin_notes,
                rating: app.rating,
                tags: app.tags || [],
                submittedAt: app.submitted_at,
                updatedAt: app.updated_at,
                statusHistory: app.status_history || []
            }
        });

    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch application', code: 'SERVER_ERROR' });
    }
});

/**
 * PUT /api/admin/applications/:id
 */
router.put('/applications/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data: app, error: fetchError } = await supabase
            .from('applications')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !app) {
            return res.status(404).json({ success: false, error: 'Application not found', code: 'NOT_FOUND' });
        }

        const now = new Date().toISOString();
        let statusHistory = app.status_history || [];

        // If status changed, add to history and send email
        if (updates.status && updates.status !== app.status) {
            statusHistory.push({
                status: updates.status,
                timestamp: now,
                updatedBy: req.admin.username
            });

            let templateType = null;
            if (updates.status === 'Audition Scheduled') templateType = 'audition_scheduled';
            else if (updates.status === 'Accepted') templateType = 'accepted';
            else if (updates.status === 'Waitlisted') templateType = 'waitlisted';
            else if (updates.status === 'Not Selected') templateType = 'not_selected';

            if (templateType) {
                await sendEmail(app.id, app.email, templateType, {
                    fullName: app.full_name,
                    refNumber: app.ref_number,
                    auditionSlot: updates.auditionSlot || app.audition_slot
                });
            }
        }

        const updateData = {
            updated_at: now,
            status_history: statusHistory
        };

        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.adminNotes !== undefined) updateData.admin_notes = updates.adminNotes;
        if (updates.rating !== undefined) updateData.rating = updates.rating;
        if (updates.tags !== undefined) updateData.tags = updates.tags;
        if (updates.auditionSlot !== undefined) updateData.audition_slot = updates.auditionSlot;

        const { data: updatedApp, error: updateError } = await supabase
            .from('applications')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json({
            success: true,
            application: {
                id: updatedApp.id,
                refNumber: updatedApp.ref_number,
                status: updatedApp.status,
                adminNotes: updatedApp.admin_notes,
                rating: updatedApp.rating,
                updatedAt: updatedApp.updated_at
            }
        });

    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ success: false, error: 'Failed to update application', code: 'SERVER_ERROR' });
    }
});

/**
 * DELETE /api/admin/applications/:id
 */
router.delete('/applications/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: app } = await supabase
            .from('applications')
            .select('id')
            .eq('id', id)
            .single();

        if (!app) {
            return res.status(404).json({ success: false, error: 'Application not found', code: 'NOT_FOUND' });
        }

        await supabase.from('applications').delete().eq('id', id);

        res.json({ success: true, message: 'Application deleted successfully' });

    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete application', code: 'SERVER_ERROR' });
    }
});

/**
 * POST /api/admin/applications/bulk-update
 */
router.post('/applications/bulk-update', authenticateToken, async (req, res) => {
    try {
        const { applicationIds, updates } = req.body;

        if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
            return res.status(400).json({ success: false, error: 'applicationIds must be a non-empty array', code: 'INVALID_INPUT' });
        }

        const now = new Date().toISOString();

        for (const id of applicationIds) {
            if (updates.status) {
                const { data: app } = await supabase.from('applications').select('status_history').eq('id', id).single();
                if (app) {
                    let history = app.status_history || [];
                    history.push({ status: updates.status, timestamp: now, updatedBy: req.admin.username });
                    await supabase.from('applications').update({
                        status: updates.status,
                        updated_at: now,
                        status_history: history
                    }).eq('id', id);
                }
            }
        }

        res.json({ success: true, updatedCount: applicationIds.length });

    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({ success: false, error: 'Failed to bulk update', code: 'SERVER_ERROR' });
    }
});

/**
 * DELETE /api/admin/applications/bulk-delete
 */
router.delete('/applications/bulk-delete', authenticateToken, async (req, res) => {
    try {
        const { applicationIds } = req.body;

        if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
            return res.status(400).json({ success: false, error: 'applicationIds must be a non-empty array', code: 'INVALID_INPUT' });
        }

        for (const id of applicationIds) {
            await supabase.from('applications').delete().eq('id', id);
        }

        res.json({ success: true, deletedCount: applicationIds.length });

    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ success: false, error: 'Failed to bulk delete', code: 'SERVER_ERROR' });
    }
});

/**
 * GET /api/admin/applications/export
 */
router.get('/applications/export', authenticateToken, async (req, res) => {
    try {
        const { status, department, level } = req.query;

        let query = supabase.from('applications').select('*');

        if (status && status !== 'All') query = query.eq('status', status);
        if (department && department !== 'All') query = query.eq('department', department);
        if (level && level !== 'All') query = query.eq('level', level);

        query = query.order('submitted_at', { ascending: false });

        const { data: applications, error } = await query;

        if (error) throw error;

        const headers = ['RefNumber', 'Name', 'Email', 'Phone', 'Department', 'Level', 'Talents', 'Status', 'Rating', 'Submitted', 'Notes'];

        const rows = (applications || []).map(app => [
            app.ref_number,
            `"${(app.full_name || '').replace(/"/g, '""')}"`,
            app.email,
            app.phone,
            app.department,
            app.level,
            `"${(app.talents || []).join(', ')}"`,
            app.status,
            app.rating || 0,
            app.submitted_at,
            `"${(app.admin_notes || '').replace(/"/g, '""')}"`
        ]);

        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

        const date = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="hudt-applications-${date}.csv"`);
        res.send(csv);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, error: 'Failed to export applications', code: 'SERVER_ERROR' });
    }
});

/**
 * POST /api/admin/applications/:id/send-email
 */
router.post('/applications/:id/send-email', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, message } = req.body;

        const { data: app } = await supabase.from('applications').select('*').eq('id', id).single();

        if (!app) {
            return res.status(404).json({ success: false, error: 'Application not found', code: 'NOT_FOUND' });
        }

        if (!subject || !message) {
            return res.status(400).json({ success: false, error: 'Subject and message are required', code: 'INVALID_INPUT' });
        }

        await sendEmail(app.id, app.email, 'custom', {
            subject,
            body: message,
            fullName: app.full_name,
            refNumber: app.ref_number
        });

        res.json({ success: true, message: 'Email sent successfully' });

    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({ success: false, error: 'Failed to send email', code: 'SERVER_ERROR' });
    }
});

export default router;
