import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { checkFileAccess } from '../services/permissionManager'
import { retrieveFromIPFS } from '../services/ipfsStorage'
import { retrieveFromFallbackStorage } from '../services/fallbackStorage'
import { retrieveFromLocalStorage } from '../services/simpleStorage'
import LoadingSpinner from '../components/LoadingSpinner'
import Toast from '../components/Toast'

const FileAccess = () => {
  const { fileId } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)

  useEffect(() => {
    checkAccess()
  }, [fileId, token])

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const checkAccess = async () => {
    try {
      setLoading(true)
      
      if (!fileId) {
        setError('File ID not provided')
        return
      }

      // For shared links, check permission with token
      if (token) {
        const accessResult = await checkFileAccess(fileId, token)
        
        if (!accessResult.hasAccess) {
          setError(accessResult.reason || 'Access denied')
          return
        }

        setFile(accessResult.file)
        await loadFileContent(accessResult.file)
      } else {
        // For direct access, try to load from localStorage
        const localFiles = JSON.parse(localStorage.getItem('datadignity_files') || '[]')
        const localFileData = localStorage.getItem(fileId)
        
        if (localFileData) {
          const fileRecord = JSON.parse(localFileData)
          setFile({
            id: fileRecord.id,
            name: fileRecord.fileName,
            type: fileRecord.mimeType,
            size: fileRecord.size,
            storage_type: 'localStorage'
          })
          await loadFileContent({ storage_type: 'localStorage', ipfs_cid: fileId })
        } else {
          setError('File not found or access expired')
        }
      }
    } catch (error) {
      console.error('Access check error:', error)
      setError('Failed to verify access')
    } finally {
      setLoading(false)
    }
  }

  const loadFileContent = async (fileData) => {
    try {
      let fileContent = null

      if (fileData.storage_type === 'localStorage') {
        // Retrieve from browser localStorage
        const result = await retrieveFromLocalStorage(fileData.ipfs_cid)
        if (result.success) {
          fileContent = result.data
          showToast('File loaded from secure browser storage', 'success')
        }
      } else if (fileData.ipfs_cid?.startsWith('Qm')) {
        // Try IPFS first
        try {
          const ipfsResult = await retrieveFromIPFS(fileData.ipfs_cid)
          if (ipfsResult.success) {
            fileContent = ipfsResult.data
            showToast('File loaded from IPFS', 'success')
          }
        } catch (ipfsError) {
          console.warn('IPFS retrieval failed:', ipfsError)
          // Fallback to other storage
          const fallbackResult = await retrieveFromFallbackStorage(fileData.ipfs_cid)
          if (fallbackResult.success) {
            fileContent = fallbackResult.data
            showToast('File loaded from backup storage', 'success')
          }
        }
      } else {
        // Use fallback storage
        const fallbackResult = await retrieveFromFallbackStorage(fileData.ipfs_cid)
        if (fallbackResult.success) {
          fileContent = fallbackResult.data
          showToast('File loaded successfully', 'success')
        }
      }

      if (fileContent) {
        // Create blob URL for preview/download
        const blob = new Blob([fileContent], { type: fileData.type || 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
      } else {
        throw new Error('Failed to load file content')
      }
    } catch (error) {
      console.error('File loading error:', error)
      setError('Failed to load file content')
    }
  }

  const handleDownload = () => {
    if (!downloadUrl || !file) return

    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = file.name || 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showToast('Download started', 'success')
  }

  const getFileIcon = (fileType, fileName) => {
    if (fileType?.startsWith('image/')) {
      return '🖼️'
    } else if (fileType?.includes('pdf')) {
      return '📄'
    } else if (fileType?.startsWith('video/')) {
      return '🎥'
    } else if (fileType?.startsWith('audio/')) {
      return '🎵'
    } else {
      return '📁'
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading secure file...</p>
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
          <div className="mt-6">
            <a
              href="https://secure-vault-rouge.vercel.app/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to SecureVault
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">🔐 SecureVault</h1>
              <span className="ml-4 text-sm text-gray-500">Secure File Access</span>
            </div>
            <a
              href="https://secure-vault-rouge.vercel.app/"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Go to App
            </a>
          </div>
        </div>
      </div>

      {/* File Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            {/* File Icon */}
            <div className="text-6xl mb-4">
              {getFileIcon(file.type, file.name)}
            </div>

            {/* File Details */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">{file.name}</h2>
            <p className="text-gray-500 mb-1">{formatFileSize(file.size)}</p>
            <p className="text-gray-500 mb-6">{file.type}</p>

            {/* Image Preview */}
            {file.type?.startsWith('image/') && downloadUrl && (
              <div className="mb-6">
                <img
                  src={downloadUrl}
                  alt={file.name}
                  className="max-w-full h-auto max-h-96 mx-auto rounded-lg shadow-sm"
                />
              </div>
            )}

            {/* Security Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-800">Encrypted & Verified</span>
              </div>
              <p className="text-xs text-green-700">
                This file is secured with military-grade encryption and accessed through SecureVault's protected sharing system.
              </p>
            </div>

            {/* Download Button */}
            {downloadUrl && (
              <button
                onClick={handleDownload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download File
              </button>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
              <h3 className="text-sm font-medium text-gray-900 mb-2">🛡️ Security Information:</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• This file was shared through SecureVault's encrypted system</li>
                <li>• Access can be revoked at any time by the sender</li>
                <li>• Your access to this file may have an expiry date</li>
                <li>• Download only if you trust the sender</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-gray-500">
        <p>Secured by <strong>SecureVault</strong></p>
        <p>Your files, your control, your dignity.</p>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default FileAccess