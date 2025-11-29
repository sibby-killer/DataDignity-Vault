import React, { useState, useEffect } from 'react'
import { getSharedFiles } from '../services/supabase'
import LoadingSpinner from './LoadingSpinner'

const SharedFiles = ({ user, onToast }) => {
  const [sharedFiles, setSharedFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSharedFiles()
  }, [user])

  const loadSharedFiles = async () => {
    try {
      if (!user) return
      
      const files = await getSharedFiles(user.id)
      // Filter only files shared with the user (not owned by user)
      const shared = files.filter(file => file.shared && file.owner_id !== user.id)
      setSharedFiles(shared)
    } catch (error) {
      console.error('Error loading shared files:', error)
      onToast('Failed to load shared files', 'error')
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
        <svg className="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 3h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z"/>
        </svg>
      )
    }
    
    const extension = fileName?.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return (
          <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 3V1h10v2h4v18H3V3h4z"/>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shared Files</h1>
        <p className="mt-1 text-sm text-gray-500">
          Files that others have shared with you
        </p>
      </div>

      {sharedFiles.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No shared files</h3>
          <p className="mt-1 text-sm text-gray-500">Files shared with you will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sharedFiles.map((file) => (
            <div key={file.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="file-thumbnail">
                {getFileIcon(file.name, file.type)}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                  {file.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(file.size)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Shared by {file.permission?.granted_by || 'Unknown'}
                </p>
                {file.permission?.expires_at && (
                  <p className="text-xs text-orange-600 mt-1">
                    Expires: {new Date(file.permission.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SharedFiles