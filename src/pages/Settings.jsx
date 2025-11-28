/**
 * Settings Page
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';
import Input from '../components/Input';
import LockdownModal from '../components/modals/LockdownModal';
import { User, Lock, Shield } from 'lucide-react';

export default function Settings() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [lockdownModalOpen, setLockdownModalOpen] = useState(false);

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-h1 font-semibold text-neutral-900">Settings</h1>
                <p className="text-neutral-600 mt-1">Manage your account and security</p>
            </div>

            {/* Profile Section */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <User className="w-5 h-5 text-neutral-600" />
                    <h2 className="text-h3 font-semibold text-neutral-900">Profile</h2>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                    />
                    <p className="text-sm text-neutral-500">
                        Email cannot be changed. Contact support if you need assistance.
                    </p>
                </div>
            </div>

            {/* Security Section */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <Lock className="w-5 h-5 text-neutral-600" />
                    <h2 className="text-h3 font-semibold text-neutral-900">Security</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="font-medium text-neutral-900 mb-2">Encryption</h3>
                        <p className="text-sm text-neutral-600">
                            All your files are encrypted client-side using AES-GCM 256-bit encryption.
                            Your encryption keys never leave your device.
                        </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-green-900 mb-1">End-to-End Encrypted</h4>
                                <p className="text-sm text-green-800">
                                    Your files are protected with military-grade encryption. Only you can decrypt them.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card border-2 border-destructive">
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-destructive" />
                    <h2 className="text-h3 font-semibold text-destructive">Danger Zone</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="font-medium text-neutral-900 mb-2">Emergency Lockdown</h3>
                        <p className="text-sm text-neutral-600 mb-4">
                            Immediately revoke all file permissions. Use this if your device is lost or stolen.
                            This action is irreversible.
                        </p>
                        <Button
                            onClick={() => setLockdownModalOpen(true)}
                            variant="destructive"
                        >
                            Execute Lockdown
                        </Button>
                    </div>
                </div>
            </div>

            <LockdownModal
                isOpen={lockdownModalOpen}
                onClose={() => setLockdownModalOpen(false)}
            />
        </div>
    );
}
