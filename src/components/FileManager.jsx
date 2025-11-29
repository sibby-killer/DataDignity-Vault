import React, { useState, useEffect } from 'react'
import { getSharedFiles, uploadFileRecord, uploadFile, deleteFileFromStorage } from '../services/supabase'
import { registerFile, generateFileHash } from '../services/blockchain'
import { scanForBreaches, categorizeFile } from '../services/gemini'
import UploadModal from './UploadModal'
import ShareModal from './ShareModal'
import SocialShare from './SocialShare'
import { revokeFileAccess, destroyFile } from '../services/fileRevocation'
import LoadingSpinner from './LoadingSpinner'

const FileManager = ({ user, walletAddress, onToast }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [socialShareOpen, setSocialShareOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showActionMenu, setShowActionMenu] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date') // 'date', 'name', 'size'
  const [filterType, setFilterType] = useState('all') // 'all', 'images', 'documents', etc.

  useEffect(() => {
    loadFiles()
  }, [user])

  const loadFiles = async () => {
    try {
      if (!user) return
      
      const userFiles = await getSharedFiles(user.id)
      setFiles(userFiles || [])
    } catch (error) {
      console.error('Error loading files:', error)
      onToast('Failed to load files', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file, password = '') => {
    try {
      // Generate unique file path
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const filePath = `${user.id}/${fileName}`

      // Upload file to Supabase storage
      const uploadResult = await uploadFile(filePath, file)
      if (!uploadResult) {
        throw new Error('Failed to upload file to storage')
      }

      // Get file info
      const fileHash = await generateFileHash(file)
      
      // AI analysis
      let securityAnalysis = null
      let category = null
      
      try {
        securityAnalysis = await scanForBreaches(file.name, file.size, file.type)
        category = await categorizeFile(file.name, file.type, file.size)
      } catch (aiError) {
        console.warn('AI analysis failed:', aiError)
      }

      // Create file record
      const fileRecord = {
        name: file.name,
        original_name: file.name,
        size: file.size,
        type: file.type,
        storage_path: filePath,
        hash: fileHash,
        owner_id: user.id,
        password: password || null,
        category: category?.category || 'Unknown',
        tags: category?.suggestedTags || [],
        security_scan: securityAnalysis,
        created_at: new Date().toISOString()
      }

      const dbResult = await uploadFileRecord(fileRecord)
      if (!dbResult) {
        throw new Error('Failed to save file record')
      }

      // Try to register on blockchain if wallet connected
      if (walletAddress && fileHash) {
        try {
          await registerFile(fileHash, file.name, file.size)
          onToast('File uploaded and registered on blockchain!', 'success')
        } catch (blockchainError) {
          console.warn('Blockchain registration failed:', blockchainError)
          onToast('File uploaded successfully (blockchain registration skipped)', 'warning')
        }
      } else {
        onToast('File uploaded successfully!', 'success')
      }

      // Reload files
      await loadFiles()
      setUploadModalOpen(false)

    } catch (error) {
      console.error('Upload error:', error)
      onToast(`Upload failed: ${error.message}`, 'error')
    }
  }

  const handleShare = (file) => {
    setSelectedFile(file)
    setShareModalOpen(true)
    setShowActionMenu(null)
  }

  const handleSocialShare = (file) => {
    setSelectedFile(file)
    setSocialShareOpen(true)
    setShowActionMenu(null)
  }

  const handleRevoke = async (file) => {
    if (!confirm(`Revoke access to "${file.name}"? This will make the file inaccessible to everyone who received it.`)) return

    try {
      await revokeFileAccess(file.id, user.id)
      onToast('File access revoked successfully', 'success')
      await loadFiles()
    } catch (error) {
      console.error('Revoke error:', error)
      onToast('Failed to revoke file access', 'error')
    }
    setShowActionMenu(null)
  }

  const handleDestroy = async (file) => {
    if (!confirm(`Permanently destroy "${file.name}"? This action cannot be undone and will delete the file completely.`)) return

    try {
      await destroyFile(file.id, user.id, file.storage_path)
      onToast('File destroyed successfully', 'success')
      await loadFiles()
    } catch (error) {
      console.error('Destroy error:', error)
      onToast('Failed to destroy file', 'error')
    }
    setShowActionMenu(null)
  }

  const handleDelete = async (file) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return

    try {
      // Delete from storage
      await deleteFileFromStorage(file.storage_path)
      
      // Remove from local state
      setFiles(files.filter(f => f.id !== file.id))
      onToast('File deleted successfully', 'success')
    } catch (error) {
      console.error('Delete error:', error)
      onToast('Failed to delete file', 'error')
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
    const extension = fileName?.split('.').pop()?.toLowerCase()
    
    if (fileType?.startsWith('image/')) {
      return (
        <svg className="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 3h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm0 2v14h14V5H5z"/>
        </svg>
      )
    }
    
    switch (extension) {
      case 'pdf':
        return (
          <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 3V1h10v2h4v18H3V3h4zM5 5v14h14V5H5z"/>
          </svg>
        )
      case 'doc':
      case 'docx':
        return (
          <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 2h12l4 4v16H6V2zm0 2v16h12V8l-4-4H6z"/>
          </svg>
        )
      default:
        return (
          <svg className="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 3L3 13v8h8l10-10V3h-8z"/>
          </svg>
        )
    }
  }

  const generateThumbnail = (file) => {
    if (file.type?.startsWith('image/')) {
      // For images, we can create a data URL for preview
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(file)
      })
    }
    return null
  }

  const filteredAndSortedFiles = files
    .filter(file => {
      if (filterType === 'all') return true
      if (filterType === 'images') return file.type?.startsWith('image/')
      if (filterType === 'documents') return file.type?.includes('document') || file.name?.endsWith('.pdf')
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'size':
          return (b.size || 0) - (a.size || 0)
        case 'date':
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Files</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your secure files and share them safely
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Upload File
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Files</option>
            <option value="images">Images</option>
            <option value="documents">Documents</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>

        {/* View Mode */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Files Display */}
      {filteredAndSortedFiles.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading a file.</p>
          <div className="mt-6">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Upload your first file
            </button>
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
          : 'space-y-2'
        }>
          {filteredAndSortedFiles.map((file) => (
            <div key={file.id} className={viewMode === 'grid' 
              ? 'bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
              : 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center space-x-4'
            }>
              {viewMode === 'grid' ? (
                <>
                  {/* Thumbnail */}
                  <div className="file-thumbnail">
                    {file.type?.startsWith('image/') ? (
                      <img 
                        src={`data:${file.type};base64,${file.preview || ''}`}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-t-lg"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className="flex items-center justify-center" style={{ display: file.type?.startsWith('image/') ? 'none' : 'flex' }}>
                      {getFileIcon(file.name, file.type)}
                    </div>
                  </div>
                  
                  {/* File Info */}
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                    
                    {/* Actions */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleShare(file)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          📧 Email
                        </button>
                        <button
                          onClick={() => handleSocialShare(file)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          📱 Social
                        </button>
                      </div>
                      <div className="relative action-menu-container">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === file.id ? null : file.id)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {/* Action Menu */}
                        {showActionMenu === file.id && (
                          <div className="absolute right-0 top-6 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleRevoke(file)}
                                className="flex items-center px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 w-full text-left"
                              >
                                <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                </svg>
                                Revoke Access
                              </button>
                              <button
                                onClick={() => handleDestroy(file)}
                                className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                              >
                                <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Destroy File
                              </button>
                              <button
                                onClick={() => handleDelete(file)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                              >
                                <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Locally
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* List view */}
                  <div className="flex-shrink-0">
                    {getFileIcon(file.name, file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    <button
                      onClick={() => handleShare(file)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      📧 Email
                    </button>
                    <button
                      onClick={() => handleSocialShare(file)}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      📱 Social
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === file.id ? null : file.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      
                      {/* Action Menu */}
                      {showActionMenu === file.id && (
                        <div className="absolute right-0 top-6 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleRevoke(file)}
                              className="flex items-center px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 w-full text-left"
                            >
                              <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              </svg>
                              Revoke Access
                            </button>
                            <button
                              onClick={() => handleDestroy(file)}
                              className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                            >
                              <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Destroy File
                            </button>
                            <button
                              onClick={() => handleDelete(file)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                            >
                              <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete Locally
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {uploadModalOpen && (
        <UploadModal
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUpload}
          user={user}
          walletAddress={walletAddress}
        />
      )}

      {shareModalOpen && selectedFile && (
        <ShareModal
          file={selectedFile}
          onClose={() => {
            setShareModalOpen(false)
            setSelectedFile(null)
          }}
          user={user}
          onToast={onToast}
        />
      )}

      {socialShareOpen && selectedFile && (
        <SocialShare
          file={selectedFile}
          onClose={() => {
            setSocialShareOpen(false)
            setSelectedFile(null)
          }}
          onToast={onToast}
        />
      )}
    </div>
  )
}

export default FileManager