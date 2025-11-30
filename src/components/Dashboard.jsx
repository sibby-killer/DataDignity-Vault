import React, { useState, useEffect } from 'react'
import { getSharedFiles } from '../services/supabase'
import { isMetaMaskConnected } from '../services/blockchain'
import EmergencyLockdown from './EmergencyLockdown'
import LoadingSpinner from './LoadingSpinner'

const Dashboard = ({ user, walletAddress, onToast }) => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    sharedFiles: 0,
    storageUsed: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [recentFiles, setRecentFiles] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [user])

  // Listen for file updates from other components
  useEffect(() => {
    const handleFilesUpdated = () => {
      console.log('📊 Dashboard refreshing due to file changes...')
      loadDashboardData()
    }

    // Listen for custom events from FileManager
    window.addEventListener('filesUpdated', handleFilesUpdated)
    
    // Also listen for localStorage changes
    window.addEventListener('storage', handleFilesUpdated)
    
    return () => {
      window.removeEventListener('filesUpdated', handleFilesUpdated)
      window.removeEventListener('storage', handleFilesUpdated)
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      if (!user) return

      let allFiles = []
      
      // Get files from localStorage first (always available)
      try {
        const localFiles = JSON.parse(localStorage.getItem('datadignity_files') || '[]')
        if (localFiles.length > 0) {
          allFiles = localFiles
        }
      } catch (localError) {
        console.warn('Failed to load localStorage files:', localError)
      }

      // Get user's files from Supabase and merge
      try {
        const supabaseFiles = await getSharedFiles(user.id)
        if (supabaseFiles && supabaseFiles.length > 0) {
          // Merge with local files, avoid duplicates by name and size
          const localFileSignatures = allFiles.map(f => `${f.name}_${f.size}`)
          const newSupabaseFiles = supabaseFiles.filter(f => 
            !localFileSignatures.includes(`${f.name}_${f.size}`)
          )
          allFiles = [...allFiles, ...newSupabaseFiles]
        }
      } catch (supabaseError) {
        console.warn('Supabase unavailable for dashboard, using local only:', supabaseError)
      }
      
      // Calculate stats from all files
      const totalFiles = allFiles.length
      const sharedFiles = allFiles.filter(file => file.shared).length
      const storageUsed = allFiles.reduce((total, file) => total + (file.size || 0), 0)
      
      // Get recent files (last 5)
      const recentFilesList = allFiles
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)

      setStats({
        totalFiles,
        sharedFiles,
        storageUsed,
        recentActivity: allFiles.slice(0, 3) // Recent activity items
      })
      setRecentFiles(recentFilesList)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      onToast('Failed to load dashboard data', 'error')
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

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return (
          <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 3V1h10v2h4v18H3V3h4zM5 5v14h14V5H5zm7 2v10h-2V7h2zm-4 6v4H6v-4h2zm8 0v4h-2v-4h2z"/>
          </svg>
        )
      case 'doc':
      case 'docx':
        return (
          <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 2h12l4 4v16H6V2zm0 2v16h12V8l-4-4H6z"/>
          </svg>
        )
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <svg className="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 3h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm0 2v14h14V5H5z"/>
          </svg>
        )
      default:
        return (
          <svg className="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 3L3 13v8h8l10-10V3h-8zM5 19v-4l8-8h4v4l-8 8H5z"/>
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
      {/* Emergency Lockdown moved to security section - not on main dashboard */}
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.email?.split('@')[0] || 'User'}!
        </h1>
        <p className="text-blue-100 mb-4">
          Your files are secure and ready to access. Here's what's happening with your vault.
        </p>
        
        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <a
            href="/files"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
          >
            Upload Files
          </a>
          <a
            href="/shared"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
          >
            View Shared
          </a>
          {!walletAddress && (
            <button
              onClick={() => onToast('Please connect your wallet from the header', 'info')}
              className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Files</h2>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Shared Files</h2>
              <p className="text-2xl font-bold text-gray-900">{stats.sharedFiles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Storage Used</h2>
              <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.storageUsed)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${walletAddress ? 'bg-green-100' : 'bg-orange-100'}`}>
              <svg className={`h-6 w-6 ${walletAddress ? 'text-green-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Wallet Status</h2>
              <p className={`text-2xl font-bold ${walletAddress ? 'text-green-600' : 'text-orange-600'}`}>
                {walletAddress ? 'Connected' : 'Not Connected'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Files and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Files</h3>
          </div>
          <div className="p-6">
            {recentFiles.length > 0 ? (
              <div className="space-y-4">
                {recentFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {file.shared && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Shared
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by uploading your first file.</p>
                <div className="mt-6">
                  <a
                    href="/files"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Upload Files
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Security Status</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Encryption</span>
                </div>
                <span className="text-sm text-green-600">Active</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${walletAddress ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                  <span className="text-sm font-medium text-gray-900">Blockchain</span>
                </div>
                <span className={`text-sm ${walletAddress ? 'text-green-600' : 'text-orange-600'}`}>
                  {walletAddress ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">AI Monitoring</span>
                </div>
                <span className="text-sm text-blue-600">Active</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Account Security</span>
                </div>
                <span className="text-sm text-green-600">Secure</span>
              </div>
            </div>
            
            <div className="mt-6">
              <a
                href="/security"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View Security Details
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard