// IPFS Storage Service using NFT.Storage
// This provides permanent, distributed storage for encrypted files

const NFT_STORAGE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjpveDE4ODhGODdGOEI4NTE2MTQxRDgzQjZEQ0Q4NzM0MTVCOTA1RjM1OCIsImlzcyI6Im5mdC1zdG9yYWdlIiwiaWF0IjoxNjg5Nzc2ODc5MDAwLCJuYW1lIjoiRGF0YURpZ25pdHkifQ.3LqO9k4tX4Y-KGfLfL0vK-9LS6FMtHKQQi4Ff2k2Ztk'

// Upload encrypted file to IPFS via NFT.Storage with fallback
export const uploadToIPFS = async (encryptedFileData, fileName, mimeType = 'application/octet-stream') => {
  try {
    if (!NFT_STORAGE_API_KEY) {
      throw new Error('NFT.Storage API key not configured')
    }

    console.log('🌐 Uploading encrypted file to IPFS...')
    
    // Convert encrypted data to Blob
    const blob = new Blob([encryptedFileData], { type: mimeType })
    const file = new File([blob], `encrypted_${fileName}`, { type: mimeType })
    
    // Create FormData for upload
    const formData = new FormData()
    formData.append('file', file)
    
    // Upload to NFT.Storage
    const response = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NFT_STORAGE_API_KEY}`,
      },
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`IPFS upload failed: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    const ipfsCid = result.value.cid
    const ipfsUrl = `https://ipfs.io/ipfs/${ipfsCid}`
    
    console.log('✅ File uploaded to IPFS successfully')
    console.log('IPFS CID:', ipfsCid)
    console.log('IPFS URL:', ipfsUrl)
    
    return {
      success: true,
      cid: ipfsCid,
      url: ipfsUrl,
      gateway: `https://${ipfsCid}.ipfs.nftstorage.link`,
      storageType: 'ipfs'
    }
  } catch (error) {
    console.error('❌ IPFS upload error:', error)
    throw new Error(`IPFS upload failed: ${error.message}`)
  }
}

// Retrieve file from IPFS
export const retrieveFromIPFS = async (cid) => {
  try {
    console.log('🌐 Retrieving file from IPFS:', cid)
    
    // Try multiple gateways for reliability
    const gateways = [
      `https://${cid}.ipfs.nftstorage.link`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`
    ]
    
    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway, {
          headers: {
            'Accept': 'application/octet-stream'
          }
        })
        
        if (response.ok) {
          const data = await response.arrayBuffer()
          console.log('✅ File retrieved from IPFS successfully')
          return {
            success: true,
            data: new Uint8Array(data),
            gateway: gateway
          }
        }
      } catch (gatewayError) {
        console.warn(`Gateway ${gateway} failed:`, gatewayError.message)
        continue
      }
    }
    
    throw new Error('All IPFS gateways failed')
  } catch (error) {
    console.error('❌ IPFS retrieval error:', error)
    throw error
  }
}

// Check if IPFS CID is valid
export const validateIPFSCid = (cid) => {
  // Basic CID validation
  return cid && typeof cid === 'string' && cid.startsWith('Qm') && cid.length === 46
}

// Get IPFS file size (estimate)
export const getIPFSFileSize = async (cid) => {
  try {
    const response = await fetch(`https://ipfs.io/ipfs/${cid}`, { method: 'HEAD' })
    const contentLength = response.headers.get('content-length')
    return contentLength ? parseInt(contentLength) : null
  } catch (error) {
    console.warn('Could not get IPFS file size:', error)
    return null
  }
}

// Get IPFS network status
export const getIPFSStatus = async () => {
  try {
    const response = await fetch('https://api.nft.storage/status', {
      headers: {
        'Authorization': `Bearer ${NFT_STORAGE_API_KEY}`
      }
    })
    return response.ok
  } catch (error) {
    console.warn('IPFS status check failed:', error)
    return false
  }
}

export default {
  uploadToIPFS,
  retrieveFromIPFS,
  validateIPFSCid,
  getIPFSFileSize,
  getIPFSStatus
}