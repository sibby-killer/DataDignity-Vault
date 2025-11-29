// Server-side wallet for blockchain transactions
// This allows the app to handle blockchain operations without requiring every user to have MetaMask

import { ethers } from 'ethers'

// Your deployed contract details
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0xYourDeployedContractAddress'
const PRIVATE_KEY = import.meta.env.VITE_SERVER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000' // Dummy key for demo
const RPC_URL = import.meta.env.VITE_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology/'

// Smart contract ABI (simplified)
const CONTRACT_ABI = [
  "function registerFile(string memory fileHash, string memory fileName, uint256 fileSize) external returns (uint256)",
  "function shareFile(uint256 fileId, address recipient, uint256 expiryDays) external",
  "function revokeFileAccess(uint256 fileId, address recipient) external",
  "function hasAccess(uint256 fileId, address user) external view returns (bool)",
  "function getFileInfo(uint256 fileId) external view returns (string memory, string memory, uint256, address, uint256)",
  "event FileRegistered(uint256 indexed fileId, string fileHash, address indexed owner)",
  "event FileShared(uint256 indexed fileId, address indexed owner, address indexed recipient, uint256 expiryTimestamp)",
  "event AccessRevoked(uint256 indexed fileId, address indexed owner, address indexed recipient)"
]

let provider = null
let serverWallet = null
let contract = null

// Initialize server wallet
export const initServerWallet = async () => {
  try {
    if (!PRIVATE_KEY || PRIVATE_KEY === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      console.warn('Server private key not configured - blockchain features limited')
      return false
    }

    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0xYourDeployedContractAddress') {
      console.warn('Contract address not configured - blockchain features limited')
      return false
    }

    provider = new ethers.JsonRpcProvider(RPC_URL)
    serverWallet = new ethers.Wallet(PRIVATE_KEY, provider)
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, serverWallet)
    
    console.log('✅ Server wallet initialized:', serverWallet.address)
    return true
  } catch (error) {
    console.error('❌ Server wallet initialization failed:', error)
    return false
  }
}

// Register file on behalf of user
export const serverRegisterFile = async (fileHash, fileName, fileSize, userEmail) => {
  try {
    if (!contract) {
      throw new Error('Server wallet not initialized')
    }

    console.log('🔗 Registering file on blockchain via server wallet...')
    
    const tx = await contract.registerFile(fileHash, fileName, fileSize, {
      gasLimit: 300000
    })
    
    console.log('📡 Transaction sent:', tx.hash)
    const receipt = await tx.wait()
    
    // Get the file ID from the event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log)
        return parsed.name === 'FileRegistered'
      } catch {
        return false
      }
    })
    
    let fileId = null
    if (event) {
      const parsed = contract.interface.parseLog(event)
      fileId = parsed.args.fileId.toString()
    }
    
    console.log('✅ File registered successfully')
    console.log('File ID:', fileId)
    console.log('Transaction:', `https://amoy.polygonscan.com/tx/${receipt.hash}`)
    
    return {
      success: true,
      transactionHash: receipt.hash,
      fileId: fileId,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    }
  } catch (error) {
    console.error('❌ Server file registration failed:', error)
    throw error
  }
}

// Share file on behalf of user
export const serverShareFile = async (fileId, recipientVirtualAddress, expiryDays) => {
  try {
    if (!contract) {
      throw new Error('Server wallet not initialized')
    }

    console.log('🔗 Sharing file on blockchain via server wallet...')
    console.log('File ID:', fileId)
    console.log('Recipient:', recipientVirtualAddress)
    console.log('Expiry Days:', expiryDays)
    
    const tx = await contract.shareFile(fileId, recipientVirtualAddress, expiryDays, {
      gasLimit: 250000
    })
    
    console.log('📡 Share transaction sent:', tx.hash)
    const receipt = await tx.wait()
    
    console.log('✅ File shared successfully')
    console.log('Transaction:', `https://amoy.polygonscan.com/tx/${receipt.hash}`)
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    }
  } catch (error) {
    console.error('❌ Server file sharing failed:', error)
    throw error
  }
}

// Revoke file access on behalf of user
export const serverRevokeAccess = async (fileId, recipientVirtualAddress) => {
  try {
    if (!contract) {
      throw new Error('Server wallet not initialized')
    }

    console.log('🔗 Revoking access on blockchain via server wallet...')
    
    const tx = await contract.revokeFileAccess(fileId, recipientVirtualAddress, {
      gasLimit: 200000
    })
    
    console.log('📡 Revocation transaction sent:', tx.hash)
    const receipt = await tx.wait()
    
    console.log('✅ Access revoked successfully')
    console.log('Transaction:', `https://amoy.polygonscan.com/tx/${receipt.hash}`)
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    }
  } catch (error) {
    console.error('❌ Server access revocation failed:', error)
    throw error
  }
}

// Check if user has access to file
export const serverCheckAccess = async (fileId, userVirtualAddress) => {
  try {
    if (!contract) {
      return false
    }

    const hasAccess = await contract.hasAccess(fileId, userVirtualAddress)
    return hasAccess
  } catch (error) {
    console.error('❌ Access check failed:', error)
    return false
  }
}

// Get file info from blockchain
export const serverGetFileInfo = async (fileId) => {
  try {
    if (!contract) {
      return null
    }

    const info = await contract.getFileInfo(fileId)
    return {
      fileHash: info[0],
      fileName: info[1],
      fileSize: info[2].toString(),
      owner: info[3],
      timestamp: info[4].toString()
    }
  } catch (error) {
    console.error('❌ Get file info failed:', error)
    return null
  }
}

// Check server wallet balance
export const getServerWalletBalance = async () => {
  try {
    if (!serverWallet || !provider) {
      return '0'
    }

    const balance = await provider.getBalance(serverWallet.address)
    return ethers.formatEther(balance)
  } catch (error) {
    console.error('❌ Balance check failed:', error)
    return '0'
  }
}

export default {
  initServerWallet,
  serverRegisterFile,
  serverShareFile,
  serverRevokeAccess,
  serverCheckAccess,
  serverGetFileInfo,
  getServerWalletBalance
}