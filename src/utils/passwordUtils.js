/**
 * Password validation utilities
 * Provides password strength calculation and validation
 */

/**
 * Calculate password strength
 * @param {string} password - Password to evaluate
 * @returns {{level: number, percentage: number, label: string, color: string}}
 */
export function calculatePasswordStrength(password) {
    if (!password) {
        return { level: 0, percentage: 0, label: 'None', color: 'bg-neutral-200' };
    }

    let score = 0;
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    // Calculate score based on checks
    if (checks.length) score += 20;
    if (checks.uppercase) score += 20;
    if (checks.lowercase) score += 20;
    if (checks.number) score += 20;
    if (checks.special) score += 20;

    // Bonus for longer passwords
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Cap at 100
    score = Math.min(score, 100);

    // Determine level and label
    let level, label, color;
    if (score < 40) {
        level = 1;
        label = 'Weak';
        color = 'bg-red-500';
    } else if (score < 70) {
        level = 2;
        label = 'Medium';
        color = 'bg-orange-500';
    } else if (score < 90) {
        level = 3;
        label = 'Good';
        color = 'bg-yellow-500';
    } else {
        level = 4;
        label = 'Strong';
        color = 'bg-green-500';
    }

    return { level, percentage: score, label, color };
}

/**
 * Get password feedback with specific suggestions
 * @param {string} password - Password to evaluate
 * @returns {Array<string>} Array of feedback messages
 */
export function getPasswordFeedback(password) {
    const feedback = [];

    if (!password) {
        return ['Enter a password to see strength'];
    }

    if (password.length < 8) {
        feedback.push('Use at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
        feedback.push('Add uppercase letters (A-Z)');
    }

    if (!/[a-z]/.test(password)) {
        feedback.push('Add lowercase letters (a-z)');
    }

    if (!/[0-9]/.test(password)) {
        feedback.push('Add numbers (0-9)');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        feedback.push('Add special characters (!@#$%^&*)');
    }

    if (feedback.length === 0) {
        feedback.push('✓ Strong password!');
    }

    return feedback;
}

/**
 * Check if password meets minimum strength requirements
 * @param {string} password - Password to validate
 * @returns {boolean} True if password is strong enough
 */
export function isPasswordStrong(password) {
    const strength = calculatePasswordStrength(password);
    return strength.level >= 3; // Good or Strong
}

/**
 * Validate password requirements
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export function validatePassword(password) {
    const errors = [];

    if (!password) {
        errors.push('Password is required');
        return { valid: false, errors };
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
}
