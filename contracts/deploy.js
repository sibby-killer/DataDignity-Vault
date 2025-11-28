/**
 * Smart Contract Deployment Script
 * Deploys SecureVault contract to Polygon Mumbai
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MUMBAI_RPC_URL = process.env.VITE_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com';

if (!PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in environment variables');
    console.log('Please add your MetaMask private key to .env file');
    process.exit(1);
}

async function main() {
    console.log('🚀 Deploying SecureVault contract to Polygon Mumbai...\n');

    // Connect to Mumbai network
    const provider = new ethers.JsonRpcProvider(MUMBAI_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('📍 Deploying from address:', wallet.address);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Balance:', ethers.formatEther(balance), 'MATIC\n');

    if (balance === 0n) {
        console.error('❌ No MATIC balance. Get free testnet MATIC from:');
        console.log('   https://faucet.polygon.technology\n');
        process.exit(1);
    }

    // Read contract source
    const contractPath = path.join(__dirname, 'SecureVault.sol');
    const contractSource = fs.readFileSync(contractPath, 'utf8');

    // For this example, we'll use a pre-compiled ABI and bytecode
    // In production, you'd use Hardhat or Foundry to compile
    console.log('⚠️  Note: This script requires the contract to be compiled first.');
    console.log('   Use Remix IDE (https://remix.ethereum.org) to compile and get ABI/bytecode\n');
    console.log('📝 Contract source saved at:', contractPath);
    console.log('\nNext steps:');
    console.log('1. Copy the contract code to Remix IDE');
    console.log('2. Compile with Solidity 0.8.0+');
    console.log('3. Deploy to Mumbai using MetaMask');
    console.log('4. Copy the contract address to your .env file as VITE_CONTRACT_ADDRESS');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
