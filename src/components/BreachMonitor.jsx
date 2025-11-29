import React, { useState, useEffect } from 'react'
import { scanForBreaches } from '../services/gemini'
import { getSharedFiles } from '../services/supabase'
import LoadingSpinner from './LoadingSpinner'

const BreachMonitor = ({ user, onToast }) => {
  const [files, setFiles] = useState([])
  const [scanResults, setScanResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

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

  const handleScan = async () => {
    if (files.length === 0) {
      onToast('No files to scan', 'info')
      return
    }

    setScanning(true)
    const results = []

    try {
      for (const file of files) {
        try {
          const result = await scanForBreaches(file.name, file.size, file.type)
          results.push({
            file,
            result,
            timestamp: new Date()
          })
        } catch (error) {
          console.error('Breach scan error:', error)
          results.push({
            file,
            result: {
              riskLevel: 'unknown',
              issues: ['Scan failed'],
              recommendations: ['Manual review recommended'],
              safe: false
            },
            timestamp: new Date()
          })
        }
      }

      setScanResults(results)
      onToast(`Scanned ${files.length} files successfully`, 'success')
    } catch (error) {
      console.error('Scan error:', error)
      onToast('Scan failed', 'error')
    } finally {
      setScanning(false)
    }
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'medium':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'high':
      case 'critical':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Monitor</h1>
          <p className="mt-1 text-sm text-gray-500">
            AI-powered security scanning and breach detection for your files
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning || files.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {scanning ? (
            <>
              <LoadingSpinner size="small" className="mr-2" />
              Scanning...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Scan Files ({files.length})
            </>
          )}
        </button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Safe Files</h2>
              <p className="text-2xl font-bold text-gray-900">
                {scanResults.filter(r => r.result.riskLevel === 'low').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Medium Risk</h2>
              <p className="text-2xl font-bold text-gray-900">
                {scanResults.filter(r => r.result.riskLevel === 'medium').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">High Risk</h2>
              <p className="text-2xl font-bold text-gray-900">
                {scanResults.filter(r => r.result.riskLevel === 'high').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Critical</h2>
              <p className="text-2xl font-bold text-gray-900">
                {scanResults.filter(r => r.result.riskLevel === 'critical').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Scan Results ({scanResults.length} files scanned)
            </h3>
            <p className="text-sm text-gray-500">
              Last scan: {scanResults[0]?.timestamp.toLocaleString()}
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {scanResults.map((item, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getRiskIcon(item.result.riskLevel)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.file.name}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(item.result.riskLevel)}`}>
                        {item.result.riskLevel?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    
                    {item.result.issues && item.result.issues.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-xs font-medium text-gray-700 mb-1">Issues Found:</h5>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {item.result.issues.map((issue, issueIndex) => (
                            <li key={issueIndex}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {item.result.recommendations && item.result.recommendations.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-xs font-medium text-gray-700 mb-1">Recommendations:</h5>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {item.result.recommendations.map((rec, recIndex) => (
                            <li key={recIndex}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedFile(selectedFile === item ? null : item)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {selectedFile === item && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Detailed Analysis</h5>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p><strong>File Size:</strong> {(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p><strong>File Type:</strong> {item.file.type}</p>
                      <p><strong>Upload Date:</strong> {new Date(item.file.created_at).toLocaleDateString()}</p>
                      <p><strong>Risk Assessment:</strong> {item.result.safe ? 'Safe to use' : 'Requires attention'}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {scanResults.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No scan results</h3>
          <p className="mt-1 text-sm text-gray-500">
            {files.length > 0 
              ? 'Click "Scan Files" to start security analysis'
              : 'Upload some files first, then run a security scan'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default BreachMonitor