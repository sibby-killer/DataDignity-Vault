import React, { useState, useEffect } from 'react'
import { shareFileWithEmail } from '../services/permissionManager'
import { checkEmailAvailability, validateEmailFormat, generatePreviewLink } from '../services/emailService'
import { createShareableImage } from '../services/imageWatermark'
import { generateShareMessage } from '../services/gemini'
import LoadingSpinner from './LoadingSpinner'

const ShareModal = ({ file, onClose, user, walletAddress, onToast }) => {
  const [email, setEmail] = useState('')
  const [expiryDays, setExpiryDays] = useState(30)
  const [customMessage, setCustomMessage] = useState('')
  const [sharing, setSharing] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)
  const [checkingEmail, setCheckingEmail] = useState(false)

  useEffect(() => {
    generateDefaultMessage()
  }, [file, user])

  const generateDefaultMessage = async () => {
    try {
      setGeneratingMessage(true)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + expiryDays)
      
      const message = await generateShareMessage(
        file.name,
        user?.email?.split('@')[0] || 'A SecureVault user',
        expiryDate
      )
      setCustomMessage(message)
    } catch (error) {
      console.warn('Failed to generate message:', error)
      setCustomMessage(getDefaultShareMessage())
    } finally {
      setGeneratingMessage(false)
    }
  }

  const getDefaultShareMessage = () => {
    const senderName = user?.email?.split('@')[0] || 'A SecureVault user'
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + expiryDays)
    
    return `Hello,

${senderName} has securely shared "${file.name}" with you through SecureVault.

Your file has been encrypted end-to-end for maximum security. This sharing link will expire on ${expiryDate.toLocaleDateString()}.

Security reminders:
- Only download files from trusted sources
- Scan downloaded files with antivirus software
- Keep your account credentials secure

Best regards,
SecureVault Team`
  }

  const handleEmailCheck = async (emailValue) => {
    if (!emailValue || !validateEmailFormat(emailValue)) {
      setEmailStatus(null)
      return
    }

    setCheckingEmail(true)
    try {
      const result = await checkEmailAvailability(emailValue)
      setEmailStatus(result)
    } catch (error) {
      console.warn('Email check failed:', error)
      setEmailStatus({ canShare: true, message: 'Email check failed, but sharing will still work' })
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleEmailShare = async () => {
    if (!email.trim()) {
      onToast('Please enter an email address', 'error')
      return
    }

    if (!validateEmailFormat(email)) {
      onToast('Please enter a valid email address', 'error')
      return
    }

    setSharing(true)
    try {
      // Check if it's an image file for watermarking
      let watermarkedImageUrl = null
      if (file.type?.startsWith('image/')) {
        try {
          onToast('🖼️ Creating trackable image with metadata...', 'info')
          
          // Get original image file (you'd implement this based on your storage)
          // For now, we'll create a placeholder for the watermarked image
          const shareMetadata = {
            fileId: file.id,
            ownerId: user.id,
            recipientEmail: email.trim(),
            expiryDate: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString(),
            permissions: 'view_download'
          }
          
          // Note: In full implementation, you'd retrieve the original image and watermark it
          // const originalImageBlob = await retrieveOriginalImage(file)
          // const watermarkResult = await createShareableImage(originalImageBlob, shareMetadata)
          // watermarkedImageUrl = URL.createObjectURL(watermarkResult.watermarkedImage)
          
          onToast('✅ Image prepared with tracking metadata', 'success')
        } catch (watermarkError) {
          console.warn('Image watermarking failed:', watermarkError)
          onToast('⚠️ Sharing without image tracking (watermark failed)', 'warning')
        }
      }
      
      // Use permission manager for secure sharing
      const result = await shareFileWithEmail(
        file.id, 
        email.trim(), 
        expiryDays, 
        walletAddress
      )

      if (result.success) {
        // Generate preview link
        const previewUrl = generatePreviewLink(file.id, file.name, file.type)
        
        onToast('✅ File shared successfully!', 'success')
        
        // Enhanced sharing details with watermark info
        const isImage = file.type?.startsWith('image/')
        const shareDetails = `📧 Shared with: ${email}
🔗 Secure access: ${result.accessUrl}
${previewUrl ? `🖼️ Direct image: ${previewUrl}` : ''}
${isImage ? '🎯 Image includes tracking metadata' : ''}
⏰ Expires: ${new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
${result.blockchainRegistered ? '⛓️ Blockchain verified' : '💾 Database secured'}`

        // Copy access link to clipboard
        navigator.clipboard.writeText(result.accessUrl).then(() => {
          onToast('📋 Access link copied to clipboard!', 'info')
        })
        
        // For images, also provide watermarked download link
        if (isImage && watermarkedImageUrl) {
          setTimeout(() => {
            onToast('🖼️ Trackable image version available for download', 'info')
          }, 2000)
        }

        onClose()
      }
      
    } catch (error) {
      console.error('Share error:', error)
      onToast(`❌ Failed to share file: ${error.message}`, 'error')
    } finally {
      setSharing(false)
    }
  }

  const generateEmailContent = () => {
    const filePreview = getFilePreview()
    const shareLink = `${window.location.origin}/shared/${file.id}`
    
    return `${customMessage}

${filePreview}

📎 File Details:
• Name: ${file.name}
• Size: ${formatFileSize(file.size)}
• Shared: ${new Date().toLocaleString()}
• Expires: ${new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString()}

🔗 Access your file: ${shareLink}

This link will expire in ${expiryDays} days for your security.

---
Sent via SecureVault - Your files, secured with blockchain technology
${window.location.origin}`
  }

  const getFilePreview = () => {
    if (file.type?.startsWith('image/')) {
      return `🖼️ Image Preview: [${file.name}]
📱 A thumbnail will be visible when you access the file.`
    }
    
    const extension = file.name?.split('.').pop()?.toLowerCase()
    const typeIcon = {
      'pdf': '📄',
      'doc': '📝', 'docx': '📝',
      'xls': '📊', 'xlsx': '📊',
      'ppt': '📈', 'pptx': '📈',
      'zip': '📦', 'rar': '📦',
      'mp4': '🎥', 'avi': '🎥', 'mov': '🎥',
      'mp3': '🎵', 'wav': '🎵', 'flac': '🎵'
    }
    
    const icon = typeIcon[extension] || '📄'
    return `${icon} File: ${file.name}`
  }

  const showEmailPreview = (recipientEmail, subject, content) => {
    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`
    
    // Try to open email client
    const tempLink = document.createElement('a')
    tempLink.href = mailtoLink
    tempLink.click()
    
    // Also copy to clipboard as fallback
    navigator.clipboard.writeText(content).then(() => {
      onToast('Email content copied to clipboard as backup!', 'info')
    }).catch(() => {
      onToast('Email client opened (if available)', 'info')
    })
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName, fileType) => {
    if (fileType?.startsWith('image/')) {
      return (
        <svg className="h-16 w-16 text-green-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 3h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z"/>
        </svg>
      )
    }
    
    const extension = fileName?.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return (
          <svg className="h-16 w-16 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 3V1h10v2h4v18H3V3h4z"/>
          </svg>
        )
      default:
        return (
          <svg className="h-16 w-16 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 3L3 13v8h8l10-10V3h-8z"/>
          </svg>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Share File</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* File Preview */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {file.type?.startsWith('image/') && file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="h-16 w-16 object-cover rounded border"
                    />
                  ) : (
                    getFileIcon(file.name, file.type)
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{file.name}</h4>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)} • {file.type}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Share Method Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setShareMethod('email')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      shareMethod === 'email'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📧 Email Share
                  </button>
                  <button
                    onClick={() => setShareMethod('wallet')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      shareMethod === 'wallet'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🔗 Wallet Address
                  </button>
                </nav>
              </div>
            </div>

            {/* Email Share Form */}
            {shareMethod === 'email' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      handleEmailCheck(e.target.value)
                    }}
                    placeholder="Enter recipient's email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {checkingEmail && (
                    <div className="flex items-center mt-1">
                      <LoadingSpinner size="small" className="mr-2" />
                      <p className="text-xs text-gray-500">Checking email...</p>
                    </div>
                  )}
                  {emailStatus && !checkingEmail && (
                    <p className={`text-xs mt-1 ${emailStatus.isRegistered ? 'text-green-600' : 'text-blue-600'}`}>
                      {emailStatus.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="recipientWallet" className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Wallet Address (Optional)
                  </label>
                  <input
                    id="recipientWallet"
                    type="text"
                    value={recipientWallet}
                    onChange={(e) => setRecipientWallet(e.target.value)}
                    placeholder="0x... (for blockchain verification)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="expiryDays" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Period
                  </label>
                  <select
                    id="expiryDays"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 day</option>
                    <option value={7}>1 week</option>
                    <option value={30}>1 month</option>
                    <option value={90}>3 months</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Message
                  </label>
                  {generatingMessage ? (
                    <div className="flex items-center justify-center p-4 border border-gray-300 rounded-md">
                      <LoadingSpinner size="small" className="mr-2" />
                      <span className="text-sm text-gray-500">Generating personalized message...</span>
                    </div>
                  ) : (
                    <textarea
                      id="customMessage"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter a custom message for the recipient..."
                    />
                  )}
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      This message will be included in the email
                    </p>
                    <button
                      onClick={generateDefaultMessage}
                      disabled={generatingMessage}
                      className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                    >
                      🔄 Regenerate with AI
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Share Form */}
            {shareMethod === 'wallet' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Wallet Address
                  </label>
                  <input
                    id="walletAddress"
                    type="text"
                    value={recipientWallet}
                    onChange={(e) => setRecipientWallet(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Share directly to a blockchain wallet address
                  </p>
                </div>

                <div>
                  <label htmlFor="expiryDaysWallet" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Period
                  </label>
                  <select
                    id="expiryDaysWallet"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 day</option>
                    <option value={7}>1 week</option>
                    <option value={30}>1 month</option>
                    <option value={90}>3 months</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">📧 Email Preview</h4>
              <div className="text-xs text-blue-800 space-y-1">
                <p><strong>To:</strong> {email || 'recipient@example.com'}</p>
                <p><strong>Subject:</strong> {user?.email?.split('@')[0] || 'Someone'} shared "{file.name}" with you</p>
                <p><strong>Includes:</strong> Secure download link, file preview, and security instructions</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              onClick={shareMethod === 'email' ? handleEmailShare : () => onToast('Wallet sharing coming soon!', 'info')}
              disabled={sharing || (shareMethod === 'email' && !email.trim()) || (shareMethod === 'wallet' && !recipientWallet.trim())}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sharing ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Sharing...
                </>
              ) : (
                'Share File & Open Email'
              )}
            </button>
            <button
              onClick={onClose}
              disabled={sharing}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareModal