/**
 * File operations service
 * Handles download, delete, and other file operations
 */

import { downloadFromStorage, deleteFromStorage } from '../utils/storage';
import { deleteFile, createActivityLog } from './supabase';
import { deriveKey, decryptFile, base64ToArrayBuffer } from '../utils/crypto';

/**
 * Download and decrypt a file
 * @param {Object} file - File metadata from database
 * @param {string} password - Decryption password
 * @param {string} userId - User ID for activity logging
 * @returns {Promise<void>}
 */
export async function downloadAndDecryptFile(file, password, userId) {
    try {
        // Step 1: Download encrypted file from storage
        const encryptedData = await downloadFromStorage(file.storage_path);

        // Step 2: Derive key from password using stored salt
        const salt = base64ToArrayBuffer(file.salt);
        const { key } = await deriveKey(password, salt);

        // Step 3: Decrypt file
        const iv = base64ToArrayBuffer(file.iv);
        const decryptedData = await decryptFile(encryptedData, key, iv);

        // Step 4: Create download link and trigger download
        const blob = new Blob([decryptedData], { type: file.type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Step 5: Log activity
        await createActivityLog({
            userId: userId,
            action: 'file_downloaded',
            fileId: file.id,
            details: `Downloaded file: ${file.name}`,
        });

        return { success: true };
    } catch (error) {
        console.error('Download error:', error);
        throw new Error(error.message || 'Failed to download file');
    }
}

/**
 * Delete a file (from storage and database)
 * @param {Object} file - File metadata from database
 * @param {string} userId - User ID for activity logging
 * @returns {Promise<void>}
 */
export async function deleteFileCompletely(file, userId) {
    try {
        // Step 1: Delete from storage
        await deleteFromStorage(file.storage_path);

        // Step 2: Delete from database (this will cascade delete permissions)
        await deleteFile(file.id);

        // Step 3: Log activity
        await createActivityLog({
            userId: userId,
            action: 'file_deleted',
            fileId: file.id,
            details: `Deleted file: ${file.name}`,
        });

        return { success: true };
    } catch (error) {
        console.error('Delete error:', error);
        throw new Error(error.message || 'Failed to delete file');
    }
}

/**
 * Prompt user for password with modal
 * @param {string} action - Action being performed (e.g., 'download', 'decrypt')
 * @returns {Promise<string>} Password entered by user
 */
export function promptForPassword(action = 'decrypt') {
    return new Promise((resolve, reject) => {
        const password = window.prompt(
            `Enter password to ${action} this file:`,
            ''
        );

        if (password === null) {
            reject(new Error('Password prompt cancelled'));
        } else if (password.trim() === '') {
            reject(new Error('Password cannot be empty'));
        } else {
            resolve(password);
        }
    });
}
