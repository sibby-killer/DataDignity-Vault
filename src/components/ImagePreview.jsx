import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { checkFileAccess } from '../services/permissionManager'
import { retrieveFromIPFS } from '../services/ipfsStorage'
import LoadingSpinner from './LoadingSpinner'

const ImagePreview = () => {
  const { fileId } = useParams()
  const [loading, setLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState(null)
  const [fileInfo, setFileInfo] = useState(null)

  useEffect(() => {
    loadImagePreview()
  }, [fileId])

  const loadImagePreview = async () => {
    try {
      if (!fileId) {
        setError('File ID not provided')
        return
      }

      // For public image previews, we'll check if file exists and is an image
      // In a real implementation, you'd have a separate endpoint for public previews
      
      setLoading(false)
      setError('Image preview feature coming soon!')
      
    } catch (error) {
      console.error('Preview load error:', error)
      setError('Failed to load image preview')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading image preview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Preview Not Available</h1>
          <p className="text-gray-600">{error}</p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to DataDignity Vault
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">Image Preview</h1>
              {fileName && (
                <span className="ml-4 text-sm text-gray-500">{fileName}</span>
              )}
            </div>
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              DataDignity Vault
            </a>
          </div>
        </div>
      </div>

      {/* Image Display */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-4xl w-full">
          <img
            src={imageUrl}
            alt={fileName || 'Preview'}
            className="w-full h-auto max-h-screen object-contain rounded-lg shadow-lg"
          />
          
          {/* Image Controls */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-4 bg-white rounded-lg p-3 shadow-sm">
              <button
                onClick={() => window.open(imageUrl, '_blank')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Open Full Size
              </button>
              <button
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = imageUrl
                  a.download = fileName || 'image'
                  a.click()
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-white rounded-lg shadow-lg p-3 text-center">
          <p className="text-xs text-gray-500">
            Secured by <strong>DataDignity Vault</strong> - Your files, your control, your dignity
          </p>
        </div>
      </div>
    </div>
  )
}

export default ImagePreview