/**
 * Share Modal Component
 * Handles file sharing with email-based wallet generation and social media sharing
 */

import { useState } from 'react';
import { Share2, Mail, MessageCircle, Facebook, Twitter, Instagram, Bluetooth, Copy, Link } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getOrCreateRecipientWallet } from '../../services/wallet';
import { grantPermission, createActivityLog } from '../../services/supabase';
import { grantAccess } from '../../services/blockchain';
import {
    shareViaWebShare,
    shareViaWhatsApp,
    shareViaFacebook,
    shareViaTwitter,
    shareViaInstagram,
    shareViaTikTok,
    shareViaBluetooth,
    copyLinkToClipboard,
} from '../../utils/socialShare';

export default function ShareModal({ isOpen, onClose, file }) {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSocialOptions, setShowSocialOptions] = useState(false);

    const handleEmailShare = async () => {
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
                recipientId: email,
                grantedBy: user.id,
                expiresAt: expiresAt || null,
            });

            // Step 3: Grant access on blockchain
            try {
                await grantAccess(file.id, address);
            } catch (blockchainError) {
                console.warn('Blockchain grant failed:', blockchainError);
            }

            // Step 4: Create activity log
            await createActivityLog({
                userId: user.id,
                action: 'access_granted',
                fileId: file.id,
                details: `Granted access to ${email}`,
            });

            showToast(`File shared with ${email}`, 'success');
            handleClose();
        } catch (error) {
            console.error('Share error:', error);
            showToast(error.message || 'Failed to share file', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialShare = async (platform) => {
        const fileData = {
            name: file?.name || 'Secure File',
            url: window.location.href,
        };

        try {
            switch (platform) {
                case 'native':
                    const shared = await shareViaWebShare(fileData);
                    if (shared) {
                        showToast('Shared successfully!', 'success');
                    } else {
                        setShowSocialOptions(true);
                    }
                    break;
                case 'whatsapp':
                    shareViaWhatsApp(fileData);
                    showToast('Opening WhatsApp...', 'info');
                    break;
                case 'facebook':
                    shareViaFacebook(fileData.url);
                    showToast('Opening Facebook...', 'info');
                    break;
                case 'twitter':
                    shareViaTwitter(fileData);
                    showToast('Opening Twitter...', 'info');
                    break;
                case 'instagram':
                    await shareViaInstagram(fileData);
                    break;
                case 'tiktok':
                    await shareViaTikTok(fileData);
                    break;
                case 'bluetooth':
                    await shareViaBluetooth(fileData);
                    break;
                case 'copy':
                    const copied = await copyLinkToClipboard();
                    if (copied) {
                        showToast('Link copied to clipboard!', 'success');
                    } else {
                        showToast('Failed to copy link', 'error');
                    }
                    break;
            }
        } catch (error) {
            console.error('Social share error:', error);
            showToast('Share failed', 'error');
        }
    };

    const handleClose = () => {
        if (!loading) {
            setEmail('');
            setExpiresAt('');
            setShowSocialOptions(false);
            onClose();
        }
    };

    const socialButtons = [
        { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: 'hover:bg-green-50 hover:text-green-600' },
        { id: 'facebook', icon: Facebook, label: 'Facebook', color: 'hover:bg-blue-50 hover:text-blue-600' },
        { id: 'twitter', icon: Twitter, label: 'Twitter', color: 'hover:bg-sky-50 hover:text-sky-600' },
        { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'hover:bg-pink-50 hover:text-pink-600' },
        { id: 'tiktok', icon: Share2, label: 'TikTok', color: 'hover:bg-purple-50 hover:text-purple-600' },
        { id: 'bluetooth', icon: Bluetooth, label: 'Bluetooth', color: 'hover:bg-indigo-50 hover:text-indigo-600' },
        { id: 'copy', icon: Copy, label: 'Copy Link', color: 'hover:bg-neutral-100 hover:text-neutral-900' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Share File">
            <div className="space-y-4">
                <div className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-neutral-900">{file?.name}</p>
                </div>

                {/* Quick Share Button */}
                <button
                    onClick={() => handleSocialShare('native')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">Quick Share</span>
                </button>

                {/* Social Media Options */}
                <div>
                    <button
                        onClick={() => setShowSocialOptions(!showSocialOptions)}
                        className="w-full text-sm text-neutral-600 hover:text-neutral-900 flex items-center justify-center gap-2 py-2"
                    >
                        <Link className="w-4 h-4" />
                        {showSocialOptions ? 'Hide' : 'Show'} more sharing options
                    </button>

                    {showSocialOptions && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            {socialButtons.map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => handleSocialShare(btn.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 transition-colors ${btn.color}`}
                                >
                                    <btn.icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-neutral-500">Or share via email</span>
                    </div>
                </div>

                {/* Email Sharing */}
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
                        <Mail className="w-4 h-4 inline mr-1" />
                        A wallet will be automatically created for the recipient if they don't have one.
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
                        onClick={handleEmailShare}
                        variant="primary"
                        loading={loading}
                        disabled={!email || loading}
                        className="flex-1"
                    >
                        Share via Email
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
