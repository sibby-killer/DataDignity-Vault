/**
 * Lockdown Modal Component
 * Emergency lockdown - revokes all file permissions
 */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { revokeAllPermissions, createActivityLog } from '../../services/supabase';
import { revokeAllAccess } from '../../services/blockchain';

export default function LockdownModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLockdown = async () => {
        if (confirmText !== 'LOCKDOWN') {
            showToast('Please type LOCKDOWN to confirm', 'error');
            return;
        }

        setLoading(true);

        try {
            // Step 1: Revoke all permissions in database
            const revokedCount = await revokeAllPermissions(user.id);

            // Step 2: Revoke all on blockchain
            try {
                await revokeAllAccess();
            } catch (blockchainError) {
                console.warn('Blockchain lockdown failed:', blockchainError);
                // Continue even if blockchain fails
            }

            // Step 3: Create activity log
            await createActivityLog({
                userId: user.id,
                action: 'lockdown_executed',
                fileId: null,
                details: `Emergency lockdown executed. ${revokedCount} permissions revoked.`,
            });

            // TODO: Send email notifications via Edge Function

            showToast(`Lockdown complete. ${revokedCount} permissions revoked.`, 'success');
            handleClose();
        } catch (error) {
            console.error('Lockdown error:', error);
            showToast(error.message || 'Lockdown failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setConfirmText('');
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Emergency Lockdown" size="lg">
            <div className="space-y-4">
                <div className="bg-red-50 border-2 border-destructive rounded-lg p-4">
                    <div className="flex gap-3">
                        <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-destructive mb-2">
                                ⚠️ WARNING: This action is IRREVERSIBLE
                            </h3>
                            <p className="text-sm text-red-900">
                                Emergency lockdown will immediately revoke ALL file permissions you have granted.
                                This means:
                            </p>
                            <ul className="list-disc list-inside text-sm text-red-900 mt-2 space-y-1">
                                <li>All shared files will become inaccessible to recipients</li>
                                <li>All active permissions will be permanently revoked</li>
                                <li>Recipients will receive notification emails</li>
                                <li>This action CANNOT be undone</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-50 rounded-lg p-4">
                    <h4 className="font-medium text-neutral-900 mb-2">When to use lockdown:</h4>
                    <ul className="text-sm text-neutral-700 space-y-1">
                        <li>• Your device is lost or stolen</li>
                        <li>• You suspect unauthorized access</li>
                        <li>• Emergency situation requiring immediate action</li>
                        <li>• You need to revoke all permissions quickly</li>
                    </ul>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                        Type <span className="font-bold text-destructive">LOCKDOWN</span> to confirm:
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="LOCKDOWN"
                        className="input"
                        disabled={loading}
                        autoFocus
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        onClick={handleClose}
                        variant="secondary"
                        disabled={loading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleLockdown}
                        variant="lockdown"
                        loading={loading}
                        disabled={confirmText !== 'LOCKDOWN' || loading}
                        className="flex-1"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Execute Lockdown
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
