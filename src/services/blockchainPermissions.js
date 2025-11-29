// Virtual blockchain address system for recipients without wallets
import { ethers } from 'ethers'
import CryptoJS from 'crypto-js'

// Convert email to deterministic virtual blockchain address
export const emailToVirtualAddress = (email) => {
  try {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()
    
    // Create deterministic hash from email
    const hash = CryptoJS.SHA256(normalizedEmail + 'DataDignityVault_Salt_2024').toString()
    
    // Convert hash to valid Ethereum address format
    const address = '0x' + hash.substring(0, 40)
    
    return address
  } catch (error) {
    console.error('Error generating virtual address:', error)
    return null
  }
}

// Create permission token for email access (no wallet needed)
export const createEmailAccessToken = (email, fileId, expiryTimestamp) => {
  try {
    const tokenData = {
      email: email.toLowerCase().trim(),
      fileId,
      expiryTimestamp,
      created: Date.now()
    }
    
    // Encrypt token data
    const tokenJson = JSON.stringify(tokenData)
    const token = CryptoJS.AES.encrypt(tokenJson, 'DataDignityVault_TokenSecret_2024').toString()
    
    // URL-safe encoding
    return encodeURIComponent(token)
  } catch (error) {
    console.error('Error creating access token:', error)
    return null
  }
}

// Verify and decode access token
export const verifyAccessToken = (token) => {
  try {
    // URL-safe decoding
    const decodedToken = decodeURIComponent(token)
    
    // Decrypt token
    const decrypted = CryptoJS.AES.decrypt(decodedToken, 'DataDignityVault_TokenSecret_2024')
    const tokenJson = decrypted.toString(CryptoJS.enc.Utf8)
    
    if (!tokenJson) {
      throw new Error('Invalid token')
    }
    
    const tokenData = JSON.parse(tokenJson)
    
    // Check if token has expired
    if (Date.now() > tokenData.expiryTimestamp) {
      throw new Error('Token has expired')
    }
    
    return tokenData
  } catch (error) {
    console.error('Error verifying access token:', error)
    return null
  }
}

// Generate secure share URL for recipients
export const generateShareUrl = (fileId, email, expiryTimestamp) => {
  try {
    const token = createEmailAccessToken(email, fileId, expiryTimestamp)
    if (!token) {
      throw new Error('Failed to create access token')
    }
    
    const baseUrl = window.location.origin
    return `${baseUrl}/access/${fileId}?token=${token}`
  } catch (error) {
    console.error('Error generating share URL:', error)
    return null
  }
}

// Grant blockchain permission using virtual address
export const grantVirtualPermission = async (contract, signer, fileId, email, expiryTimestamp) => {
  try {
    if (!contract || !signer) {
      throw new Error('Blockchain not initialized')
    }
    
    // Convert email to virtual blockchain address
    const virtualAddress = emailToVirtualAddress(email)
    if (!virtualAddress) {
      throw new Error('Failed to generate virtual address')
    }
    
    // Call smart contract to grant permission
    const tx = await contract.shareFile(fileId, virtualAddress, expiryTimestamp)
    console.log('Permission transaction sent:', tx.hash)
    
    const receipt = await tx.wait()
    console.log('Permission granted on blockchain:', receipt.transactionHash)
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      virtualAddress,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    }
  } catch (error) {
    console.error('Blockchain permission error:', error)
    
    // Handle specific errors
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user')
    } else if (error.reason) {
      throw new Error(`Contract error: ${error.reason}`)
    }
    
    throw error
  }
}

// Revoke blockchain permission using virtual address
export const revokeVirtualPermission = async (contract, signer, fileId, email) => {
  try {
    if (!contract || !signer) {
      throw new Error('Blockchain not initialized')
    }
    
    // Convert email to virtual blockchain address
    const virtualAddress = emailToVirtualAddress(email)
    if (!virtualAddress) {
      throw new Error('Failed to generate virtual address')
    }
    
    // Call smart contract to revoke permission
    const tx = await contract.revokeAccess(fileId, virtualAddress)
    console.log('Revoke transaction sent:', tx.hash)
    
    const receipt = await tx.wait()
    console.log('Permission revoked on blockchain:', receipt.transactionHash)
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      virtualAddress,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    }
  } catch (error) {
    console.error('Blockchain revoke error:', error)
    throw error
  }
}

// Check if virtual address has permission (for recipient access)
export const checkVirtualPermission = async (contract, fileId, email) => {
  try {
    if (!contract) {
      console.warn('Blockchain not available for permission check')
      return false
    }
    
    // Convert email to virtual blockchain address
    const virtualAddress = emailToVirtualAddress(email)
    if (!virtualAddress) {
      return false
    }
    
    // Check permission on blockchain
    const hasAccess = await contract.hasAccess(fileId, virtualAddress)
    return hasAccess
  } catch (error) {
    console.error('Error checking virtual permission:', error)
    return false
  }
}

// Emergency lockdown - revoke all permissions for all files
export const emergencyLockdownAll = async (contract, signer, userFiles) => {
  try {
    if (!contract || !signer) {
      throw new Error('Blockchain not initialized')
    }
    
    const results = []
    let totalTransactions = 0
    
    for (const file of userFiles) {
      // Get all active permissions for this file from database
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('recipient_email, file_id')
        .eq('file_id', file.id)
        .eq('status', 'active')
      
      if (error) {
        console.warn(`Failed to get permissions for file ${file.id}:`, error)
        continue
      }
      
      // Revoke each permission on blockchain
      for (const permission of permissions || []) {
        try {
          const result = await revokeVirtualPermission(
            contract, 
            signer, 
            permission.file_id, 
            permission.recipient_email
          )
          
          results.push({
            fileId: permission.file_id,
            email: permission.recipient_email,
            success: true,
            transactionHash: result.transactionHash
          })
          
          totalTransactions++
        } catch (revokeError) {
          console.error(`Failed to revoke permission for ${permission.recipient_email}:`, revokeError)
          results.push({
            fileId: permission.file_id,
            email: permission.recipient_email,
            success: false,
            error: revokeError.message
          })
        }
      }
    }
    
    return {
      success: true,
      totalTransactions,
      results,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error('Emergency lockdown error:', error)
    throw error
  }
}

// Get blockchain transaction details for court evidence
export const getTransactionEvidence = async (provider, transactionHash) => {
  try {
    if (!provider || !transactionHash) {
      return null
    }
    
    const tx = await provider.getTransaction(transactionHash)
    const receipt = await provider.getTransactionReceipt(transactionHash)
    const block = await provider.getBlock(receipt.blockNumber)
    
    return {
      transactionHash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      timestamp: new Date(block.timestamp * 1000),
      from: tx.from,
      to: tx.to,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'Success' : 'Failed',
      explorerUrl: `https://amoy.polygonscan.com/tx/${transactionHash}`,
      confirmations: receipt.confirmations
    }
  } catch (error) {
    console.error('Error getting transaction evidence:', error)
    return null
  }
}