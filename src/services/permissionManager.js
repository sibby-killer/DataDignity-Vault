// Permission Management System for DataDignity Vault
import { supabase } from './supabase'
import { shareFile as blockchainShare, revokeFileAccess as blockchainRevoke } from './blockchain'
import { serverShareFile, serverRevokeAccess } from './serverWallet'
import { ethers } from 'ethers'

// Convert email to virtual blockchain address
export const emailToVirtualAddress = (email) => {
  try {
    // Use ethers.js to create deterministic address from email
    const hash = ethers.keccak256(ethers.toUtf8Bytes(email.toLowerCase()))
    const address = '0x' + hash.slice(26) // Take last 20 bytes (40 hex chars)
    return address
  } catch (error) {
    console.error('Error converting email to address:', error)
    return null
  }
}

// Generate secure access token for recipients
export const generateAccessToken = (fileId, recipientEmail) => {
  try {
    const data = JSON.stringify({ fileId, email: recipientEmail, timestamp: Date.now() })
    return btoa(data) // Simple base64 encoding for demo
  } catch (error) {
    console.error('Error generating access token:', error)
    return null
  }
}

// Decode access token
export const decodeAccessToken = (token) => {
  try {
    const decoded = JSON.parse(atob(token))
    return decoded
  } catch (error) {
    console.error('Error decoding access token:', error)
    return null
  }
}

// Share file with email recipient (no wallet required for them)
export const shareFileWithEmail = async (fileId, recipientEmail, expiryDays = 30, ownerWalletAddress) => {
  try {
    console.log('📧 Sharing file with email recipient:', recipientEmail)
    
    // Convert email to virtual blockchain address
    const virtualAddress = emailToVirtualAddress(recipientEmail)
    if (!virtualAddress) {
      throw new Error('Failed to generate virtual address for recipient')
    }
    
    // Calculate expiry timestamp
    const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60)
    const expiryDate = new Date(expiryTimestamp * 1000).toISOString()
    
    // Create database permission record
    const permissionData = {
      file_id: fileId,
      recipient_email: recipientEmail.toLowerCase(),
      recipient_virtual_address: virtualAddress,
      granted_by: ownerWalletAddress,
      expires_at: expiryDate,
      status: 'active',
      created_at: new Date().toISOString(),
      blockchain_tx_hash: null
    }
    
    // Store permission in database first
    const { data: permission, error: dbError } = await supabase
      .from('permissions')
      .insert([permissionData])
      .select()
      .single()
    
    if (dbError) {
      console.error('Database permission error:', dbError)
      throw new Error('Failed to create permission record')
    }
    
    // Register permission on blockchain (try server wallet first)
    let blockchainSuccess = false
    try {
      // Try server wallet first (no user wallet required)
      const serverResult = await serverShareFile(fileId, virtualAddress, expiryDays)
      
      // Update permission with blockchain transaction hash
      await supabase
        .from('permissions')
        .update({ blockchain_tx_hash: serverResult.transactionHash })
        .eq('id', permission.id)
      
      blockchainSuccess = true
      console.log('✅ Permission registered on blockchain via server:', serverResult.transactionHash)
      
    } catch (serverError) {
      console.warn('Server blockchain failed, trying user wallet:', serverError)
      
      // Fallback to user's MetaMask wallet if available
      if (ownerWalletAddress) {
        try {
          const blockchainResult = await blockchainShare(fileId, virtualAddress, expiryDays)
          
          await supabase
            .from('permissions')
            .update({ blockchain_tx_hash: blockchainResult.transactionHash })
            .eq('id', permission.id)
          
          blockchainSuccess = true
          console.log('✅ Permission registered on blockchain via MetaMask:', blockchainResult.transactionHash)
        } catch (blockchainError) {
          console.warn('MetaMask blockchain permission failed:', blockchainError)
          // Continue without blockchain - database permission still works
        }
      }
    }
    
    // Generate secure access link
    const accessToken = generateAccessToken(fileId, recipientEmail)
    const accessUrl = `${window.location.origin}/access/${fileId}?token=${accessToken}`
    
    // Send email notification (simplified for demo)
    await sendShareNotification(recipientEmail, accessUrl, expiryDate)
    
    return {
      success: true,
      permission,
      accessUrl,
      virtualAddress,
      blockchainRegistered: blockchainSuccess
    }
  } catch (error) {
    console.error('Share file error:', error)
    throw error
  }
}

// Revoke file access
export const revokeFileAccess = async (fileId, recipientEmail, ownerWalletAddress) => {
  try {
    console.log('🚫 Revoking file access for:', recipientEmail)
    
    // Get permission record
    const { data: permission, error: fetchError } = await supabase
      .from('permissions')
      .select('*')
      .eq('file_id', fileId)
      .eq('recipient_email', recipientEmail.toLowerCase())
      .eq('status', 'active')
      .single()
    
    if (fetchError || !permission) {
      throw new Error('Permission not found or already revoked')
    }
    
    // Update database record
    const { error: updateError } = await supabase
      .from('permissions')
      .update({ 
        status: 'revoked',
        revoked_at: new Date().toISOString()
      })
      .eq('id', permission.id)
    
    if (updateError) {
      throw new Error('Failed to update permission status')
    }
    
    // Revoke on blockchain (try server wallet first)
    let blockchainSuccess = false
    if (permission.recipient_virtual_address) {
      try {
        // Try server wallet first
        const serverResult = await serverRevokeAccess(fileId, permission.recipient_virtual_address)
        blockchainSuccess = true
        console.log('✅ Permission revoked on blockchain via server:', serverResult.transactionHash)
        
      } catch (serverError) {
        console.warn('Server blockchain revocation failed, trying user wallet:', serverError)
        
        // Fallback to user's wallet if available
        if (ownerWalletAddress) {
          try {
            const blockchainResult = await blockchainRevoke(fileId, permission.recipient_virtual_address)
            blockchainSuccess = true
            console.log('✅ Permission revoked on blockchain via MetaMask:', blockchainResult.transactionHash)
          } catch (blockchainError) {
            console.warn('MetaMask blockchain revocation failed:', blockchainError)
          }
        }
      }
    }
    
    // Send revocation notification
    await sendRevocationNotification(recipientEmail)
    
    return {
      success: true,
      blockchainRevoked: blockchainSuccess
    }
  } catch (error) {
    console.error('Revoke access error:', error)
    throw error
  }
}

// Emergency lockdown - revoke ALL access to ALL files
export const emergencyLockdown = async (userId, userWalletAddress) => {
  try {
    console.log('🚨 EMERGENCY LOCKDOWN INITIATED for user:', userId)
    
    // Get all active permissions for user's files
    const { data: userFiles, error: filesError } = await supabase
      .from('files')
      .select('id, name')
      .eq('owner_id', userId)
    
    if (filesError) {
      throw new Error('Failed to fetch user files')
    }
    
    const fileIds = userFiles.map(f => f.id)
    
    // Get all active permissions for these files
    const { data: permissions, error: permError } = await supabase
      .from('permissions')
      .select('*')
      .in('file_id', fileIds)
      .eq('status', 'active')
    
    if (permError) {
      throw new Error('Failed to fetch permissions')
    }
    
    console.log(`🔒 Found ${permissions.length} active permissions to revoke`)
    
    // Revoke all permissions in database
    const lockdownTimestamp = new Date().toISOString()
    const { error: revokeError } = await supabase
      .from('permissions')
      .update({ 
        status: 'emergency_revoked',
        revoked_at: lockdownTimestamp
      })
      .in('file_id', fileIds)
      .eq('status', 'active')
    
    if (revokeError) {
      throw new Error('Failed to revoke permissions in database')
    }
    
    // Revoke on blockchain (batch operation)
    let blockchainResults = []
    if (userWalletAddress && permissions.length > 0) {
      for (const permission of permissions) {
        try {
          if (permission.recipient_virtual_address) {
            const result = await blockchainRevoke(permission.file_id, permission.recipient_virtual_address)
            blockchainResults.push({ success: true, tx: result.transactionHash })
          }
        } catch (blockchainError) {
          console.warn(`Blockchain revocation failed for permission ${permission.id}:`, blockchainError)
          blockchainResults.push({ success: false, error: blockchainError.message })
        }
      }
    }
    
    // Send notifications to all affected recipients
    const uniqueEmails = [...new Set(permissions.map(p => p.recipient_email))]
    for (const email of uniqueEmails) {
      try {
        await sendEmergencyLockdownNotification(email, userFiles.length)
      } catch (notificationError) {
        console.warn(`Failed to notify ${email}:`, notificationError)
      }
    }
    
    // Log lockdown event
    await supabase
      .from('security_events')
      .insert([{
        user_id: userId,
        event_type: 'emergency_lockdown',
        details: {
          files_affected: userFiles.length,
          permissions_revoked: permissions.length,
          blockchain_revocations: blockchainResults.filter(r => r.success).length,
          timestamp: lockdownTimestamp
        }
      }])
    
    return {
      success: true,
      filesAffected: userFiles.length,
      permissionsRevoked: permissions.length,
      blockchainRevocations: blockchainResults.filter(r => r.success).length,
      notifications: uniqueEmails.length
    }
  } catch (error) {
    console.error('Emergency lockdown error:', error)
    throw error
  }
}

// Check if user has access to file
export const checkFileAccess = async (fileId, accessToken) => {
  try {
    // Decode access token
    const tokenData = decodeAccessToken(accessToken)
    if (!tokenData) {
      return { hasAccess: false, reason: 'Invalid access token' }
    }
    
    const { email } = tokenData
    
    // Check database permission
    const { data: permission, error } = await supabase
      .from('permissions')
      .select('*, files(*)')
      .eq('file_id', fileId)
      .eq('recipient_email', email.toLowerCase())
      .eq('status', 'active')
      .single()
    
    if (error || !permission) {
      return { hasAccess: false, reason: 'Permission not found or revoked' }
    }
    
    // Check if permission has expired
    const now = new Date()
    const expiryDate = new Date(permission.expires_at)
    
    if (now > expiryDate) {
      return { hasAccess: false, reason: 'Access has expired' }
    }
    
    return { 
      hasAccess: true, 
      permission,
      file: permission.files
    }
  } catch (error) {
    console.error('Access check error:', error)
    return { hasAccess: false, reason: 'Access check failed' }
  }
}

// Send share notification email (simplified)
const sendShareNotification = async (recipientEmail, accessUrl, expiryDate) => {
  try {
    console.log('📧 Sending share notification to:', recipientEmail)
    console.log('Access URL:', accessUrl)
    console.log('Expires:', expiryDate)
    
    // In production, integrate with email service like Resend, SendGrid, etc.
    // For demo, we'll just log the notification
    
    return { success: true }
  } catch (error) {
    console.error('Email notification error:', error)
    throw error
  }
}

// Send revocation notification
const sendRevocationNotification = async (recipientEmail) => {
  try {
    console.log('🚫 Sending revocation notification to:', recipientEmail)
    return { success: true }
  } catch (error) {
    console.error('Revocation notification error:', error)
    throw error
  }
}

// Send emergency lockdown notification
const sendEmergencyLockdownNotification = async (recipientEmail, filesCount) => {
  try {
    console.log('🚨 Sending emergency lockdown notification to:', recipientEmail)
    console.log('Files affected:', filesCount)
    return { success: true }
  } catch (error) {
    console.error('Emergency notification error:', error)
    throw error
  }
}

export default {
  emailToVirtualAddress,
  shareFileWithEmail,
  revokeFileAccess,
  emergencyLockdown,
  checkFileAccess,
  generateAccessToken,
  decodeAccessToken
}