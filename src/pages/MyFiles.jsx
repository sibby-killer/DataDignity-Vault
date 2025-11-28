/**
 * My Files Page
 */

import { useState } from 'react';
import { useFiles } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FileCard from '../components/FileCard';
import ShareModal from '../components/modals/ShareModal';
import { Folder } from 'lucide-react';
import { downloadAndDecryptFile, deleteFileCompletely, promptForPassword } from '../services/fileOperations';

export default function MyFiles() {
    const { files, loading, refreshFiles } = useFiles();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 font-semibold text-neutral-900">My Files</h1>
                    <p className="text-neutral-600 mt-1">{files.length} files total</p>
                </div>
            </div>

            {files.length === 0 ? (
                <div className="card text-center py-12">
                    <Folder className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-h3 font-medium text-neutral-900 mb-2">No files yet</h3>
                    <p className="text-neutral-600">Upload your first file to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
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

            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                file={selectedFile}
            />
        </div>
    );
}
