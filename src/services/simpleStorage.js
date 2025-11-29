// Simple Browser Storage Service
// Uses localStorage as reliable fallback when all external storage fails

// Store encrypted file data in browser localStorage
export const uploadToLocalStorage = async (encryptedFileData, fileName, mimeType = 'application/octet-stream') => {
  try {
    console.log('💾 Using browser localStorage for file storage...')
    
    // Convert to base64 for localStorage
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(encryptedFileData)))
    const timestamp = Date.now()
    const fileId = `local_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
    
    const fileRecord = {
      id: fileId,
      fileName: fileName,
      mimeType: mimeType,
      fileData: base64Data,
      size: encryptedFileData.length,
      timestamp: timestamp,
      created: new Date().toISOString()
    }
    
    // Store in localStorage
    localStorage.setItem(fileId, JSON.stringify(fileRecord))
    
    // Keep track of all stored files
    const storedFiles = JSON.parse(localStorage.getItem('datadignity_files') || '[]')
    storedFiles.push(fileId)
    localStorage.setItem('datadignity_files', JSON.stringify(storedFiles))
    
    console.log('✅ File stored in browser localStorage successfully')
    
    return {
      success: true,
      cid: fileId,
      url: `localstorage://${fileId}`,
      gateway: `localstorage://${fileId}`,
      storageType: 'localStorage'
    }
  } catch (error) {
    console.error('❌ localStorage storage error:', error)
    throw new Error(`Browser storage failed: ${error.message}`)
  }
}

// Retrieve file from browser localStorage
export const retrieveFromLocalStorage = async (fileId) => {
  try {
    console.log('💾 Retrieving file from browser localStorage:', fileId)
    
    const fileRecord = localStorage.getItem(fileId)
    if (!fileRecord) {
      throw new Error('File not found in localStorage')
    }
    
    const parsed = JSON.parse(fileRecord)
    
    // Convert from base64 back to Uint8Array
    const binaryString = atob(parsed.fileData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    console.log('✅ File retrieved from localStorage successfully')
    
    return {
      success: true,
      data: bytes,
      storageType: 'localStorage',
      metadata: {
        fileName: parsed.fileName,
        mimeType: parsed.mimeType,
        size: parsed.size
      }
    }
  } catch (error) {
    console.error('❌ localStorage retrieval error:', error)
    throw error
  }
}

// Get all stored files from localStorage
export const getLocalStorageFiles = () => {
  try {
    const storedFiles = JSON.parse(localStorage.getItem('datadignity_files') || '[]')
    const files = []
    
    for (const fileId of storedFiles) {
      try {
        const fileRecord = localStorage.getItem(fileId)
        if (fileRecord) {
          const parsed = JSON.parse(fileRecord)
          files.push({
            id: parsed.id,
            name: parsed.fileName,
            size: parsed.size,
            type: parsed.mimeType,
            created_at: parsed.created,
            storage_type: 'localStorage',
            ipfs_cid: parsed.id
          })
        }
      } catch (error) {
        console.warn('Failed to parse stored file:', fileId, error)
      }
    }
    
    return files
  } catch (error) {
    console.error('Error getting localStorage files:', error)
    return []
  }
}

// Clear a file from localStorage
export const deleteFromLocalStorage = (fileId) => {
  try {
    localStorage.removeItem(fileId)
    
    // Update file list
    const storedFiles = JSON.parse(localStorage.getItem('datadignity_files') || '[]')
    const updatedFiles = storedFiles.filter(id => id !== fileId)
    localStorage.setItem('datadignity_files', JSON.stringify(updatedFiles))
    
    console.log('✅ File deleted from localStorage:', fileId)
    return true
  } catch (error) {
    console.error('❌ localStorage deletion error:', error)
    return false
  }
}

// Get localStorage usage info
export const getStorageInfo = () => {
  try {
    const storedFiles = JSON.parse(localStorage.getItem('datadignity_files') || '[]')
    let totalSize = 0
    
    for (const fileId of storedFiles) {
      try {
        const fileRecord = localStorage.getItem(fileId)
        if (fileRecord) {
          const parsed = JSON.parse(fileRecord)
          totalSize += parsed.size || 0
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
    
    return {
      fileCount: storedFiles.length,
      totalSize: totalSize,
      formattedSize: formatBytes(totalSize)
    }
  } catch (error) {
    return { fileCount: 0, totalSize: 0, formattedSize: '0 B' }
  }
}

// Helper function to format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default {
  uploadToLocalStorage,
  retrieveFromLocalStorage,
  getLocalStorageFiles,
  deleteFromLocalStorage,
  getStorageInfo
}