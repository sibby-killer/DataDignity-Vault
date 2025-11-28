/**
 * Share Modal Component
 * Handles file sharing with email-based wallet generation
 */

import { useState } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getOrCreateRecipientWallet } from '../../services/wallet';
import { grantPermission, createActivityLog } from '../../services/supabase';
import { grantAccess } from '../../services/blockchain';

export default function ShareModal({ isOpen, onClose, file }) {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleShare = async () => {
        if (!email) {
            showToast('Please enter an email address', 'error');
            return;
        }

        if (email === user.email) {
            showToast('You cannot share with yourself', 'error');
            return;
        }

        setLoading(true);

        try {
            // Step 1: Get or create recipient wallet
            const { address } = await getOrCreateRecipientWallet(email);

            // Step 2: Grant permission in database
            const permission = await grantPermission({
                fileId: file.id,
                recipientId: email, // Using email as recipient ID for now
                grantedBy: user.id,
                expiresAt: expiresAt || null,
            });

            // Step 3: Grant access on blockchain
            try {
                await grantAccess(file.id, address);
            } catch (blockchainError) {
                console.warn('Blockchain grant failed:', blockchainError);
                // Continue even if blockchain fails
            }

            // Step 4: Create activity log
            await createActivityLog({
                userId: user.id,
                action: 'access_granted',
                fileId: file.id,
                details: `Granted access to ${email}`,
            });

            // TODO: Send email notification via Edge Function

            showToast(`File shared with ${email}`, 'success');
            handleClose();
        } catch (error) {
            console.error('Share error:', error);
            showToast(error.message || 'Failed to share file', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setEmail('');
            setExpiresAt('');
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Share File">
            <div className="space-y-4">
                <div className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-neutral-900">{file?.name}</p>
                </div>

                <Input
                    label="Recipient Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    disabled={loading}
                />

                <Input
                    label="Expiry Date (Optional)"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    disabled={loading}
                />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900">
                        A wallet will be automatically created for the recipient if they don't have one.
                        They'll receive an email notification with access instructions.
                    </p>
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
                        onClick={handleShare}
                        variant="primary"
                        loading={loading}
                        disabled={!email || loading}
                        className="flex-1"
                    >
                        Share
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
