/**
 * Login Page
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';
import Input from '../components/Input';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        setLoading(true);

        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (error) {
            showToast(error.message || 'Login failed', 'error');
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

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-card p-8">
                    <h2 className="text-h2 font-semibold text-neutral-900 mb-6">Sign In</h2>

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
                            showStrength={false}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            disabled={loading}
                            className="w-full"
                        >
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-neutral-600">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary hover:underline font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-neutral-500">
                        🔒 All files are encrypted client-side. Your data is secure.
                    </p>
                </div>
            </div>
        </div>
    );
}
