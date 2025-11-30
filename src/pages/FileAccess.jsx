import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { retrieveFromIPFS } from '../services/ipfsStorage'
import { retrieveFromLocalStorage } from '../services/simpleStorage'
import { supabase } from '../services/supabase'
import LoadingSpinner from '../components/LoadingSpinner'

const FileAccess = () => {
  const { fileId } = useParams()
  const [searchParams] = useSearchParams()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fileContent, setFileContent] = useState(null)
  const [selectedFormat, setSelectedFormat] = useState('jpeg')
  const [showFormatDropdown, setShowFormatDropdown] = useState(false)
  const [converting, setConverting] = useState(false)
  const token = searchParams.get('token')
  const expires = searchParams.get('expires')

  useEffect(() => {
    loadFile()
  }, [fileId])

  const loadFile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if link has expired
      if (expires && Date.now() > parseInt(expires)) {
        setError('This share link has expired for security reasons.')
        return
      }

      // First try to find file in localStorage
      const localFileData = localStorage.getItem(fileId)
      if (localFileData) {
        try {
          const fileRecord = JSON.parse(localFileData)
          setFile({
            id: fileRecord.id,
            name: fileRecord.fileName,
            type: fileRecord.mimeType,
            size: fileRecord.size,
            storage_type: 'localStorage'
          })
          
          // Load the actual file content
          const content = await retrieveFromLocalStorage(fileId)
          if (content) {
            setFileContent(content)
          }
          return
        } catch (parseError) {
          console.warn('Failed to parse localStorage file:', parseError)
        }
      }

      // Try to find in Supabase database
      try {
        const { data: fileRecord, error: dbError } = await supabase
          .from('files')
          .select('*')
          .eq('id', fileId)
          .single()

        if (fileRecord && !dbError) {
          setFile(fileRecord)
          
          // Load file content based on storage type
          let content = null
          if (fileRecord.storage_type === 'ipfs' && fileRecord.ipfs_cid) {
            content = await retrieveFromIPFS(fileRecord.ipfs_cid)
          } else if (fileRecord.storage_type === 'localStorage') {
            content = await retrieveFromLocalStorage(fileId)
          }
          
          if (content) {
            setFileContent(content)
          }
          return
        }
      } catch (dbError) {
        console.warn('Database access failed:', dbError)
      }

      // If no file found anywhere
      setError('File not found or access has been revoked.')
      
    } catch (error) {
      console.error('Error loading file:', error)
      setError('Failed to load file. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (format = selectedFormat) => {
    if (!fileContent || !file) return

    try {
      setConverting(true)
      let finalBlob
      let finalFileName = file.name

      // Convert file if needed
      if (file.type?.startsWith('image/') && format !== 'original') {
        const convertedResult = await convertImageFormat(fileContent, file.type, format)
        if (convertedResult.success) {
          finalBlob = convertedResult.blob
          finalFileName = changeFileExtension(file.name, format)
        } else {
          console.error('Conversion failed:', convertedResult.error)
          // Fallback to original format if conversion fails
          if (fileContent instanceof ArrayBuffer || fileContent instanceof Uint8Array) {
            finalBlob = new Blob([fileContent], { type: file.type })
          } else if (typeof fileContent === 'string') {
            // Handle base64 string
            const byteCharacters = atob(fileContent)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            finalBlob = new Blob([byteArray], { type: file.type })
          } else {
            finalBlob = new Blob([fileContent], { type: file.type })
          }
          finalFileName = file.name
          alert(`⚠️ Format conversion failed. Downloading as original ${file.type} format.`)
        }
      } else {
        // Handle original format download properly
        if (fileContent instanceof ArrayBuffer || fileContent instanceof Uint8Array) {
          finalBlob = new Blob([fileContent], { type: file.type })
        } else if (typeof fileContent === 'string') {
          // Handle base64 string
          const byteCharacters = atob(fileContent)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          finalBlob = new Blob([byteArray], { type: file.type })
        } else {
          finalBlob = new Blob([fileContent], { type: file.type })
        }
      }

      const url = URL.createObjectURL(finalBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = finalFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Track download count
      await trackDownload(format)
      
      // Show download success message
      setError(null)
      alert(`✅ File downloaded successfully as ${format.toUpperCase()}!`)
      setShowFormatDropdown(false)
    } catch (error) {
      console.error('Download failed:', error)
      alert('❌ Download failed. Please try again.')
    } finally {
      setConverting(false)
    }
  }

  const convertImageFormat = async (fileContent, originalType, targetFormat) => {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
          try {
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)
            
            const mimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`
            const quality = targetFormat === 'jpeg' || targetFormat === 'jpg' ? 0.9 : undefined
            
            canvas.toBlob((blob) => {
              if (blob) {
                resolve({ success: true, blob })
              } else {
                resolve({ success: false, error: 'Canvas conversion failed' })
              }
            }, mimeType, quality)
          } catch (canvasError) {
            console.error('Canvas processing error:', canvasError)
            resolve({ success: false, error: 'Canvas processing failed' })
          }
        }
        
        img.onerror = (imgError) => {
          console.error('Image load error:', imgError)
          resolve({ success: false, error: 'Failed to load image for conversion' })
        }
        
        // Create proper image data URL from file content
        if (fileContent instanceof ArrayBuffer || fileContent instanceof Uint8Array) {
          // Handle binary data
          const byteArray = new Uint8Array(fileContent)
          const base64String = btoa(String.fromCharCode(...byteArray))
          img.src = `data:${originalType};base64,${base64String}`
        } else if (typeof fileContent === 'string') {
          // Handle base64 string
          if (fileContent.startsWith('data:')) {
            img.src = fileContent
          } else {
            img.src = `data:${originalType};base64,${fileContent}`
          }
        } else {
          // Handle as blob
          const blob = new Blob([fileContent], { type: originalType })
          img.src = URL.createObjectURL(blob)
        }
        
      } catch (error) {
        console.error('Image conversion setup error:', error)
        resolve({ success: false, error: error.message })
      }
    })
  }

  const changeFileExtension = (filename, newFormat) => {
    const lastDot = filename.lastIndexOf('.')
    if (lastDot !== -1) {
      return filename.substring(0, lastDot + 1) + newFormat
    }
    return filename + '.' + newFormat
  }

  const getAvailableFormats = () => {
    if (!file?.type?.startsWith('image/')) {
      return [{ value: 'original', label: 'Original Format' }]
    }
    
    return [
      { value: 'jpeg', label: 'JPEG (.jpg)' },
      { value: 'png', label: 'PNG (.png)' },
      { value: 'webp', label: 'WebP (.webp)' },
      { value: 'original', label: 'Original Format' }
    ]
  }

  const trackDownload = async (format = 'original') => {
    try {
      // Update download count in Supabase if file exists in database
      if (file?.id && !file.id.startsWith('local_')) {
        const { error } = await supabase
          .from('files')
          .update({ 
            download_count: (file.download_count || 0) + 1,
            last_downloaded: new Date().toISOString()
          })
          .eq('id', file.id)

        if (error) {
          console.warn('Failed to update download count in database:', error)
        }

        // Track individual download in download_logs table
        const { error: logError } = await supabase
          .from('download_logs')
          .insert({
            file_id: file.id,
            download_format: format,
            user_ip: null, // Will be handled by server
            user_agent: navigator.userAgent.substring(0, 255)
          })

        if (logError) {
          console.warn('Failed to log download:', logError)
        }
      }

      // Also track in localStorage for local files
      const downloadLog = JSON.parse(localStorage.getItem('download_log') || '{}')
      downloadLog[file.id] = (downloadLog[file.id] || 0) + 1
      localStorage.setItem('download_log', JSON.stringify(downloadLog))
      
    } catch (error) {
      console.warn('Failed to track download:', error)
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
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6">
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to SecureVault
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xl font-bold text-gray-900">SecureVault</span>
            </div>
            <div className="text-sm text-gray-500">
              Shared File Access
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* File Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {file?.type?.startsWith('image/') ? (
                  <svg className="h-12 w-12 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 3h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm0 2v14h14V5H5z"/>
                  </svg>
                ) : file?.type?.includes('pdf') ? (
                  <svg className="h-12 w-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 3V1h10v2h4v18H3V3h4zM5 5v14h14V5H5z"/>
                  </svg>
                ) : (
                  <svg className="h-12 w-12 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 3L3 13v8h8l10-10V3h-8z"/>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-gray-900">{file?.name}</h1>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file?.size)} • Shared securely via SecureVault
                </p>
              </div>
            </div>
          </div>

          {/* File Content */}
          <div className="px-6 py-6">
            {file?.type?.startsWith('image/') && fileContent ? (
              <div className="text-center">
                <img
                  src={`data:${file.type};base64,${btoa(String.fromCharCode(...new Uint8Array(fileContent)))}`}
                  alt={file.name}
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-sm border border-gray-200"
                />
                <p className="mt-4 text-sm text-gray-500">Click download to save this image</p>
              </div>
            ) : file?.type?.startsWith('video/') && fileContent ? (
              <div className="text-center">
                <video 
                  controls 
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-sm border border-gray-200"
                >
                  <source 
                    src={`data:${file.type};base64,${btoa(String.fromCharCode(...new Uint8Array(fileContent)))}`} 
                    type={file.type} 
                  />
                  Your browser does not support video playback.
                </video>
                <p className="mt-4 text-sm text-gray-500">Click download to save this video</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  {file?.type?.includes('pdf') ? (
                    <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 3V1h10v2h4v18H3V3h4zM5 5v14h14V5H5z"/>
                    </svg>
                  ) : file?.type?.includes('text') ? (
                    <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                    </svg>
                  ) : (
                    <svg className="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 9h5.5L13 3.5V9M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2z"/>
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900">{file?.name}</h3>
                <p className="mt-2 text-gray-600">
                  {formatFileSize(file?.size)} • Ready for secure download
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>End-to-end encrypted</span>
              </div>
              
              {/* Download Button with Format Options */}
              <div className="relative inline-flex">
                {getAvailableFormats().length > 1 ? (
                  <div className="flex">
                    <button
                      onClick={() => downloadFile(selectedFormat)}
                      disabled={!fileContent || converting}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-l-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {converting ? (
                        <>
                          <svg className="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Converting...
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                          Download as {selectedFormat.toUpperCase()}
                        </>
                      )}
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                        disabled={!fileContent || converting}
                        className="inline-flex items-center px-2 py-2 border border-l-0 border-transparent shadow-sm text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Format Dropdown */}
                      {showFormatDropdown && (
                        <div className="absolute right-0 bottom-full mb-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                          <div className="py-1">
                            {getAvailableFormats().map((format) => (
                              <button
                                key={format.value}
                                onClick={() => {
                                  setSelectedFormat(format.value)
                                  setShowFormatDropdown(false)
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                  selectedFormat === format.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                }`}
                              >
                                {format.label}
                                {selectedFormat === format.value && (
                                  <svg className="inline-block ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => downloadFile('original')}
                    disabled={!fileContent || converting}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    Download File
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-sm text-yellow-700">
              <p className="font-medium">Security Notice</p>
              <p>This file has been shared securely using end-to-end encryption. The share link will expire automatically for security. No account required to access.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              SecureVault
            </a>{' '}
            - Your files, your control.
          </p>
        </div>
      </div>
    </div>
  )
}

export default FileAccess