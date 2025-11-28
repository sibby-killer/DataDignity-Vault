/**
 * Upload Modal Component
 * Handles file upload with encryption and blockchain registration
 */

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import ProgressBar from '../ProgressBar';
import { useAuth } from '../../context/AuthContext';
import { useFiles } from '../../context/FileContext';
import { useToast } from '../../context/ToastContext';
import { encryptFile, arrayBufferToBase64 } from '../../utils/crypto';
import { uploadToStorage } from '../../utils/storage';
import { createFile, createActivityLog } from '../../services/supabase';
import { registerFile } from '../../services/blockchain';

export default function UploadModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const { addFile } = useFiles();
    const { showToast } = useToast();
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [password, setPassword] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (50MB limit for free tier)
            if (file.size > 50 * 1024 * 1024) {
                showToast('File size exceeds 50MB limit', 'error');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !password) {
            showToast('Please select a file and enter a password', 'error');
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            // Step 1: Encrypt file
            setStatus('Encrypting file...');
            setProgress(20);

            const { encryptedData, iv, salt } = await encryptFile(selectedFile, password);

            setProgress(40);

            // Step 2: Upload to Supabase Storage
            setStatus('Uploading to storage...');
            const { path } = await uploadToStorage(
                encryptedData,
                selectedFile.name,
                user.id
            );

            setProgress(60);

            // Step 3: Save metadata to database
            setStatus('Saving metadata...');
            const fileRecord = await createFile({
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size,
                storagePath: path,
                encryptedKey: arrayBufferToBase64(iv), // Store IV
                iv: arrayBufferToBase64(iv),
                salt: arrayBufferToBase64(salt),
                ownerId: user.id,
            });

            setProgress(80);

            // Step 4: Register on blockchain
            setStatus('Registering on blockchain...');
            try {
                await registerFile(fileRecord.id, path);
            } catch (blockchainError) {
                console.warn('Blockchain registration failed:', blockchainError);
                // Continue even if blockchain fails
            }

            setProgress(90);

            // Step 5: Create activity log
            await createActivityLog({
                userId: user.id,
                action: 'file_uploaded',
                fileId: fileRecord.id,
                details: `Uploaded ${selectedFile.name}`,
            });

            setProgress(100);
            setStatus('Upload complete!');

            // Add to file list
            addFile(fileRecord);

            // Show success message
            showToast('File uploaded successfully!', 'success');

            // Reset and close
            setTimeout(() => {
                handleClose();
            }, 500);
        } catch (error) {
            console.error('Upload error:', error);
            showToast(error.message || 'Upload failed. Please try again.', 'error');
            setUploading(false);
            setProgress(0);
            setStatus('');
        }
    };

    const handleClose = () => {
        if (!uploading) {
            setSelectedFile(null);
            setPassword('');
            setProgress(0);
            setStatus('');
            setUploading(false);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Upload File">
            <div className="space-y-4">
                {!selectedFile ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-neutral-50 transition-colors"
                    >
                        <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                        <p className="text-neutral-700 font-medium">Click to select a file</p>
                        <p className="text-sm text-neutral-500 mt-1">Maximum file size: 50MB</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-neutral-900 truncate">
                                    {selectedFile.name}
                                </p>
                                <p className="text-sm text-neutral-500">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            {!uploading && (
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="text-neutral-400 hover:text-neutral-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {selectedFile && !uploading && (
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Encryption Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter a strong password"
                            className="input"
                            autoFocus
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                            This password will be used to encrypt your file. Keep it safe!
                        </p>
                    </div>
                )}

                {uploading && (
                    <ProgressBar progress={progress} status={status} />
                )}

                <div className="flex gap-3 pt-2">
                    <Button
                        onClick={handleClose}
                        variant="secondary"
                        disabled={uploading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        variant="primary"
                        disabled={!selectedFile || !password || uploading}
                        loading={uploading}
                        className="flex-1"
                    >
                        Upload
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
