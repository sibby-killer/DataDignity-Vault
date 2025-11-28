/**
 * Supabase Storage integration for encrypted file storage
 * Uses Supabase Storage (free tier: 1GB) instead of IPFS
 */

import { supabase } from '../services/supabase';

/**
 * Upload encrypted file to Supabase Storage
 * @param {ArrayBuffer} encryptedBlob - Encrypted file data
 * @param {string} fileName - Original file name
 * @param {string} userId - User ID for organizing files
 * @returns {Promise<{path: string, url: string}>}
 */
export async function uploadToStorage(encryptedBlob, fileName, userId) {
    try {
        // Create unique file path
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const filePath = `${userId}/${timestamp}-${randomString}-${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('encrypted-files')
            .upload(filePath, encryptedBlob, {
                contentType: 'application/octet-stream',
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }

        // Get public URL (note: bucket is private, so this requires authentication)
        const { data: urlData } = supabase.storage
            .from('encrypted-files')
            .getPublicUrl(filePath);

        return {
            path: data.path,
            url: urlData.publicUrl
        };
    } catch (error) {
        console.error('Storage upload error:', error);
        throw error;
    }
}

/**
 * Download encrypted file from Supabase Storage
 * @param {string} filePath - File path in storage
 * @returns {Promise<ArrayBuffer>}
 */
export async function downloadFromStorage(filePath) {
    try {
        const { data, error } = await supabase.storage
            .from('encrypted-files')
            .download(filePath);

        if (error) {
            throw new Error(`Download failed: ${error.message}`);
        }

        // Convert Blob to ArrayBuffer
        return await data.arrayBuffer();
    } catch (error) {
        console.error('Storage download error:', error);
        throw error;
    }
}

/**
 * Delete file from Supabase Storage
 * @param {string} filePath - File path in storage
 * @returns {Promise<void>}
 */
export async function deleteFromStorage(filePath) {
    try {
        const { error } = await supabase.storage
            .from('encrypted-files')
            .remove([filePath]);

        if (error) {
            throw new Error(`Delete failed: ${error.message}`);
        }
    } catch (error) {
        console.error('Storage delete error:', error);
        throw error;
    }
}

/**
 * Get storage usage for user
 * @param {string} userId - User ID
 * @returns {Promise<{used: number, limit: number}>}
 */
export async function getStorageUsage(userId) {
    try {
        // List all files for user
        const { data, error } = await supabase.storage
            .from('encrypted-files')
            .list(userId);

        if (error) {
            throw new Error(`Failed to get storage usage: ${error.message}`);
        }

        // Calculate total size
        const totalSize = data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);

        return {
            used: totalSize,
            limit: 1024 * 1024 * 1024 // 1GB free tier limit
        };
    } catch (error) {
        console.error('Storage usage error:', error);
        return { used: 0, limit: 1024 * 1024 * 1024 };
    }
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
