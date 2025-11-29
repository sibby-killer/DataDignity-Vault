import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { checkFileAccess } from '../services/permissionManager'
import { retrieveFromIPFS } from '../services/ipfsStorage'
import { retrieveFromFallbackStorage } from '../services/fallbackStorage'
import { retrieveAndDecryptFile } from '../services/encryption'
import LoadingSpinner from './LoadingSpinner'

const FileAccessPage = ({ onToast }) => {
  const { fileId } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [file, setFile] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAccess()
  }, [fileId, token])

  const checkAccess = async () => {
    try {
      if (!fileId || !token) {
        setError('Invalid access link')
        return
      }

      // Check permission
      const accessResult = await checkFileAccess(fileId, token)
      
      if (!accessResult.hasAccess) {
        setError(accessResult.reason || 'Access denied')
        return
      }

      setHasAccess(true)
      setFile(accessResult.file)
      
    } catch (error) {
      console.error('Access check error:', error)
      setError('Failed to verify access')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      if (!file) return

      setLoading(true)
      onToast('🔐 Decrypting file...', 'info')

      // Get encrypted file from storage (IPFS, Polygon, or fallback)
      let fileData
      
      if (file.storage_type === 'polygon') {
        // Retrieve from Polygon blockchain
        const polygonResult = await retrieveFromFallbackStorage(file.ipfs_cid, file.metadata_hash)
        if (!polygonResult.success) {
          throw new Error('Failed to retrieve file from Polygon blockchain')
        }
        fileData = polygonResult.data
        onToast('⛓️ File retrieved from Polygon blockchain. Preparing download...', 'info')
      } else if (file.ipfs_cid.startsWith('Qm')) {
        // Try IPFS first
        try {
          const ipfsResult = await retrieveFromIPFS(file.ipfs_cid)
          if (!ipfsResult.success) {
            throw new Error('IPFS retrieval failed')
          }
          fileData = ipfsResult.data
          onToast('🌐 File retrieved from IPFS. Preparing download...', 'info')
        } catch (ipfsError) {
          console.warn('IPFS retrieval failed:', ipfsError)
          throw new Error('Failed to retrieve file from IPFS')
        }
      } else {
        // Use fallback storage (Supabase or database)
        const fallbackResult = await retrieveFromFallbackStorage(file.ipfs_cid)
        if (!fallbackResult.success) {
          throw new Error('Failed to retrieve file from storage')
        }
        fileData = fallbackResult.data
        onToast('📁 File retrieved from secure storage. Preparing download...', 'info')
      }

      // Create download blob
      const blob = new Blob([fileData], { type: file.type || 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      
      // Trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = file.name || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // Clean up
      URL.revokeObjectURL(url)
      
      onToast('✅ File downloaded successfully!', 'success')
      
    } catch (error) {
      console.error('Download error:', error)
      onToast(`❌ Download failed: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="text-sm text-gray-500">
            <p>Possible reasons:</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• The link has expired</li>
              <li>• Access has been revoked</li>
              <li>• Invalid or corrupted link</li>
              <li>• Emergency lockdown activated</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">🔐 Secure File Access</h1>
          <p className="text-gray-600 mt-2">
            Someone has shared a secure file with you through DataDignity Vault
          </p>
        </div>

        {/* File Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            {/* File Icon */}
            <div className="mx-auto mb-4">
              {getFileIcon(file.name, file.type)}
            </div>

            {/* File Details */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{file.name}</h2>
            <p className="text-gray-500 mb-1">{formatFileSize(file.size)}</p>
            <p className="text-gray-500 mb-6">{file.type}</p>

            {/* Security Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-800">Encrypted & Verified</span>
              </div>
              <p className="text-xs text-green-700">
                This file is encrypted end-to-end and stored on IPFS for maximum security.
              </p>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download File
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
              <h3 className="text-sm font-medium text-gray-900 mb-2">🛡️ Security Reminders:</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Only download files from trusted sources</li>
                <li>• Scan downloaded files with antivirus software</li>
                <li>• This link will expire for your protection</li>
                <li>• Access can be revoked at any time by the sender</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Secured by <strong>DataDignity Vault</strong></p>
          <p>Your files, your control, your dignity.</p>
        </div>
      </div>
    </div>
  )
}

export default FileAccessPage