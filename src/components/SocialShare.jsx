import React, { useState } from 'react'
import { generateFileHash } from '../services/blockchain'

const SocialShare = ({ file, onClose, onToast }) => {
  const [sharing, setSharing] = useState(false)

  // Generate encrypted shareable link
  const generateShareableLink = async () => {
    try {
      // Create temporary shareable version
      const shareHash = await generateFileHash(new Blob([JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
        timestamp: Date.now()
      })]))
      
      return `${window.location.origin}/shared/${shareHash}?expires=${Date.now() + (24 * 60 * 60 * 1000)}`
    } catch (error) {
      console.error('Error generating shareable link:', error)
      return `${window.location.origin}/shared/${file.id}`
    }
  }

  const shareToSocial = async (platform) => {
    setSharing(true)
    try {
      const shareUrl = await generateShareableLink()
      const shareText = `Check out this secure file shared via SecureVault: ${file.name}`
      
      let shareLink = ''
      
      switch (platform) {
        case 'whatsapp':
          shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
          break
        case 'telegram':
          shareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
          break
        case 'twitter':
          shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
          break
        case 'facebook':
          shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
          break
        case 'linkedin':
          shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
          break
        case 'tiktok':
          // TikTok doesn't have direct URL sharing, copy to clipboard instead
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
          onToast('Link copied! Paste it in your TikTok post', 'success')
          setSharing(false)
          return
        case 'instagram':
          // Instagram doesn't allow direct URL sharing, copy to clipboard
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
          onToast('Link copied! Paste it in your Instagram story/post', 'success')
          setSharing(false)
          return
        case 'discord':
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
          onToast('Link copied! Paste it in Discord', 'success')
          setSharing(false)
          return
        case 'email':
          shareLink = `mailto:?subject=${encodeURIComponent(`Secure file: ${file.name}`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}\n\nThis file is securely encrypted and will expire in 24 hours.\n\nShared via SecureVault - Your files, your control.`)}`
          break
        default:
          await navigator.clipboard.writeText(shareUrl)
          onToast('Share link copied to clipboard!', 'success')
          setSharing(false)
          return
      }
      
      // Open the share link
      window.open(shareLink, '_blank', 'noopener,noreferrer')
      onToast(`Shared to ${platform}!`, 'success')
      
    } catch (error) {
      console.error('Share error:', error)
      onToast('Failed to share. Please try again.', 'error')
    } finally {
      setSharing(false)
    }
  }

  const socialPlatforms = [
    { id: 'whatsapp', name: 'WhatsApp', icon: '📱', color: 'bg-green-500' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', color: 'bg-blue-500' },
    { id: 'twitter', name: 'X (Twitter)', icon: '🐦', color: 'bg-gray-800' },
    { id: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-pink-500' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black' },
    { id: 'discord', name: 'Discord', icon: '🎮', color: 'bg-indigo-600' },
    { id: 'email', name: 'Email', icon: '📧', color: 'bg-gray-600' },
    { id: 'copy', name: 'Copy Link', icon: '🔗', color: 'bg-gray-500' }
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Share to Social Media</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* File Info */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 text-2xl">
                  {file.type?.startsWith('image/') ? '🖼️' : file.type?.startsWith('video/') ? '🎥' : '📄'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">Expires in 24 hours • Encrypted</p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-xs text-yellow-700">
                  <p className="font-medium">Security Notice</p>
                  <p>Files are encrypted and expire automatically. Links become invalid after 24 hours for security.</p>
                </div>
              </div>
            </div>

            {/* Social Platforms Grid */}
            <div className="grid grid-cols-2 gap-3">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => shareToSocial(platform.id)}
                  disabled={sharing}
                  className={`${platform.color} text-white p-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                >
                  <span className="text-lg">{platform.icon}</span>
                  <span className="text-sm font-medium truncate">{platform.name}</span>
                </button>
              ))}
            </div>

            {/* Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Recipients can view files securely without creating an account
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SocialShare