// Validation utilities for HUDT application data

export const VALID_DEPARTMENTS = [
    'International Relations',
    'Mass Communication',
    'Business Administration',
    'Biochemistry',
    'Microbiology',
    'Accounting',
    'Sociology',
    'Computer Science',
    'Economics',
    'Zoology'
];

export const VALID_LEVELS = ['100', '200', '300', '400', '500'];

export const VALID_TALENTS = [
    'Singing',
    'Dancing',
    'Acting',
    'Playing Instruments',
    'Costume Management',
    'Stage Management',
    'Script Writing',
    'Makeup & Special Effects',
    'Sound/Technical Production',
    'Lighting Design',
    'Set Design',
    'Photography/Videography',
    'Other'
];

export const VALID_STATUSES = [
    'Submitted',
    'Under Review',
    'Audition Scheduled',
    'Accepted',
    'Waitlisted',
    'Not Selected'
];

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePhone = (phone) => {
    // Allow various phone formats (Nigerian and international)
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateApplication = (data) => {
    const errors = {};

    // Full name
    if (!data.fullName || data.fullName.trim().length < 2) {
        errors.fullName = 'Full name is required (minimum 2 characters)';
    } else if (data.fullName.length > 100) {
        errors.fullName = 'Full name must be less than 100 characters';
    }

    // Email
    if (!data.email) {
        errors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
        errors.email = 'Invalid email format';
    }

    // Phone
    if (!data.phone) {
        errors.phone = 'Phone number is required';
    } else if (!validatePhone(data.phone)) {
        errors.phone = 'Invalid phone number format';
    }

    // Department
    if (!data.department) {
        errors.department = 'Department is required';
    } else if (!VALID_DEPARTMENTS.includes(data.department)) {
        errors.department = 'Invalid department selected';
    }

    // Level
    if (!data.level) {
        errors.level = 'Level is required';
    } else if (!VALID_LEVELS.includes(data.level.toString().replace(' Level', ''))) {
        errors.level = 'Invalid level selected';
    }

    // Talents
    if (!data.talents || !Array.isArray(data.talents) || data.talents.length === 0) {
        errors.talents = 'At least one talent must be selected';
    } else {
        const invalidTalents = data.talents.filter(t => !VALID_TALENTS.includes(t));
        if (invalidTalents.length > 0) {
            errors.talents = `Invalid talents: ${invalidTalents.join(', ')}`;
        }
    }

    // Previous experience
    if (!data.previousExperience && data.experience === undefined) {
        errors.previousExperience = 'Previous experience field is required';
    }

    // Motivation
    if (!data.motivation) {
        errors.motivation = 'Motivation is required';
    } else if (data.motivation.length < 50) {
        errors.motivation = 'Motivation must be at least 50 characters';
    } else if (data.motivation.length > 1000) {
        errors.motivation = 'Motivation must be less than 1000 characters';
    }

    // Availability
    if (!data.availability || !Array.isArray(data.availability) || data.availability.length === 0) {
        errors.availability = 'Availability is required';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
};

export const sanitizeApplication = (data) => {
    return {
        fullName: sanitizeString(data.fullName),
        email: sanitizeString(data.email)?.toLowerCase(),
        phone: sanitizeString(data.phone),
        department: sanitizeString(data.department),
        level: sanitizeString(data.level?.toString().replace(' Level', '')),
        talents: Array.isArray(data.talents) ? data.talents.map(sanitizeString) : [],
        instruments: sanitizeString(data.instruments) || null,
        otherTalent: sanitizeString(data.otherTalent || data.otherTalents) || null,
        previousExperience: data.previousExperience || data.experience || 'No',
        experienceDetails: sanitizeString(data.experienceDetails) || null,
        motivation: sanitizeString(data.motivation),
        hopesToGain: sanitizeString(data.hopesToGain || data.gain) || null,
        availability: Array.isArray(data.availability) ? data.availability.map(sanitizeString) : [],
        auditionSlot: sanitizeString(data.auditionSlot || data.preferredSlot) || null
    };
};
