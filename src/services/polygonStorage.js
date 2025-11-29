// Polygon Blockchain Storage Service
// Stores encrypted file data directly on-chain when IPFS is unavailable

import { ethers } from 'ethers'

const RPC_URL = import.meta.env.VITE_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology/'
const PRIVATE_KEY = import.meta.env.VITE_SERVER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000'

// Simple storage contract ABI for storing file data
const STORAGE_CONTRACT_ABI = [
  "function storeFile(string memory fileId, bytes memory encryptedData, string memory metadata) external",
  "function getFile(string memory fileId) external view returns (bytes memory, string memory)",
  "function fileExists(string memory fileId) external view returns (bool)",
  "event FileStored(string indexed fileId, address indexed owner, uint256 timestamp)"
]

// We'll use a simple contract or deploy one for file storage
const STORAGE_CONTRACT_ADDRESS = import.meta.env.VITE_STORAGE_CONTRACT_ADDRESS || '0x' + '0'.repeat(40)

let provider = null
let wallet = null
let storageContract = null

// Initialize Polygon storage
export const initPolygonStorage = async () => {
  try {
    if (PRIVATE_KEY === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      console.warn('Polygon storage private key not configured')
      return false
    }

    provider = new ethers.JsonRpcProvider(RPC_URL)
    wallet = new ethers.Wallet(PRIVATE_KEY, provider)
    
    // For demo, we'll store data as transaction calldata
    console.log('✅ Polygon storage initialized')
    return true
  } catch (error) {
    console.error('❌ Polygon storage initialization failed:', error)
    return false
  }
}

// Upload encrypted file to Polygon blockchain
export const uploadToPolygon = async (encryptedFileData, fileName, mimeType = 'application/octet-stream') => {
  try {
    if (!wallet) {
      throw new Error('Polygon storage not initialized')
    }

    console.log('⛓️ Storing encrypted file on Polygon blockchain...')
    
    // Create unique file ID
    const timestamp = Date.now()
    const fileId = `polygon_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
    
    // Split large files into chunks (blockchain has size limits)
    const maxChunkSize = 32000 // bytes (safe for calldata)
    const chunks = []
    
    for (let i = 0; i < encryptedFileData.length; i += maxChunkSize) {
      chunks.push(encryptedFileData.slice(i, i + maxChunkSize))
    }
    
    console.log(`📦 Splitting file into ${chunks.length} chunks for blockchain storage`)
    
    // Store file metadata and first chunk
    const metadata = JSON.stringify({
      fileName: fileName,
      mimeType: mimeType,
      totalChunks: chunks.length,
      fileSize: encryptedFileData.length,
      timestamp: timestamp
    })
    
    // Store chunks as transaction data
    const chunkHashes = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkHex = '0x' + Array.from(chunks[i]).map(b => b.toString(16).padStart(2, '0')).join('')
      
      // Send transaction with chunk data
      const tx = await wallet.sendTransaction({
        to: wallet.address, // Send to self
        value: 0,
        data: chunkHex,
        gasLimit: 500000
      })
      
      console.log(`📡 Stored chunk ${i + 1}/${chunks.length}, TX: ${tx.hash}`)
      
      const receipt = await tx.wait()
      chunkHashes.push(receipt.hash)
    }
    
    // Store metadata transaction
    const metadataHex = '0x' + Buffer.from(JSON.stringify({
      fileId: fileId,
      metadata: metadata,
      chunkHashes: chunkHashes
    })).toString('hex')
    
    const metadataTx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0,
      data: metadataHex,
      gasLimit: 200000
    })
    
    const metadataReceipt = await metadataTx.wait()
    
    console.log('✅ File stored on Polygon blockchain successfully')
    console.log('📋 Metadata TX:', metadataReceipt.hash)
    console.log('🔍 View on PolygonScan:', `https://amoy.polygonscan.com/tx/${metadataReceipt.hash}`)
    
    const polygonUrl = `polygon://${fileId}?metadata=${metadataReceipt.hash}`
    
    return {
      success: true,
      cid: fileId,
      url: polygonUrl,
      gateway: polygonUrl,
      storageType: 'polygon',
      metadataHash: metadataReceipt.hash,
      chunkHashes: chunkHashes
    }
  } catch (error) {
    console.error('❌ Polygon storage error:', error)
    throw new Error(`Polygon storage failed: ${error.message}`)
  }
}

// Retrieve file from Polygon blockchain
export const retrieveFromPolygon = async (fileId, metadataHash) => {
  try {
    if (!provider) {
      throw new Error('Polygon storage not initialized')
    }

    console.log('⛓️ Retrieving file from Polygon blockchain:', fileId)
    
    // Get metadata transaction
    const metadataTx = await provider.getTransaction(metadataHash)
    if (!metadataTx) {
      throw new Error('Metadata transaction not found')
    }
    
    // Decode metadata
    const metadataHex = metadataTx.data.slice(2) // Remove 0x
    const metadataBuffer = Buffer.from(metadataHex, 'hex')
    const fileInfo = JSON.parse(metadataBuffer.toString())
    
    console.log('📋 Retrieved metadata:', fileInfo.metadata)
    
    // Retrieve all chunks
    const chunks = []
    for (const chunkHash of fileInfo.chunkHashes) {
      const chunkTx = await provider.getTransaction(chunkHash)
      if (!chunkTx) {
        throw new Error(`Chunk transaction not found: ${chunkHash}`)
      }
      
      // Decode chunk data
      const chunkHex = chunkTx.data.slice(2) // Remove 0x
      const chunkBytes = new Uint8Array(chunkHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
      chunks.push(chunkBytes)
    }
    
    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const combinedData = new Uint8Array(totalLength)
    let offset = 0
    
    for (const chunk of chunks) {
      combinedData.set(chunk, offset)
      offset += chunk.length
    }
    
    console.log('✅ File retrieved from Polygon blockchain successfully')
    
    return {
      success: true,
      data: combinedData,
      storageType: 'polygon',
      metadata: JSON.parse(fileInfo.metadata)
    }
  } catch (error) {
    console.error('❌ Polygon retrieval error:', error)
    throw error
  }
}

// Check if file exists on Polygon
export const checkPolygonFile = async (fileId, metadataHash) => {
  try {
    if (!provider) {
      return false
    }
    
    const tx = await provider.getTransaction(metadataHash)
    return tx !== null
  } catch (error) {
    console.warn('Polygon file check failed:', error)
    return false
  }
}

// Get storage cost estimate
export const getPolygonStorageCost = async (fileSizeBytes) => {
  try {
    if (!provider) {
      return { cost: '0', gasPrice: '0' }
    }
    
    const gasPrice = await provider.getFeeData()
    const chunks = Math.ceil(fileSizeBytes / 32000)
    const estimatedGas = chunks * 100000 // Rough estimate
    const costWei = estimatedGas * gasPrice.gasPrice
    const costPOL = ethers.formatEther(costWei)
    
    return {
      cost: costPOL,
      gasPrice: ethers.formatUnits(gasPrice.gasPrice, 'gwei'),
      chunks: chunks,
      estimatedGas: estimatedGas
    }
  } catch (error) {
    console.warn('Cost estimation failed:', error)
    return { cost: '0', gasPrice: '0' }
  }
}

export default {
  initPolygonStorage,
  uploadToPolygon,
  retrieveFromPolygon,
  checkPolygonFile,
  getPolygonStorageCost
}