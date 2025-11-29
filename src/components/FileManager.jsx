import React, { useState, useEffect } from 'react'
import { getSharedFiles, uploadFileRecord, uploadFile, deleteFileFromStorage, supabase } from '../services/supabase'
import { registerFile, generateFileHash, isMetaMaskConnected } from '../services/blockchain'
import { initServerWallet, serverRegisterFile, serverShareFile, serverRevokeAccess } from '../services/serverWallet'
import { scanForBreaches, categorizeFile } from '../services/gemini'
import { processFileForUpload } from '../services/encryption'
import { uploadToIPFS } from '../services/ipfsStorage'
import { uploadToFallbackStorage } from '../services/fallbackStorage'
import { uploadToPolygon, initPolygonStorage } from '../services/polygonStorage'
import { uploadToLocalStorage, getLocalStorageFiles } from '../services/simpleStorage'
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
    setLoading(true)
    try {
      let files = []
      
      // Always load from localStorage (works offline)
      const localFiles = getLocalStorageFiles()
      if (localFiles.length > 0) {
        console.log(`📁 Found ${localFiles.length} files in browser storage`)
        files = localFiles
      }
      
      // Try to load from Supabase as well (if available)
      if (user?.id) {
        try {
          const userFiles = await getSharedFiles(user.id)
          if (userFiles && userFiles.length > 0) {
            // Merge with local files (avoid duplicates)
            const localIds = files.map(f => f.id)
            const newSupabaseFiles = userFiles.filter(f => !localIds.includes(f.id))
            files = [...files, ...newSupabaseFiles]
          }
        } catch (supabaseError) {
          console.warn('Supabase unavailable, using local storage only:', supabaseError)
        }
      }

      setFiles(files || [])
      
      if (files.length > 0) {
        onToast(`📁 Loaded ${files.length} file(s)`, 'success')
      }
    } catch (error) {
      console.error('Error loading files:', error)
      onToast('Using offline storage mode', 'info')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file, userPassword = '') => {
    try {
      if (!userPassword) {
        throw new Error('Password required for encryption')
      }

      onToast('🔐 Processing file securely...', 'info')
      
      // STEP 1: CLIENT-SIDE ENCRYPTION (never send unencrypted file)
      const encryptionResult = await processFileForUpload(file, userPassword, user.email)
      const { encryptedFileData, encryptedFileKey, fileHash } = encryptionResult
      
      onToast('✅ File encrypted successfully. Uploading to IPFS...', 'info')

      // STEP 2: UPLOAD ENCRYPTED FILE TO STORAGE (IPFS → Polygon → Fallback)
      let storageResult
      try {
        storageResult = await uploadToIPFS(encryptedFileData, file.name, file.type)
        onToast('📡 File stored on IPFS permanently. Running security analysis...', 'info')
      } catch (ipfsError) {
        console.warn('IPFS upload failed, trying Polygon blockchain storage:', ipfsError)
        onToast('⛓️ IPFS unavailable, storing on Polygon blockchain...', 'info')
        
        try {
          await initPolygonStorage()
          storageResult = await uploadToPolygon(encryptedFileData, file.name, file.type)
          onToast('🎉 File stored on Polygon blockchain permanently! Running security analysis...', 'info')
        } catch (polygonError) {
          console.warn('Polygon storage failed, using localStorage fallback:', polygonError)
          onToast('💾 Using secure browser storage...', 'info')
          
          try {
            storageResult = await uploadToLocalStorage(encryptedFileData, file.name, file.type)
            onToast('✅ File stored securely in browser. Running security analysis...', 'info')
          } catch (localError) {
            console.warn('LocalStorage failed, trying Supabase:', localError)
            storageResult = await uploadToFallbackStorage(encryptedFileData, file.name, file.type)
            onToast('✅ File stored securely. Running security analysis...', 'info')
          }
        }
      }
      
      if (!storageResult.success) {
        throw new Error('Failed to store encrypted file in any storage system')
      }

      // STEP 3: AI SECURITY ANALYSIS (on metadata only, not file content)
      let securityAnalysis = null
      let category = null
      
      try {
        securityAnalysis = await scanForBreaches(file.name, file.size, file.type)
        category = await categorizeFile(file.name, file.type, file.size)
      } catch (aiError) {
        console.warn('AI analysis failed:', aiError)
      }

      // STEP 4: CREATE FILE RECORD WITH METADATA
      const timestamp = Date.now()
      const filePath = `${user.id}/${timestamp}_${file.name}`
      
      const fileRecord = {
        name: file.name,
        original_name: file.name,
        size: file.size,
        type: file.type,
        storage_path: filePath,
        ipfs_cid: storageResult.cid,         // Storage Content Identifier
        ipfs_url: storageResult.url,         // Storage gateway URL
        storage_type: storageResult.storageType || 'unknown', // Track storage type
        hash: fileHash,                   // File hash for blockchain
        owner_id: user.id,
        encrypted_key: encryptedFileKey,  // Store encrypted file key only
        category: category?.category || 'Unknown',
        tags: category?.suggestedTags || [],
        security_scan: securityAnalysis,
        created_at: new Date().toISOString(),
        blockchain_registered: false,
        blockchain_tx_hash: null,
        blockchain_file_id: null
      }

      // Try to save to Supabase, but don't fail if it doesn't work
      let dbResult = null
      try {
        dbResult = await uploadFileRecord(fileRecord)
      } catch (dbError) {
        console.warn('Database save failed, file still stored securely:', dbError)
        // Create a mock result for localStorage files
        dbResult = { 
          id: storageResult.cid,
          ...fileRecord 
        }
      }

      // STEP 5: BLOCKCHAIN REGISTRATION (using server wallet)
      let blockchainSuccess = false
      try {
        onToast('⛓️ Registering on Polygon blockchain...', 'info')
        
        // Try server wallet first (no MetaMask required)
        const serverResult = await serverRegisterFile(fileHash, file.name, file.size, user.email)
        
        // Update record with blockchain info
        const { data, error } = await supabase
          .from('files')
          .update({ 
            blockchain_registered: true,
            blockchain_tx_hash: serverResult.transactionHash,
            blockchain_file_id: serverResult.fileId
          })
          .eq('id', dbResult.id)
        
        if (error) {
          console.warn('Failed to update blockchain status:', error)
        }
        
        blockchainSuccess = true
        onToast('🎉 File encrypted, stored on IPFS, and registered on blockchain!', 'success')
        
      } catch (serverError) {
        console.warn('Server blockchain registration failed, trying MetaMask fallback:', serverError)
        
        // Fallback to MetaMask if available
        if (walletAddress && fileHash) {
          try {
            const blockchainResult = await registerFile(fileHash, file.name, file.size)
            
            const { data, error } = await supabase
              .from('files')
              .update({ 
                blockchain_registered: true,
                blockchain_tx_hash: blockchainResult.transactionHash,
                blockchain_file_id: blockchainResult.fileId
              })
              .eq('id', dbResult.id)
            
            blockchainSuccess = true
            onToast('🎉 File encrypted, stored on IPFS, and registered on blockchain!', 'success')
          } catch (metaMaskError) {
            console.warn('MetaMask registration also failed:', metaMaskError)
            onToast('✅ File encrypted and stored on IPFS securely (blockchain registration failed)', 'warning')
          }
        } else {
          onToast('✅ File encrypted and stored on IPFS securely (blockchain registration failed)', 'warning')
        }
      }

      // STEP 6: RELOAD FILES AND CLOSE MODAL
      await loadFiles()
      setUploadModalOpen(false)

    } catch (error) {
      console.error('Upload error:', error)
      onToast(`❌ Upload failed: ${error.message}`, 'error')
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
          walletAddress={walletAddress}
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