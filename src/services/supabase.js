/**
 * Supabase client initialization and database operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============= FILE OPERATIONS =============

/**
 * Create new file record in database
 * @param {Object} fileData - File metadata
 * @returns {Promise<Object>}
 */
export async function createFile(fileData) {
    const { data, error } = await supabase
        .from('files')
        .insert([{
            name: fileData.name,
            type: fileData.type,
            size: fileData.size,
            storage_path: fileData.storagePath,
            encrypted_key: fileData.encryptedKey,
            iv: fileData.iv,
            salt: fileData.salt,
            owner_id: fileData.ownerId
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get all files for current user
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getUserFiles(userId) {
    const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get files shared with current user
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getSharedFiles(userId) {
    const { data, error } = await supabase
        .from('permissions')
        .select(`
      *,
      file:files(*)
    `)
        .eq('recipient_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get single file by ID
 * @param {string} fileId - File ID
 * @returns {Promise<Object>}
 */
export async function getFile(fileId) {
    const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete file record
 * @param {string} fileId - File ID
 * @returns {Promise<void>}
 */
export async function deleteFile(fileId) {
    const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

    if (error) throw error;
}

// ============= PERMISSION OPERATIONS =============

/**
 * Grant access to a file
 * @param {Object} permissionData - Permission details
 * @returns {Promise<Object>}
 */
export async function grantPermission(permissionData) {
    const { data, error } = await supabase
        .from('permissions')
        .insert([{
            file_id: permissionData.fileId,
            recipient_id: permissionData.recipientId,
            granted_by: permissionData.grantedBy,
            expires_at: permissionData.expiresAt,
            status: 'active'
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Revoke access to a file
 * @param {string} permissionId - Permission ID
 * @returns {Promise<void>}
 */
export async function revokePermission(permissionId) {
    const { error } = await supabase
        .from('permissions')
        .update({ status: 'revoked', revoked_at: new Date().toISOString() })
        .eq('id', permissionId);

    if (error) throw error;
}

/**
 * Get permissions for a file
 * @param {string} fileId - File ID
 * @returns {Promise<Array>}
 */
export async function getFilePermissions(fileId) {
    const { data, error } = await supabase
        .from('permissions')
        .select(`
      *,
      recipient:users!recipient_id(email, wallet_address)
    `)
        .eq('file_id', fileId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Revoke all permissions for user (lockdown)
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of permissions revoked
 */
export async function revokeAllPermissions(userId) {
    const { data, error } = await supabase
        .from('permissions')
        .update({
            status: 'revoked',
            revoked_at: new Date().toISOString(),
            revoke_reason: 'emergency_lockdown'
        })
        .eq('granted_by', userId)
        .eq('status', 'active')
        .select();

    if (error) throw error;
    return data?.length || 0;
}

// ============= ACTIVITY LOG OPERATIONS =============

/**
 * Create activity log entry
 * @param {Object} logData - Log entry data
 * @returns {Promise<Object>}
 */
export async function createActivityLog(logData) {
    const { data, error } = await supabase
        .from('activity_logs')
        .insert([{
            user_id: logData.userId,
            action: logData.action,
            file_id: logData.fileId,
            details: logData.details
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get activity logs for user
 * @param {string} userId - User ID
 * @param {number} limit - Number of logs to fetch
 * @returns {Promise<Array>}
 */
export async function getActivityLogs(userId, limit = 50) {
    const { data, error } = await supabase
        .from('activity_logs')
        .select(`
      *,
      file:files(name)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

// ============= USER OPERATIONS =============

/**
 * Get or create user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>}
 */
export async function updateUserProfile(userId, updates) {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Store encrypted backup key
 * @param {string} userId - User ID
 * @param {Object} backupData - Encrypted backup key data
 * @returns {Promise<void>}
 */
export async function storeBackupKey(userId, backupData) {
    const { error } = await supabase
        .from('users')
        .update({
            backup_key_encrypted: backupData.encryptedKey,
            backup_key_iv: backupData.iv,
            backup_key_salt: backupData.salt
        })
        .eq('id', userId);

    if (error) throw error;
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object>}
 */
export async function getUserByEmail(email) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}
