// Fallback service when external APIs are unavailable

// Fallback motivational messages when AI is unavailable
export const getFallbackMotivation = (userName = 'User', timeOfDay = 'day') => {
  const motivations = {
    morning: [
      `Good morning, ${userName}! ☀️ Your privacy is your power - start your day with confidence.`,
      `Rise and shine, ${userName}! ✨ Every secure file you create is a step towards digital freedom.`,
      `Morning, ${userName}! 🌅 Take control of your data, take control of your life.`,
      `Hello ${userName}! 🌟 Another day to protect what matters most to you.`
    ],
    afternoon: [
      `Good afternoon, ${userName}! 🌤️ Keep your files secure, keep your mind at peace.`,
      `Hey ${userName}! ☀️ Your commitment to privacy inspires us all.`,
      `Afternoon, ${userName}! 🌈 Strong security habits lead to strong digital independence.`,
      `Hello ${userName}! ⭐ You're doing amazing by choosing security first.`
    ],
    evening: [
      `Good evening, ${userName}! 🌆 End your day knowing your data is safe and secure.`,
      `Evening, ${userName}! 🌙 Rest easy knowing you're in control of your digital life.`,
      `Hey ${userName}! 🌟 Another day of smart choices and secure practices.`,
      `Hello ${userName}! ✨ Your dedication to privacy makes a difference.`
    ],
    night: [
      `Good evening, ${userName}! 🌙 Sleep soundly knowing your files are protected.`,
      `Hey ${userName}! ⭐ End your day with the confidence that comes from true security.`,
      `Evening, ${userName}! 🌌 Your privacy-first approach is inspiring.`,
      `Hello ${userName}! 💫 Sweet dreams, knowing your data is safe.`
    ]
  }

  const timeMessages = motivations[timeOfDay] || motivations.day
  return timeMessages[Math.floor(Math.random() * timeMessages.length)]
}

// Fallback help responses when AI is unavailable
export const getFallbackHelp = (question = '') => {
  const lowerQuestion = question.toLowerCase()

  if (lowerQuestion.includes('share') || lowerQuestion.includes('send')) {
    return `To share files securely in SecureVault:

1. **Email Sharing**: Click the 📧 Email button next to any file to share via email with end-to-end encryption.

2. **Social Sharing**: Click the 📱 Social button to share on WhatsApp, Telegram, Twitter, Facebook, and other platforms.

3. **Expiration Control**: Set how long the recipient can access your file (1 day to 1 year).

4. **Revoke Access**: Use the ⋯ menu → "Revoke Access" to make files inaccessible to recipients at any time.

All shares are encrypted and you maintain full control over access.`
  }

  if (lowerQuestion.includes('security') || lowerQuestion.includes('safe') || lowerQuestion.includes('protect')) {
    return `SecureVault protects you with multiple security layers:

🔐 **End-to-End Encryption**: Your files are encrypted before they leave your device.

⏰ **Auto-Logout**: Automatic logout after 10 minutes of inactivity for protection.

🚨 **Emergency Lockdown**: Instantly revoke all file access if you feel unsafe.

🔍 **AI Security Monitoring**: Automatic scanning for potential threats and suspicious files.

🌐 **Blockchain Permissions**: Immutable access control on Polygon network (optional).

💡 **Privacy Tips**: 
- Use strong, unique passwords
- Enable two-factor authentication
- Regularly review shared files
- Be cautious with file metadata`
  }

  if (lowerQuestion.includes('upload') || lowerQuestion.includes('file')) {
    return `To upload and manage files:

📤 **Upload**: Click "Upload File" → Drag & drop or browse for files up to 50MB.

🖼️ **Thumbnails**: Images show preview thumbnails automatically.

🏷️ **Organization**: Files are automatically categorized by type.

⚙️ **File Actions**:
- 📧 Email: Share via email with encryption
- 📱 Social: Share on social media platforms  
- ⋯ Menu: Revoke, destroy, or delete files

🔒 **Security**: All files are encrypted automatically. Add extra password protection for sensitive files.`
  }

  if (lowerQuestion.includes('help') || lowerQuestion.includes('support')) {
    return `Need more help? Here are your options:

💬 **AI Chat**: I'm here to answer questions about SecureVault features and digital safety.

📚 **GitHub**: Visit https://github.com/sibby-killer/DataDignity-Vault for documentation and technical details.

🚨 **Emergency**: Use the Emergency Lockdown feature if you feel unsafe - it instantly revokes all file access.

🆘 **GBV Support**: This platform is designed with Gender-Based Violence prevention in mind. Your safety and privacy are our top priorities.

📧 **Contact**: For urgent issues, create an issue on our GitHub repository.`
  }

  // General fallback
  return `I'm here to help with SecureVault! Here's what I can assist you with:

🔐 **Security Questions**: File encryption, privacy protection, and safety features

📱 **File Sharing**: Email and social media sharing with encryption

⚙️ **Platform Features**: Uploads, downloads, organization, and permissions

🚨 **Emergency Features**: Lockdown, revocation, and safety tools

🌟 **Digital Safety**: Best practices for online privacy and security

Ask me anything specific about SecureVault, digital security, or privacy protection!

For technical documentation, visit: https://github.com/sibby-killer/DataDignity-Vault`
}

// Fallback share message when AI is unavailable
export const getFallbackShareMessage = (fileName, senderName, expiryDate = null) => {
  const expiryText = expiryDate 
    ? ` This secure link will expire on ${new Date(expiryDate).toLocaleDateString()}.`
    : ' This file has been shared with no expiration date.'

  return `Hello!

${senderName} has securely shared "${fileName}" with you through SecureVault.

🔐 **Your file is fully encrypted** for maximum privacy and security.${expiryText}

🛡️ **Security Features**:
- End-to-end encryption protects your file
- Zero-knowledge architecture - even we can't see your files  
- Blockchain-powered access controls
- Automatic expiration for your safety

⚠️ **Safety Reminders**:
- Only download files from people you trust
- Scan downloaded files with antivirus software
- Keep your account credentials secure and private
- Report any suspicious activity immediately

💜 **About SecureVault**: We're committed to digital safety and privacy, especially for vulnerable individuals. Your security is our mission.

---
Shared with ❤️ via SecureVault
🌟 Privacy-focused • 🔐 Secure by design • 🌍 Open source
GitHub: https://github.com/sibby-killer/DataDignity-Vault`
}

// Check if external services are available
export const checkServiceHealth = async () => {
  const health = {
    gemini: false,
    supabase: false,
    blockchain: false
  }

  // Check Gemini API
  try {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
      health.gemini = true
    }
  } catch (error) {
    health.gemini = false
  }

  // Check Supabase
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (supabaseUrl) {
      health.supabase = true
    }
  } catch (error) {
    health.supabase = false
  }

  // Check blockchain
  try {
    if (window.ethereum) {
      health.blockchain = true
    }
  } catch (error) {
    health.blockchain = false
  }

  return health
}