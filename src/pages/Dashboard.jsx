/**
 * Dashboard Page
 */

import { useState } from 'react';
import { useFiles } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FileCard from '../components/FileCard';
import UploadModal from '../components/modals/UploadModal';
import ShareModal from '../components/modals/ShareModal';
import { Folder, TrendingUp, ShieldAlert } from 'lucide-react';
import { downloadAndDecryptFile, deleteFileCompletely, promptForPassword } from '../services/fileOperations';
import { revokeAllPermissions } from '../services/supabase';
import { createActivityLog } from '../services/supabase';

export default function Dashboard() {
    const { files, loading, refreshFiles } = useFiles();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [lockdownModalOpen, setLockdownModalOpen] = useState(false);
    const [lockdownLoading, setLockdownLoading] = useState(false);

    const recentFiles = files.slice(0, 6);

    const handleShare = (file) => {
        setSelectedFile(file);
        setShareModalOpen(true);
    };

    const handleDownload = async (file) => {
        try {
            const password = await promptForPassword('download');
            showToast('Downloading file...', 'info');
            await downloadAndDecryptFile(file, password, user.id);
            showToast('File downloaded successfully!', 'success');
        } catch (error) {
            if (error.message !== 'Password prompt cancelled') {
                showToast(error.message || 'Download failed', 'error');
            }
        }
    };

    const handleDelete = async (file) => {
        if (!window.confirm(`Are you sure you want to delete "${file.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            showToast('Deleting file...', 'info');
            await deleteFileCompletely(file, user.id);
            showToast('File deleted successfully!', 'success');
            await refreshFiles();
        } catch (error) {
            showToast(error.message || 'Delete failed', 'error');
        }
    };

    const handleEmergencyLockdown = async () => {
        setLockdownLoading(true);
        try {
            // Revoke all permissions in database
            const revokedCount = await revokeAllPermissions(user.id);

            // Log the lockdown action
            await createActivityLog({
                userId: user.id,
                action: 'emergency_lockdown',
                details: `Revoked access to ${revokedCount} files`
            });

            showToast(
                `Emergency Lockdown Complete! ${revokedCount} permissions revoked.`,
                'success'
            );

            setLockdownModalOpen(false);
            await refreshFiles();
        } catch (error) {
            showToast(error.message || 'Lockdown failed', 'error');
        } finally {
            setLockdownLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading your files...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Emergency Lockdown Button */}
            <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <ShieldAlert className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-h3 font-semibold text-neutral-900">Emergency Lockdown</h3>
                            <p className="text-caption text-neutral-600">
                                Instantly revoke all access to your files. Use if you feel unsafe.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setLockdownModalOpen(true)}
                        className="btn bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-semibold"
                    >
                        Activate Lockdown
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Folder className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-caption text-neutral-600">Total Files</p>
                            <p className="text-h2 font-semibold text-neutral-900">{files.length}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-caption text-neutral-600">Shared Files</p>
                            <p className="text-h2 font-semibold text-neutral-900">
                                {files.filter(f => f.shared_count > 0).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Folder className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-caption text-neutral-600">Storage Used</p>
                            <p className="text-h2 font-semibold text-neutral-900">
                                {((files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024) || 0).toFixed(1)} MB
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Files */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-h2 font-semibold text-neutral-900">Recent Files</h2>
                </div>

                {recentFiles.length === 0 ? (
                    <div className="card text-center py-12">
                        <Folder className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                        <h3 className="text-h3 font-medium text-neutral-900 mb-2">No files yet</h3>
                        <p className="text-neutral-600 mb-4">
                            Upload your first file to get started
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentFiles.map((file) => (
                            <FileCard
                                key={file.id}
                                file={file}
                                onDownload={handleDownload}
                                onShare={handleShare}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <UploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                file={selectedFile}
            />

            {/* Emergency Lockdown Modal */}
            {lockdownModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <ShieldAlert className="w-6 h-6 text-red-600" />
                            </div>
                            <h2 className="text-h2 font-semibold text-neutral-900">
                                Emergency Lockdown
                            </h2>
                        </div>

                        <div className="space-y-4 mb-6">
                            <p className="text-neutral-700">
                                This will <strong>immediately revoke all access</strong> to your files from everyone you've shared with.
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-800 font-medium">
                                    ⚠️ Warning: This action cannot be undone
                                </p>
                                <p className="text-sm text-red-700 mt-1">
                                    Use this if you feel unsafe or need to protect your data immediately.
                                </p>
                            </div>
                            <p className="text-sm text-neutral-600">
                                All permissions will be revoked and logged with a timestamp for your records.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setLockdownModalOpen(false)}
                                className="btn flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-900"
                                disabled={lockdownLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEmergencyLockdown}
                                className="btn flex-1 bg-red-600 hover:bg-red-700 text-white"
                                disabled={lockdownLoading}
                            >
                                {lockdownLoading ? 'Activating...' : 'Activate Lockdown'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
