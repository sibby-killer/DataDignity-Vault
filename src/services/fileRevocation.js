// File revocation and access control service
import { supabase } from './supabase'

// Revoke access to a file - makes it inaccessible to all recipients
export const revokeFileAccess = async (fileId, userId) => {
  try {
    const timestamp = new Date().toISOString()
    
    // Update file status to revoked
    const { error: fileError } = await supabase
      .from('files')
      .update({
        status: 'revoked',
        revoked_at: timestamp,
        revoked_by: userId
      })
      .eq('id', fileId)
    
    if (fileError) {
      throw fileError
    }

    // Update all permissions for this file to revoked
    const { error: permError } = await supabase
      .from('permissions')
      .update({
        status: 'revoked',
        revoked_at: timestamp
      })
      .eq('file_id', fileId)
    
    if (permError) {
      throw permError
    }

    // Log the revocation activity
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        file_id: fileId,
        action: 'file_revoked',
        details: { timestamp, reason: 'manual_revocation' },
        created_at: timestamp
      })
    
    if (logError) {
      console.warn('Failed to log revocation activity:', logError)
    }

    return { success: true }
  } catch (error) {
    console.error('Error revoking file access:', error)
    throw error
  }
}

// Destroy file completely - removes from storage and database
export const destroyFile = async (fileId, userId, storagePath) => {
  try {
    const timestamp = new Date().toISOString()

    // Delete from storage first
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([storagePath])
      
      if (storageError) {
        console.warn('Storage deletion warning:', storageError)
      }
    }

    // Delete all permissions
    const { error: permError } = await supabase
      .from('permissions')
      .delete()
      .eq('file_id', fileId)
    
    if (permError) {
      console.warn('Permission deletion warning:', permError)
    }

    // Mark file as destroyed in database (for audit trail)
    const { error: fileError } = await supabase
      .from('files')
      .update({
        status: 'destroyed',
        destroyed_at: timestamp,
        destroyed_by: userId,
        storage_path: null // Remove storage reference
      })
      .eq('id', fileId)
    
    if (fileError) {
      throw fileError
    }

    // Log the destruction activity
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        file_id: fileId,
        action: 'file_destroyed',
        details: { timestamp, reason: 'manual_destruction' },
        created_at: timestamp
      })
    
    if (logError) {
      console.warn('Failed to log destruction activity:', logError)
    }

    return { success: true }
  } catch (error) {
    console.error('Error destroying file:', error)
    throw error
  }
}

// Check if file is accessible (not expired or revoked)
export const isFileAccessible = async (fileId, userId = null) => {
  try {
    const { data: file, error } = await supabase
      .from('files')
      .select('status, expires_at, revoked_at, owner_id')
      .eq('id', fileId)
      .single()
    
    if (error || !file) {
      return false
    }

    // Check if file is revoked or destroyed
    if (file.status === 'revoked' || file.status === 'destroyed') {
      return false
    }

    // Check if file has expired
    if (file.expires_at && new Date(file.expires_at) < new Date()) {
      return false
    }

    // If user provided, check if they have permission
    if (userId) {
      // Owner always has access (unless revoked/destroyed)
      if (file.owner_id === userId) {
        return true
      }

      // Check permissions for non-owners
      const { data: permission, error: permError } = await supabase
        .from('permissions')
        .select('status, expires_at')
        .eq('file_id', fileId)
        .eq('recipient_id', userId)
        .eq('status', 'active')
        .single()
      
      if (permError || !permission) {
        return false
      }

      // Check permission expiry
      if (permission.expires_at && new Date(permission.expires_at) < new Date()) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error checking file accessibility:', error)
    return false
  }
}

// Auto-expire files based on their expiry settings
export const processExpiredFiles = async () => {
  try {
    const now = new Date().toISOString()
    
    // Update expired files
    const { error: fileError } = await supabase
      .from('files')
      .update({ status: 'expired' })
      .lt('expires_at', now)
      .eq('status', 'active')
    
    if (fileError) {
      console.error('Error updating expired files:', fileError)
    }

    // Update expired permissions
    const { error: permError } = await supabase
      .from('permissions')
      .update({ status: 'expired' })
      .lt('expires_at', now)
      .eq('status', 'active')
    
    if (permError) {
      console.error('Error updating expired permissions:', permError)
    }

    return true
  } catch (error) {
    console.error('Error processing expired files:', error)
    return false
  }
}

// Emergency lockdown - revokes all files for a user
export const emergencyLockdown = async (userId, reason = 'emergency') => {
  try {
    const timestamp = new Date().toISOString()

    // Revoke all user's files
    const { error: fileError } = await supabase
      .from('files')
      .update({
        status: 'locked',
        locked_at: timestamp,
        locked_reason: reason
      })
      .eq('owner_id', userId)
    
    if (fileError) {
      throw fileError
    }

    // Revoke all permissions where user is recipient
    const { error: permError } = await supabase
      .from('permissions')
      .update({
        status: 'locked',
        locked_at: timestamp
      })
      .eq('recipient_id', userId)
    
    if (permError) {
      throw permError
    }

    // Log emergency action
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'emergency_lockdown',
        details: { timestamp, reason },
        created_at: timestamp
      })
    
    if (logError) {
      console.warn('Failed to log emergency lockdown:', logError)
    }

    return { success: true }
  } catch (error) {
    console.error('Error during emergency lockdown:', error)
    throw error
  }
}