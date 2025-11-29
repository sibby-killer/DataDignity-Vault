// Email Service for DataDignity Vault
// Handles email validation, availability checking, and notifications

import { supabase } from './supabase'

// Check if email is already registered in the system
export const checkEmailAvailability = async (email) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    if (error && error.code === 'PGRST116') {
      // No user found - email is available for sharing
      return { 
        isRegistered: false, 
        canShare: true,
        message: 'Recipient will receive a secure access link via email'
      }
    }

    if (data) {
      // User exists in system
      return { 
        isRegistered: true, 
        canShare: true,
        message: `${email} is a registered user - they can access via their account`
      }
    }

    return { isRegistered: false, canShare: true }
  } catch (error) {
    console.error('Email check error:', error)
    return { 
      isRegistered: false, 
      canShare: true,
      message: 'Unable to verify email - sharing will still work'
    }
  }
}

// Validate email format
export const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate simple, clean email notifications
export const generateShareNotification = (fileName, accessUrl, expiryDate, senderName) => {
  const subject = `Secure file shared with you`
  
  const body = `Hi there,

Someone has shared a secure file with you through DataDignity Vault.

File: ${fileName}
Expires: ${new Date(expiryDate).toLocaleDateString()}

Access your file: ${accessUrl}

This link is secure and only works for you. Access will expire automatically.

Questions? Just reply to this email.

DataDignity Vault
Your files, your control, your dignity.`

  return { subject, body }
}

// Generate revocation notification
export const generateRevocationNotification = (senderName) => {
  const subject = `File access revoked`
  
  const body = `Hi,

Your access to a secure file has been revoked by the sender.

You can no longer view or download this file. This action was taken for security reasons.

If you have questions, please contact the person who originally shared the file with you.

DataDignity Vault`

  return { subject, body }
}

// Generate emergency lockdown notification
export const generateLockdownNotification = (filesCount) => {
  const subject = `Emergency lockdown - File access revoked`
  
  const body = `Hi,

An emergency lockdown has been activated and your access to ${filesCount} secure file(s) has been revoked immediately.

You can no longer view or download these files. This action was taken for safety and security reasons.

If you have questions, please contact the person who originally shared the files with you.

DataDignity Vault`

  return { subject, body }
}

// Send email notification (simplified - in production use a service like Resend)
export const sendEmailNotification = async (to, subject, body) => {
  try {
    console.log('📧 Email notification:')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Body:', body)
    console.log('---')
    
    // In production, integrate with email service:
    // - Resend (https://resend.com)
    // - SendGrid
    // - Amazon SES
    // - Mailgun
    
    // For demo, just log the email
    return { success: true, messageId: 'demo_' + Date.now() }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

// Create preview link for images (public access without account)
export const generatePreviewLink = (fileId, fileName, fileType) => {
  if (!fileType?.startsWith('image/')) {
    return null
  }
  
  // Generate preview URL
  const previewUrl = `${window.location.origin}/preview/${fileId}`
  
  return previewUrl
}

export default {
  checkEmailAvailability,
  validateEmailFormat,
  generateShareNotification,
  generateRevocationNotification,
  generateLockdownNotification,
  sendEmailNotification,
  generatePreviewLink
}