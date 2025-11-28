/**
 * Password Input Component with visibility toggle and strength meter
 */

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { calculatePasswordStrength, getPasswordFeedback } from '../utils/passwordUtils';

export default function PasswordInput({
    label,
    value,
    onChange,
    placeholder = '••••••••',
    disabled = false,
    showStrength = false,
    error = null,
}) {
    const [showPassword, setShowPassword] = useState(false);
    const strength = showStrength ? calculatePasswordStrength(value) : null;
    const feedback = showStrength ? getPasswordFeedback(value) : null;

    return (
        <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
                {label}
            </label>
            <div className="relative">
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`input pr-12 ${error ? 'border-destructive focus:ring-destructive' : ''}`}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                    disabled={disabled}
                    tabIndex={-1}
                >
                    {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                    ) : (
                        <Eye className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
            )}

            {/* Password Strength Meter */}
            {showStrength && value && (
                <div className="mt-3 space-y-2">
                    {/* Strength Bar */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${strength.color}`}
                                style={{ width: `${strength.percentage}%` }}
                            />
                        </div>
                        <span className={`text-sm font-medium ${strength.level === 1 ? 'text-red-600' :
                                strength.level === 2 ? 'text-orange-600' :
                                    strength.level === 3 ? 'text-yellow-600' :
                                        'text-green-600'
                            }`}>
                            {strength.label}
                        </span>
                    </div>

                    {/* Feedback */}
                    {feedback && feedback.length > 0 && (
                        <div className="text-xs text-neutral-600 space-y-1">
                            {feedback.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-1">
                                    <span className={item.startsWith('✓') ? 'text-green-600' : ''}>
                                        {item.startsWith('✓') ? '✓' : '•'}
                                    </span>
                                    <span>{item.replace('✓ ', '')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
