/**
 * Signup Page
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';
import Input from '../components/Input';
import PasswordInput from '../components/PasswordInput';
import { isPasswordStrong } from '../utils/passwordUtils';

export default function Signup() {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Check if passwords match
    const passwordsMatch = password && confirmPassword && password === confirmPassword;
    const passwordsDontMatch = confirmPassword && password !== confirmPassword;

    // Check if form is valid
    const isFormValid = email && password && confirmPassword &&
        passwordsMatch && isPasswordStrong(password);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (!isPasswordStrong(password)) {
            showToast('Please use a stronger password', 'error');
            return;
        }

        setLoading(true);

        try {
            await signUp(email, password);
            showToast('Account created! Please check your email to verify.', 'success');
            navigate('/login');
        } catch (error) {
            showToast(error.message || 'Signup failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-h1 font-semibold text-neutral-900">SecureVault</h1>
                    <p className="text-neutral-600 mt-2">Privacy-focused file storage for women</p>
                </div>

                {/* Signup Form */}
                <div className="bg-white rounded-2xl shadow-card p-8">
                    <h2 className="text-h2 font-semibold text-neutral-900 mb-6">Create Account</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            disabled={loading}
                        />

                        <PasswordInput
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            showStrength={true}
                        />

                        <PasswordInput
                            label="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            error={passwordsDontMatch ? 'Passwords do not match' : null}
                        />

                        {/* Password Match Indicator */}
                        {passwordsMatch && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <span>✓</span>
                                <span>Passwords match</span>
                            </div>
                        )}

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-900">
                                🔒 Your password encrypts your files. Make it strong and memorable!
                            </p>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            disabled={loading || !isFormValid}
                            className="w-full"
                        >
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-neutral-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-neutral-500">
                        🔒 End-to-end encryption • Zero-knowledge architecture
                    </p>
                </div>
            </div>
        </div>
    );
}
