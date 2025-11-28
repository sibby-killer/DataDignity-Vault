/**
 * Shared With Me Page
 * Shows files that have been shared with the current user
 */

import { useState } from 'react';
import { useFiles } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FileCard from '../components/FileCard';
import { Folder, Users } from 'lucide-react';
import { downloadAndDecryptFile, promptForPassword } from '../services/fileOperations';

export default function SharedWithMe() {
    const { sharedFiles, loading } = useFiles();
    const { user } = useAuth();
    const { showToast } = useToast();

    const handleDownload = async (permission) => {
        const file = permission.file;
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading shared files...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 font-semibold text-neutral-900">Shared With Me</h1>
                    <p className="text-neutral-600 mt-1">{sharedFiles.length} files shared with you</p>
                </div>
            </div>

            {sharedFiles.length === 0 ? (
                <div className="card text-center py-12">
                    <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-h3 font-medium text-neutral-900 mb-2">No shared files</h3>
                    <p className="text-neutral-600">
                        Files shared with you will appear here
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sharedFiles.map((permission) => (
                        <div key={permission.id} className="card">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Folder className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-neutral-900 truncate">
                                        {permission.file?.name || 'Unknown File'}
                                    </h3>
                                    <p className="text-sm text-neutral-600">
                                        {permission.file?.type || 'Unknown type'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Size:</span>
                                    <span className="font-medium text-neutral-900">
                                        {((permission.file?.size || 0) / 1024).toFixed(1)} KB
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Shared:</span>
                                    <span className="font-medium text-neutral-900">
                                        {new Date(permission.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {permission.expires_at && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600">Expires:</span>
                                        <span className="font-medium text-destructive">
                                            {new Date(permission.expires_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleDownload(permission)}
                                className="btn btn-primary w-full mt-4"
                            >
                                Download
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
