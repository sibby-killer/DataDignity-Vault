# DataDignity Vault (SecureVault)

A secure, privacy-focused file storage platform built entirely with **free tools**. Features client-side encryption, blockchain-based permissions, and AI-powered breach detection.

> **Built for the PLP Hackathon - GBV Data Protection Challenge**

---

## 👥 Team Members & Contributors

This project was collaboratively built by:

### **Alfred Nyongesa** - Team Leader & Lead Developer
- **Email**: alfrednyongesa411@gmail.com
- **Phone**: +254762667048
- **Role**: Project architecture, blockchain integration, encryption implementation, and overall technical leadership

### **Sarota Raphael** - Frontend Developer
- **Email**: topherralph@gmail.com
- **Phone**: +254113349597
- **Role**: UI/UX design, React components, Tailwind CSS styling, and responsive design implementation

### **Rency Jeptanui** - Backend Developer
- **Email**: jeptanuirency313@gmail.com
- **Phone**: +254722514616
- **Role**: Supabase integration, database schema design, RLS policies, and API integration

### **Karen Wanjiru** - AI Integration Specialist
- **Email**: karenwanjiru09@gmail.com
- **Phone**: +254741403997
- **Role**: Gemini AI integration, breach detection system, and help feature implementation

### **Julius Mulwa** - Smart Contract Developer
- **Email**: juliusmusilimulwa@gmail.com
- **Phone**: +254746516069
- **Role**: Solidity smart contract development, blockchain permissions, and Web3 integration

### **Teresiah Waweru** - QA & Documentation
- **Email**: tessywaweru.06@gmail.com
- **Phone**: +254710969394
- **Role**: Testing, quality assurance, documentation, and user guides

---

## ✨ Features

- 🔒 **End-to-End Encryption** - AES-GCM 256-bit client-side encryption
- 📦 **Secure Storage** - Files stored encrypted on Supabase Storage
- ⛓️ **Blockchain Permissions** - Smart contract-based access control on Polygon Amoy Testnet
- 🤖 **AI Breach Detection** - Gemini-powered breach scanning
- 💬 **AI Help Assistant** - Interactive Gemini-powered help for new users
- 📧 **Email-Based Sharing** - Automatic wallet generation for recipients
- 🚨 **Emergency Lockdown** - Instantly revoke all permissions
- 📊 **Activity Logging** - Complete audit trail of all actions
- 🔑 **Encrypted Backup Keys** - Optional password recovery via email

## 🛠️ Tech Stack

All services are **100% free**:

- **Frontend**: React + Vite + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (1GB free)
- **Authentication**: Supabase Auth
- **Blockchain**: Polygon Amoy Testnet
- **AI**: Google Gemini Pro API
- **Encryption**: Web Crypto API (browser-native)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/sibby-killer/DataDignity-Vault.git
cd DataDignity-Vault
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Free Services

Follow the detailed setup guide: **[SETUP.md](./SETUP.md)**

You'll need:
- Supabase account (free)
- Gemini API key (free)
- MetaMask wallet with Amoy testnet POL (free from faucet)

### 4. Configure Environment

Copy `.env.example` to `.env` and fill in your API keys:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
VITE_CHAIN_ID=80002
VITE_CONTRACT_ADDRESS=0x... (after deployment)
```

### 5. Setup Database

1. Go to your Supabase project
2. Open **SQL Editor**
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the query

### 6. Deploy Smart Contract

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create new file `SecureVault.sol`
3. Copy contents from `contracts/SecureVault.sol`
4. Compile with Solidity 0.8.0+
5. Deploy to **Polygon Amoy Testnet** using MetaMask
6. Copy contract address to `.env`

#### Adding Polygon Amoy Testnet to MetaMask

> **⚠️ IMPORTANT**: Mumbai testnet (Chain ID: 80001) was **deprecated in April 2024**. Use **Amoy testnet** instead!

**✅ Polygon Amoy Testnet Configuration:**

```
Network Name: Polygon Amoy Testnet
RPC URL: https://rpc-amoy.polygon.technology/
Chain ID: 80002
Currency Symbol: POL
Block Explorer: https://amoy.polygonscan.com/
```

**Quick Add via ChainList (Recommended):**
1. Visit https://chainlist.org
2. Enable "Testnets" toggle
3. Search for "Amoy"
4. Click "Connect Wallet" next to Polygon Amoy
5. Approve in MetaMask - done! ✨

**Get Test POL:**
- Visit [Polygon Faucet](https://faucet.polygon.technology/)
- Select "Polygon Amoy"
- Enter your wallet address
- Receive free test POL

### 7. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Upload a File

1. Click **Upload File** button
2. Select a file (max 50MB)
3. Enter an encryption password
4. File is encrypted locally, uploaded to Supabase Storage, and registered on blockchain

### Share a File

1. Click the menu (⋮) on any file card
2. Select **Share**
3. Enter recipient's email
4. Optional: Set expiry date
5. Recipient gets automatic wallet and email notification

### Get Help

1. Click **Help** in the sidebar
2. Ask the AI assistant any questions
3. Get step-by-step guidance on using features
4. Interactive chat powered by Gemini AI

### Emergency Lockdown

1. Go to **Settings**
2. Scroll to **Danger Zone**
3. Click **Execute Lockdown**
4. Type `LOCKDOWN` to confirm
5. All permissions are instantly revoked (irreversible)

## 🔐 Security

### Client-Side Encryption

- All encryption happens in your browser using Web Crypto API
- Passwords never leave your device
- Files are encrypted before upload
- Only you can decrypt your files

### Blockchain Permissions

- All file permissions recorded on Polygon Mumbai blockchain
- Immutable audit trail
- Decentralized access control
- Emergency lockdown function

## 📊 Free Tier Limits

| Service | Limit | What We Use |
|---------|-------|-------------|
| Supabase | 500MB DB, 1GB storage | Database, Auth, Storage |
| Gemini Pro | 1,500 requests/day | Breach scanning + Help |
| Polygon Amoy | Unlimited | Smart contracts (testnet) |

**Total Cost: $0/month** ✅

## 🎯 Project Goals

This project was built to address Gender-Based Violence (GBV) data protection challenges by:

1. **Empowering Women**: Providing a secure platform for storing sensitive documents
2. **Privacy First**: Client-side encryption ensures complete privacy
3. **Easy Sharing**: Share files securely without technical knowledge
4. **Emergency Protection**: Instant lockdown for dangerous situations
5. **Transparency**: Blockchain-based audit trail
6. **Accessibility**: Free tools make it accessible to everyone

## 🏆 Hackathon Submission

- **Event**: PLP Hackathon - GBV Data Protection Challenge
- **Team**: DataDignity Vault Team
- **Category**: Privacy & Security
- **Date**: November 2025

## 📝 License

MIT License - feel free to use for your own projects!

## 🙏 Acknowledgments

Built with free and open-source tools:
- [Supabase](https://supabase.com) - Backend infrastructure
- [Polygon](https://polygon.technology) - Blockchain network
- [Google Gemini](https://ai.google.dev) - AI assistance
- [Ethers.js](https://ethers.org) - Ethereum library
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Lucide Icons](https://lucide.dev) - Icons

## 📞 Contact

For questions or support, reach out to any team member listed above.

---

**Made with ❤️ for women's privacy and security**

**#GBV #DataProtection #Privacy #Blockchain #AI**
