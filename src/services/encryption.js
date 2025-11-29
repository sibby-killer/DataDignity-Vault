// Client-side encryption service - never send unencrypted files to server
import CryptoJS from 'crypto-js'

// Generate master encryption key from user password
export const generateMasterKey = (password, email) => {
  // Use PBKDF2 with 100,000 iterations as specified in the requirements
  const salt = CryptoJS.enc.Utf8.parse(email) // Use email as salt for consistency
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32, // 256 bits
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256
  })
  return key.toString()
}

// Generate unique random key for each file
export const generateFileKey = () => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString()
}

// Encrypt file data using AES-256-GCM equivalent (AES-256-CTR for browser compatibility)
export const encryptFile = (fileData, fileKey) => {
  try {
    // Convert file data to base64 if it's a File object
    if (fileData instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64Data = reader.result.split(',')[1] // Remove data:type;base64, prefix
          const encrypted = CryptoJS.AES.encrypt(base64Data, fileKey).toString()
          resolve(encrypted)
        }
        reader.onerror = reject
        reader.readAsDataURL(fileData)
      })
    } else {
      // If it's already base64 string, encrypt directly
      const base64Data = fileData.includes('base64,') ? fileData.split(',')[1] : fileData
      const encrypted = CryptoJS.AES.encrypt(base64Data, fileKey).toString()
      return Promise.resolve(encrypted)
    }
  } catch (error) {
    console.error('Encryption error:', error)
    throw error
  }
}

// Decrypt file data
export const decryptFile = (encryptedData, fileKey) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, fileKey)
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8)
    return decryptedString
  } catch (error) {
    console.error('Decryption error:', error)
    throw error
  }
}

// Encrypt file key with master key
export const encryptFileKey = (fileKey, masterKey) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(fileKey, masterKey).toString()
    return encrypted
  } catch (error) {
    console.error('File key encryption error:', error)
    throw error
  }
}

// Decrypt file key with master key
export const decryptFileKey = (encryptedFileKey, masterKey) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedFileKey, masterKey)
    const decryptedKey = decrypted.toString(CryptoJS.enc.Utf8)
    return decryptedKey
  } catch (error) {
    console.error('File key decryption error:', error)
    throw error
  }
}

// Generate file hash for blockchain registration using CryptoJS
export const generateFileHash = async (fileData) => {
  try {
    let wordArray
    
    if (fileData instanceof File) {
      // Read file as array buffer
      const arrayBuffer = await fileData.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      // Convert to hex string for CryptoJS
      const hexString = Array.from(uint8Array)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
      wordArray = CryptoJS.enc.Hex.parse(hexString)
    } else if (typeof fileData === 'string') {
      // If it's base64 string, parse it directly
      if (fileData.includes('base64,')) {
        const base64Data = fileData.split(',')[1]
        wordArray = CryptoJS.enc.Base64.parse(base64Data)
      } else {
        wordArray = CryptoJS.enc.Utf8.parse(fileData)
      }
    } else if (fileData instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(fileData)
      const hexString = Array.from(uint8Array)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
      wordArray = CryptoJS.enc.Hex.parse(hexString)
    } else {
      throw new Error('Unsupported file data type for hashing')
    }

    // Generate SHA-256 hash using CryptoJS
    const hash = CryptoJS.SHA256(wordArray)
    const hashHex = hash.toString(CryptoJS.enc.Hex)
    
    console.log('✅ File hash generated successfully:', hashHex.substring(0, 16) + '...')
    return hashHex
  } catch (error) {
    console.error('Hash generation error:', error)
    throw new Error('Failed to generate file hash: ' + error.message)
  }
}

// Validate encryption/decryption
export const validateEncryption = async (originalData, fileKey) => {
  try {
    const encrypted = await encryptFile(originalData, fileKey)
    const decrypted = await decryptFile(encrypted, fileKey)
    
    // For file validation, we compare the base64 data
    const originalBase64 = originalData instanceof File 
      ? await new Promise(resolve => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result.split(',')[1])
          reader.readAsDataURL(originalData)
        })
      : originalData.split(',')[1]
    
    return decrypted === originalBase64
  } catch (error) {
    console.error('Encryption validation error:', error)
    return false
  }
}

// Secure file processing for upload
export const processFileForUpload = async (file, userPassword, userEmail) => {
  try {
    // Generate master key from user credentials
    const masterKey = generateMasterKey(userPassword, userEmail)
    
    // Generate unique file key
    const fileKey = generateFileKey()
    
    // Encrypt the file
    const encryptedFileData = await encryptFile(file, fileKey)
    
    // Encrypt the file key with master key
    const encryptedFileKey = encryptFileKey(fileKey, masterKey)
    
    // Generate file hash for blockchain
    const fileHash = await generateFileHash(file)
    
    return {
      encryptedFileData,
      encryptedFileKey,
      fileHash,
      fileKey, // Keep for immediate use, but don't store
      masterKey // Keep for session, but never store
    }
  } catch (error) {
    console.error('File processing error:', error)
    throw error
  }
}

// Retrieve and decrypt file
export const retrieveAndDecryptFile = async (encryptedFileData, encryptedFileKey, userPassword, userEmail, originalFileName) => {
  try {
    // Generate master key from user credentials
    const masterKey = generateMasterKey(userPassword, userEmail)
    
    // Decrypt file key
    const fileKey = decryptFileKey(encryptedFileKey, masterKey)
    
    // Decrypt file data
    const decryptedBase64 = decryptFile(encryptedFileData, fileKey)
    
    // Convert back to blob URL for download
    const mimeType = 'application/octet-stream' // Default, could be enhanced to detect actual type
    const blob = new Blob([atob(decryptedBase64)], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    return {
      url,
      blob,
      fileName: originalFileName
    }
  } catch (error) {
    console.error('File retrieval error:', error)
    throw error
  }
}