// Image Watermarking Service for DataDignity Vault
// Embeds invisible metadata into shared images for tracking and protection

// Embed tracking metadata into image
export const embedTrackingMetadata = async (imageFile, metadata) => {
  try {
    console.log('🖼️ Embedding tracking metadata into image...')
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width
        canvas.height = img.height
        
        // Draw original image
        ctx.drawImage(img, 0, 0)
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Convert metadata to binary
        const metadataString = JSON.stringify({
          fileId: metadata.fileId,
          ownerId: metadata.ownerId,
          sharedWith: metadata.sharedWith,
          shareDate: metadata.shareDate,
          expiryDate: metadata.expiryDate,
          trackingId: metadata.trackingId,
          vault: 'DataDignity'
        })
        
        const binaryMetadata = metadataString
          .split('')
          .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
          .join('')
        
        // Embed metadata in LSB (Least Significant Bit) of red channel
        let dataIndex = 0
        for (let i = 0; i < binaryMetadata.length && dataIndex < data.length; i++) {
          const bit = parseInt(binaryMetadata[i])
          // Modify red channel LSB
          if (dataIndex % 4 === 0) { // Red channel
            data[dataIndex] = (data[dataIndex] & 0xFE) | bit
          }
          dataIndex += 4 // Move to next pixel's red channel
        }
        
        // Add end marker
        const endMarker = '11111111' // 8 ones to mark end
        for (let i = 0; i < endMarker.length && dataIndex < data.length; i++) {
          const bit = parseInt(endMarker[i])
          if (dataIndex % 4 === 0) {
            data[dataIndex] = (data[dataIndex] & 0xFE) | bit
          }
          dataIndex += 4
        }
        
        // Put modified data back
        ctx.putImageData(imageData, 0, 0)
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('✅ Tracking metadata embedded successfully')
            resolve({
              success: true,
              watermarkedImage: blob,
              originalSize: imageFile.size,
              watermarkedSize: blob.size,
              metadata: metadataString
            })
          } else {
            reject(new Error('Failed to create watermarked image blob'))
          }
        }, imageFile.type, 0.95) // High quality
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image for watermarking'))
      }
      
      // Load image
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = () => {
        reject(new Error('Failed to read image file'))
      }
      reader.readAsDataURL(imageFile)
    })
  } catch (error) {
    console.error('❌ Watermarking error:', error)
    throw error
  }
}

// Extract tracking metadata from image
export const extractTrackingMetadata = async (imageFile) => {
  try {
    console.log('🔍 Extracting tracking metadata from image...')
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Extract LSB from red channels
        let binaryData = ''
        for (let i = 0; i < data.length; i += 4) {
          const redLSB = data[i] & 1
          binaryData += redLSB
        }
        
        // Convert binary to string
        let extractedString = ''
        for (let i = 0; i < binaryData.length; i += 8) {
          const byte = binaryData.substr(i, 8)
          if (byte.length === 8) {
            const charCode = parseInt(byte, 2)
            if (charCode === 255) break // End marker
            if (charCode > 0 && charCode < 127) { // Valid ASCII
              extractedString += String.fromCharCode(charCode)
            }
          }
        }
        
        // Try to parse as JSON metadata
        try {
          const metadata = JSON.parse(extractedString)
          if (metadata.vault === 'DataDignity') {
            console.log('✅ DataDignity metadata found:', metadata)
            resolve({
              success: true,
              hasMetadata: true,
              metadata: metadata
            })
          } else {
            resolve({
              success: true,
              hasMetadata: false,
              reason: 'No DataDignity metadata found'
            })
          }
        } catch (parseError) {
          resolve({
            success: true,
            hasMetadata: false,
            reason: 'No valid metadata found'
          })
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image for metadata extraction'))
      }
      
      // Load image
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.readAsDataURL(imageFile)
    })
  } catch (error) {
    console.error('❌ Metadata extraction error:', error)
    throw error
  }
}

// Generate tracking ID for shared image
export const generateTrackingId = (fileId, recipientEmail) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  const hash = btoa(`${fileId}_${recipientEmail}_${timestamp}`).replace(/[^a-zA-Z0-9]/g, '').substr(0, 12)
  return `DV_${hash}_${random}`
}

// Create shareable image with metadata
export const createShareableImage = async (originalImageFile, shareMetadata) => {
  try {
    // Check if it's an image
    if (!originalImageFile.type.startsWith('image/')) {
      throw new Error('File is not an image')
    }
    
    // Generate tracking metadata
    const trackingId = generateTrackingId(shareMetadata.fileId, shareMetadata.recipientEmail)
    
    const metadata = {
      fileId: shareMetadata.fileId,
      ownerId: shareMetadata.ownerId,
      sharedWith: shareMetadata.recipientEmail,
      shareDate: new Date().toISOString(),
      expiryDate: shareMetadata.expiryDate,
      trackingId: trackingId,
      permissions: shareMetadata.permissions || 'view_only'
    }
    
    // Embed metadata into image
    const result = await embedTrackingMetadata(originalImageFile, metadata)
    
    if (result.success) {
      console.log('🎯 Shareable image created with tracking ID:', trackingId)
      return {
        success: true,
        watermarkedImage: result.watermarkedImage,
        trackingId: trackingId,
        metadata: metadata,
        originalSize: result.originalSize,
        watermarkedSize: result.watermarkedSize
      }
    } else {
      throw new Error('Failed to embed tracking metadata')
    }
  } catch (error) {
    console.error('❌ Shareable image creation failed:', error)
    throw error
  }
}

// Verify image authenticity and get tracking info
export const verifyImageAuthenticity = async (imageFile) => {
  try {
    const result = await extractTrackingMetadata(imageFile)
    
    if (result.hasMetadata) {
      const metadata = result.metadata
      
      // Check if image is still valid (not expired)
      const now = new Date()
      const expiryDate = new Date(metadata.expiryDate)
      const isExpired = now > expiryDate
      
      return {
        success: true,
        isAuthentic: true,
        isExpired: isExpired,
        metadata: metadata,
        status: isExpired ? 'EXPIRED' : 'VALID',
        message: isExpired 
          ? 'This image access has been revoked or expired'
          : 'This image was shared via DataDignity Vault and is currently valid'
      }
    } else {
      return {
        success: true,
        isAuthentic: false,
        message: 'This image was not shared through DataDignity Vault'
      }
    }
  } catch (error) {
    console.error('❌ Image verification failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export default {
  embedTrackingMetadata,
  extractTrackingMetadata,
  generateTrackingId,
  createShareableImage,
  verifyImageAuthenticity
}