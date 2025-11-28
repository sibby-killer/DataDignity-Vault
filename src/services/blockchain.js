/**
 * Blockchain integration using ethers.js for Polygon Amoy Testnet
 * Handles smart contract interactions for file permissions
 */

import { ethers } from 'ethers';

const AMOY_RPC_URL = import.meta.env.VITE_AMOY_RPC_URL;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '80002');

// Smart contract ABI (will be updated after contract deployment)
const CONTRACT_ABI = [
    "function registerFile(string fileId, address owner, string storagePath) external",
    "function grantAccess(string fileId, address recipient) external",
    "function revokeAccess(string fileId, address recipient) external",
    "function revokeAllAccess() external",
    "function hasAccess(string fileId, address user) external view returns (bool)",
    "event FileRegistered(string indexed fileId, address indexed owner, string storagePath)",
    "event AccessGranted(string indexed fileId, address indexed recipient, address indexed grantedBy)",
    "event AccessRevoked(string indexed fileId, address indexed recipient)",
    "event LockdownExecuted(address indexed user, uint256 filesAffected)"
];

let provider = null;
let contract = null;

/**
 * Initialize blockchain provider and contract
 * @returns {Promise<void>}
 */
export async function initBlockchain() {
    try {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            // Use MetaMask provider
            provider = new ethers.BrowserProvider(window.ethereum);

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Check if on correct network
            const network = await provider.getNetwork();
            if (Number(network.chainId) !== CHAIN_ID) {
                await switchToAmoy();
            }
        } else {
            // Fallback to RPC provider (read-only)
            provider = new ethers.JsonRpcProvider(AMOY_RPC_URL);
        }

        // Initialize contract
        if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x...') {
            const signer = await provider.getSigner();
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        }
    } catch (error) {
        console.error('Blockchain initialization error:', error);
        throw error;
    }
}

/**
 * Switch to Amoy network in MetaMask
 * @returns {Promise<void>}
 */
export async function switchToAmoy() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
        });
    } catch (switchError) {
        // Network not added, add it
        if (switchError.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${CHAIN_ID.toString(16)}`,
                    chainName: 'Polygon Amoy Testnet',
                    nativeCurrency: {
                        name: 'MATIC',
                        symbol: 'MATIC',
                        decimals: 18
                    },
                    rpcUrls: [AMOY_RPC_URL],
                    blockExplorerUrls: ['https://amoy.polygonscan.com/']
                }],
            });
        } else {
            throw switchError;
        }
    }
}

/**
 * Register file on blockchain
 * @param {string} fileId - File ID
 * @param {string} storagePath - Storage path
 * @returns {Promise<Object>} Transaction receipt
 */
export async function registerFile(fileId, storagePath) {
    if (!contract) await initBlockchain();

    try {
        const signer = await provider.getSigner();
        const ownerAddress = await signer.getAddress();

        const tx = await contract.registerFile(fileId, ownerAddress, storagePath);
        const receipt = await tx.wait();

        return {
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            status: receipt.status === 1 ? 'confirmed' : 'failed'
        };
    } catch (error) {
        console.error('Register file error:', error);
        throw new Error(`Blockchain registration failed: ${error.message}`);
    }
}

/**
 * Grant access to a file
 * @param {string} fileId - File ID
 * @param {string} recipientAddress - Recipient wallet address
 * @returns {Promise<Object>} Transaction receipt
 */
export async function grantAccess(fileId, recipientAddress) {
    if (!contract) await initBlockchain();

    try {
        const tx = await contract.grantAccess(fileId, recipientAddress);
        const receipt = await tx.wait();

        return {
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            status: receipt.status === 1 ? 'confirmed' : 'failed'
        };
    } catch (error) {
        console.error('Grant access error:', error);
        throw new Error(`Failed to grant access: ${error.message}`);
    }
}

/**
 * Revoke access to a file
 * @param {string} fileId - File ID
 * @param {string} recipientAddress - Recipient wallet address
 * @returns {Promise<Object>} Transaction receipt
 */
export async function revokeAccess(fileId, recipientAddress) {
    if (!contract) await initBlockchain();

    try {
        const tx = await contract.revokeAccess(fileId, recipientAddress);
        const receipt = await tx.wait();

        return {
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            status: receipt.status === 1 ? 'confirmed' : 'failed'
        };
    } catch (error) {
        console.error('Revoke access error:', error);
        throw new Error(`Failed to revoke access: ${error.message}`);
    }
}

/**
 * Emergency lockdown - revoke all file permissions
 * @returns {Promise<Object>} Transaction receipt
 */
export async function revokeAllAccess() {
    if (!contract) await initBlockchain();

    try {
        const tx = await contract.revokeAllAccess();
        const receipt = await tx.wait();

        return {
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            status: receipt.status === 1 ? 'confirmed' : 'failed'
        };
    } catch (error) {
        console.error('Lockdown error:', error);
        throw new Error(`Lockdown failed: ${error.message}`);
    }
}

/**
 * Check if user has access to a file
 * @param {string} fileId - File ID
 * @param {string} userAddress - User wallet address
 * @returns {Promise<boolean>}
 */
export async function hasAccess(fileId, userAddress) {
    if (!contract) await initBlockchain();

    try {
        return await contract.hasAccess(fileId, userAddress);
    } catch (error) {
        console.error('Check access error:', error);
        return false;
    }
}

/**
 * Get current wallet address
 * @returns {Promise<string>}
 */
export async function getWalletAddress() {
    if (!provider) await initBlockchain();

    const signer = await provider.getSigner();
    return await signer.getAddress();
}

/**
 * Listen for contract events
 * @param {string} eventName - Event name
 * @param {Function} callback - Callback function
 */
export function listenToEvent(eventName, callback) {
    if (!contract) {
        console.warn('Contract not initialized');
        return;
    }

    contract.on(eventName, callback);
}

/**
 * Stop listening to contract events
 * @param {string} eventName - Event name
 * @param {Function} callback - Callback function
 */
export function stopListening(eventName, callback) {
    if (!contract) return;

    contract.off(eventName, callback);
}
