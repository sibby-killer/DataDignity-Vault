/**
 * Gemini Help Service
 * Provides interactive help and guidance for new users
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using Gemini 1.5 Pro - Best model for students (free tier includes this!)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

/**
 * Get help from Gemini AI
 * @param {string} userQuestion - User's question or help request
 * @param {string} currentPage - Current page user is on
 * @returns {Promise<string>} AI-generated help response
 */
export async function getHelp(userQuestion, currentPage = 'dashboard') {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
        return "Help system is not configured. Please add your Gemini API key to use the interactive help feature.";
    }

    const systemContext = `You are a friendly, helpful assistant for SecureVault, a privacy-focused file storage platform for women. 

Key features of SecureVault:
- Client-side AES-GCM 256-bit encryption (files encrypted in browser before upload)
- Secure file storage with Supabase
- Blockchain-based permissions on Polygon Amoy Testnet
- Email-based file sharing (automatic wallet generation)
- Emergency lockdown feature (revokes all permissions instantly)
- AI-powered breach detection
- Activity logging for all actions

Current page: ${currentPage}

Guidelines:
- Be warm, friendly, and encouraging
- Use simple language, avoid technical jargon
- Provide step-by-step instructions when needed
- Emphasize privacy and security features
- Be concise but thorough
- Use emojis occasionally to be friendly 😊

User question: ${userQuestion}`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: systemContext
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 512,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const helpText = data.candidates[0]?.content?.parts[0]?.text;

        if (!helpText) {
            throw new Error('No response from Gemini API');
        }

        return helpText;
    } catch (error) {
        console.error('Help system error:', error);
        return `I'm having trouble connecting right now. Here are some quick tips:

📤 **Upload Files**: Click the "Upload File" button in the header
🔒 **Encryption**: Your files are automatically encrypted before upload
📧 **Share Files**: Click the menu (⋮) on any file and select "Share"
🚨 **Emergency**: Use the lockdown button to revoke all permissions instantly

For more help, check out the Settings page or try asking again!`;
    }
}

/**
 * Get quick start guide
 * @returns {Promise<string>}
 */
export async function getQuickStart() {
    return getHelp("I'm new to SecureVault. Can you give me a quick tour of how to get started?", "help");
}

/**
 * Get feature explanation
 * @param {string} feature - Feature name
 * @returns {Promise<string>}
 */
export async function explainFeature(feature) {
    return getHelp(`Can you explain the ${feature} feature and how to use it?`, "help");
}
