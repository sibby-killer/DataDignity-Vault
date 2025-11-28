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
import { Folder, TrendingUp } from 'lucide-react';
import { downloadAndDecryptFile, deleteFileCompletely, promptForPassword } from '../services/fileOperations';

export default function Dashboard() {
    const { files, loading, refreshFiles } = useFiles();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

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
        </div>
    );
}
