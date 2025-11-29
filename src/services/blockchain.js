import { ethers } from 'ethers'

// Contract ABI - Define the interface for SecureVault contract
const SECURE_VAULT_ABI = [
  "function registerFile(string memory fileHash, string memory fileName, uint256 fileSize) external returns (uint256)",
  "function shareFile(uint256 fileId, address recipient, uint256 expiryTimestamp) external",
  "function revokeAccess(uint256 fileId, address recipient) external",
  "function getFileInfo(uint256 fileId) external view returns (string memory, string memory, uint256, address, uint256)",
  "function hasAccess(uint256 fileId, address user) external view returns (bool)",
  "function emergencyLockdown() external",
  "function isLockedDown() external view returns (bool)",
  "event FileRegistered(uint256 indexed fileId, string fileHash, address indexed owner)",
  "event FileShared(uint256 indexed fileId, address indexed recipient, uint256 expiryTimestamp)",
  "event AccessRevoked(uint256 indexed fileId, address indexed recipient)"
]

// Network configuration
const AMOY_CONFIG = {
  chainId: '0x13882', // 80002 in hex
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology/'],
  blockExplorerUrls: ['https://amoy.polygonscan.com/']
}

let provider = null
let signer = null
let contract = null
let userAddress = null

// Initialize blockchain connection
export const initBlockchain = async () => {
  try {
    // Prevent multiple initializations
    if (provider && userAddress) {
      return { success: true, address: userAddress }
    }

    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to use blockchain features.')
    }

    // Create provider
    provider = new ethers.BrowserProvider(window.ethereum)
    
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' })
    
    // Get signer
    signer = await provider.getSigner()
    userAddress = await signer.getAddress()
    
    // Check if we're on the correct network
    const network = await provider.getNetwork()
    if (network.chainId !== BigInt(80002)) {
      await switchToAmoyNetwork()
    }
    
    // Initialize contract
    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS
    if (!contractAddress) {
      console.warn('Contract address not configured, blockchain features limited')
    } else {
      contract = new ethers.Contract(contractAddress, SECURE_VAULT_ABI, signer)
    }
    
    console.log('Blockchain initialized successfully')
    console.log('User address:', userAddress)
    console.log('Network:', network.name, 'Chain ID:', network.chainId.toString())
    
    return { success: true, address: userAddress }
  } catch (error) {
    console.error('Blockchain initialization error:', error)
    throw error
  }
}

// Switch to Polygon Amoy testnet
export const switchToAmoyNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: AMOY_CONFIG.chainId }]
    })
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [AMOY_CONFIG]
        })
      } catch (addError) {
        throw new Error('Failed to add Polygon Amoy network to MetaMask')
      }
    } else {
      throw new Error('Failed to switch to Polygon Amoy network')
    }
  }
}

// Register a file on the blockchain
export const registerFile = async (fileHash, fileName, fileSize) => {
  try {
    if (!contract) {
      const result = await initBlockchain()
      if (!result.success) {
        throw new Error('Blockchain not initialized')
      }
    }
    
    // Estimate gas for the transaction
    const gasEstimate = await contract.registerFile.estimateGas(fileHash, fileName, fileSize)
    const gasLimit = gasEstimate * BigInt(120) / BigInt(100) // Add 20% buffer
    
    // Execute transaction
    const tx = await contract.registerFile(fileHash, fileName, fileSize, {
      gasLimit
    })
    
    console.log('Transaction sent:', tx.hash)
    
    // Wait for confirmation
    const receipt = await tx.wait()
    console.log('File registered on blockchain:', receipt.transactionHash)
    
    // Extract file ID from logs
    const fileRegisteredEvent = receipt.logs.find(log => {
      try {
        const decoded = contract.interface.parseLog(log)
        return decoded.name === 'FileRegistered'
      } catch {
        return false
      }
    })
    
    if (fileRegisteredEvent) {
      const decoded = contract.interface.parseLog(fileRegisteredEvent)
      const fileId = decoded.args.fileId.toString()
      console.log('File ID:', fileId)
      return { success: true, fileId, transactionHash: receipt.transactionHash }
    }
    
    return { success: true, transactionHash: receipt.transactionHash }
  } catch (error) {
    console.error('Blockchain registration error:', error)
    
    // Handle specific error cases
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user')
    } else if (error.code === -32603) {
      throw new Error('Internal error - check network connection')
    } else if (error.reason) {
      throw new Error(`Contract error: ${error.reason}`)
    }
    
    throw new Error(`Blockchain registration failed: ${error.message}`)
  }
}

// Share a file with another user
export const shareFile = async (fileId, recipientAddress, expiryDays = 30) => {
  try {
    if (!contract) {
      await initBlockchain()
    }
    
    // Calculate expiry timestamp (days from now)
    const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60)
    
    // Validate recipient address
    if (!ethers.isAddress(recipientAddress)) {
      throw new Error('Invalid recipient address')
    }
    
    // Execute transaction
    const tx = await contract.shareFile(fileId, recipientAddress, expiryTimestamp)
    console.log('Share transaction sent:', tx.hash)
    
    const receipt = await tx.wait()
    console.log('File shared on blockchain:', receipt.transactionHash)
    
    return { success: true, transactionHash: receipt.transactionHash }
  } catch (error) {
    console.error('Blockchain sharing error:', error)
    
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user')
    }
    
    throw new Error(`Blockchain sharing failed: ${error.message}`)
  }
}

// Revoke access to a file
export const revokeFileAccess = async (fileId, recipientAddress) => {
  try {
    if (!contract) {
      await initBlockchain()
    }
    
    const tx = await contract.revokeAccess(fileId, recipientAddress)
    console.log('Revoke transaction sent:', tx.hash)
    
    const receipt = await tx.wait()
    console.log('Access revoked on blockchain:', receipt.transactionHash)
    
    return { success: true, transactionHash: receipt.transactionHash }
  } catch (error) {
    console.error('Blockchain revoke error:', error)
    throw new Error(`Failed to revoke access: ${error.message}`)
  }
}

// Check if user has access to a file
export const checkFileAccess = async (fileId, userAddress) => {
  try {
    if (!contract) {
      await initBlockchain()
    }
    
    const hasAccess = await contract.hasAccess(fileId, userAddress)
    return hasAccess
  } catch (error) {
    console.error('Error checking file access:', error)
    return false
  }
}

// Get file information from blockchain
export const getFileInfo = async (fileId) => {
  try {
    if (!contract) {
      await initBlockchain()
    }
    
    const fileInfo = await contract.getFileInfo(fileId)
    return {
      fileHash: fileInfo[0],
      fileName: fileInfo[1],
      fileSize: fileInfo[2].toString(),
      owner: fileInfo[3],
      createdAt: new Date(Number(fileInfo[4]) * 1000)
    }
  } catch (error) {
    console.error('Error getting file info:', error)
    return null
  }
}

// Emergency lockdown
export const emergencyLockdown = async () => {
  try {
    if (!contract) {
      await initBlockchain()
    }
    
    const tx = await contract.emergencyLockdown()
    console.log('Emergency lockdown transaction sent:', tx.hash)
    
    const receipt = await tx.wait()
    console.log('Emergency lockdown activated:', receipt.transactionHash)
    
    return { success: true, transactionHash: receipt.transactionHash }
  } catch (error) {
    console.error('Emergency lockdown error:', error)
    throw new Error(`Emergency lockdown failed: ${error.message}`)
  }
}

// Check if system is locked down
export const isSystemLockedDown = async () => {
  try {
    if (!contract) {
      await initBlockchain()
    }
    
    const isLocked = await contract.isLockedDown()
    return isLocked
  } catch (error) {
    console.error('Error checking lockdown status:', error)
    return false
  }
}

// Get current user's wallet address
export const getCurrentWalletAddress = () => {
  return userAddress
}

// Check if MetaMask is connected
export const isMetaMaskConnected = async () => {
  try {
    if (!window.ethereum) {
      return false
    }
    
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    return accounts.length > 0
  } catch (error) {
    console.error('Error checking MetaMask connection:', error)
    return false
  }
}

// Connect to MetaMask
export const connectMetaMask = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }
    
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    
    if (accounts.length > 0) {
      await initBlockchain()
      return { success: true, address: accounts[0] }
    } else {
      throw new Error('No accounts found')
    }
  } catch (error) {
    console.error('MetaMask connection error:', error)
    throw error
  }
}

// Listen for account changes
export const onAccountChanged = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        userAddress = accounts[0]
        initBlockchain().then(() => callback(accounts[0]))
      } else {
        userAddress = null
        provider = null
        signer = null
        contract = null
        callback(null)
      }
    })
  }
}

// Listen for network changes
export const onNetworkChanged = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', (chainId) => {
      // Reload the page when network changes
      window.location.reload()
    })
  }
}

// Utility function to generate file hash
export const generateFileHash = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  } catch (error) {
    console.error('Error generating file hash:', error)
    return null
  }
}

// Format address for display
export const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Get transaction URL for explorer
export const getTransactionUrl = (txHash) => {
  return `https://amoy.polygonscan.com/tx/${txHash}`
}

// Get account URL for explorer  
export const getAccountUrl = (address) => {
  return `https://amoy.polygonscan.com/address/${address}`
}