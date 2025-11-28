/**
 * Email-based wallet generation service
 * Generates deterministic wallet addresses from email for permission management
 */

import { ethers } from 'ethers';
import { getUserByEmail, updateUserProfile } from './supabase';

/**
 * Generate deterministic wallet address from email
 * Note: This is a simplified approach for the MVP
 * In production, consider using a more secure method
 * @param {string} email - User email
 * @returns {string} Wallet address
 */
function generateWalletFromEmail(email) {
    // Create deterministic hash from email
    const hash = ethers.keccak256(ethers.toUtf8Bytes(email.toLowerCase()));

    // Use hash as private key (simplified for MVP)
    const wallet = new ethers.Wallet(hash);

    return wallet.address;
}

/**
 * Get or create recipient wallet from email
 * @param {string} email - Recipient email
 * @returns {Promise<{address: string, isNew: boolean}>}
 */
export async function getOrCreateRecipientWallet(email) {
    try {
        // Check if user exists in database
        const user = await getUserByEmail(email);

        if (user && user.wallet_address) {
            // User exists with wallet
            return {
                address: user.wallet_address,
                isNew: false
            };
        }

        // Generate new wallet address
        const walletAddress = generateWalletFromEmail(email);

        if (user) {
            // Update existing user with wallet address
            await updateUserProfile(user.id, { wallet_address: walletAddress });
        }
        // Note: If user doesn't exist, wallet will be created when they sign up

        return {
            address: walletAddress,
            isNew: true
        };
    } catch (error) {
        console.error('Wallet generation error:', error);
        throw new Error(`Failed to generate wallet: ${error.message}`);
    }
}

/**
 * Validate Ethereum address
 * @param {string} address - Ethereum address
 * @returns {boolean}
 */
export function isValidAddress(address) {
    return ethers.isAddress(address);
}

/**
 * Format address for display (0x1234...5678)
 * @param {string} address - Full address
 * @returns {string} Formatted address
 */
export function formatAddress(address) {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
