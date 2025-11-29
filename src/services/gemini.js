import { geminiRateLimiter } from '../utils/performanceOptimizer'
import { getFallbackHelp, getFallbackShareMessage } from './fallbackService'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

// Helper function to make API requests to Gemini
export const makeGeminiRequest = async (prompt, systemInstruction = '') => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured')
    }

    // Check rate limit
    if (!geminiRateLimiter.canMakeRequest()) {
      const waitTime = geminiRateLimiter.getWaitTime()
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error response:', errorData)
      throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini API')
    }

    if (data.candidates[0].finishReason === 'SAFETY') {
      throw new Error('Content was blocked by safety filters')
    }

    return data.candidates[0].content.parts[0].text
  } catch (error) {
    console.error('Gemini API request failed:', error)
    throw error
  }
}

// Help system - AI assistant for user questions
export const getHelp = async (question, context = '') => {
  try {
    // Check if API key is available and valid
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('Gemini API key not configured, using fallback help')
      return getFallbackHelp(question)
    }

    const systemInstruction = `You are SecureVault AI Assistant, a supportive and empowering digital security companion.

    CORE MISSION: Support users in taking control of their digital privacy and security, with special focus on Gender-Based Violence (GBV) prevention and digital safety for vulnerable individuals.

    PLATFORM KNOWLEDGE:
    - SecureVault: Privacy-focused file storage with end-to-end encryption
    - Features: Blockchain permissions (Polygon), AI security monitoring, secure sharing
    - Emergency lockdown for immediate protection
    - Social media sharing with encrypted, expiring links
    - Time-based access controls and file revocation

    GBV & DIGITAL SAFETY GUIDELINES:
    - Always prioritize user safety and privacy
    - Provide clear guidance on digital security practices
    - Recognize signs of digital harassment or surveillance
    - Offer practical steps for protecting sensitive information
    - Support users in maintaining control over their data
    - Never judge or blame users for their situations

    SECURITY BEST PRACTICES:
    - Use strong, unique passwords and 2FA
    - Regularly review shared files and permissions
    - Be cautious about metadata in images/files
    - Use emergency lockdown if feeling unsafe
    - Keep software updated and use encrypted communications

    For detailed technical information, refer users to: https://github.com/sibby-killer/DataDignity-Vault

    Be supportive, non-judgmental, and prioritize safety above all else.`

    const prompt = context 
      ? `User context: ${context}\n\nUser question: ${question}`
      : `User question: ${question}`

    const response = await makeGeminiRequest(prompt, systemInstruction)
    return response
  } catch (error) {
    console.error('Help system error:', error)
    // Return fallback help instead of throwing error
    return getFallbackHelp(question)
  }
}

// Breach detection - scan files for potential security issues
export const scanForBreaches = async (fileName, fileSize, fileType, metadata = {}) => {
  try {
    const systemInstruction = `You are a cybersecurity expert analyzing files for potential security risks. 
    Analyze the provided file metadata and identify any potential security concerns.
    
    Focus on:
    - Suspicious file extensions or types
    - Unusual file sizes for the type
    - Potentially dangerous file names
    - Signs of malware or suspicious patterns
    - Privacy risks
    
    Respond with a JSON object containing:
    {
      "riskLevel": "low|medium|high|critical",
      "issues": ["array of specific issues found"],
      "recommendations": ["array of recommended actions"],
      "safe": boolean
    }`

    const prompt = `Analyze this file for security risks:
    
    File Name: ${fileName}
    File Size: ${fileSize} bytes
    File Type: ${fileType}
    Additional Metadata: ${JSON.stringify(metadata, null, 2)}
    
    Please provide a security assessment.`

    const response = await makeGeminiRequest(prompt, systemInstruction)
    
    try {
      return JSON.parse(response)
    } catch (parseError) {
      console.warn('Failed to parse JSON response, returning raw text')
      return {
        riskLevel: 'medium',
        issues: ['Unable to parse security analysis'],
        recommendations: ['Manual review recommended'],
        safe: false,
        rawResponse: response
      }
    }
  } catch (error) {
    console.error('Breach scan error:', error)
    throw error
  }
}

// Smart file categorization
export const categorizeFile = async (fileName, fileType, fileSize) => {
  try {
    const systemInstruction = `You are a file organization expert. Categorize files into logical groups to help users organize their storage.
    
    Return a JSON object with:
    {
      "category": "string (Documents, Images, Videos, Audio, Code, Archives, etc.)",
      "subcategory": "string (more specific classification)",
      "suggestedTags": ["array", "of", "relevant", "tags"],
      "description": "brief description of the file type"
    }`

    const prompt = `Categorize this file:
    
    File Name: ${fileName}
    File Type: ${fileType}
    File Size: ${fileSize} bytes`

    const response = await makeGeminiRequest(prompt, systemInstruction)
    
    try {
      return JSON.parse(response)
    } catch (parseError) {
      return {
        category: 'Unknown',
        subcategory: 'Miscellaneous',
        suggestedTags: [],
        description: 'File type analysis unavailable'
      }
    }
  } catch (error) {
    console.error('File categorization error:', error)
    return {
      category: 'Unknown',
      subcategory: 'Miscellaneous', 
      suggestedTags: [],
      description: 'File categorization failed'
    }
  }
}

// Generate secure sharing messages
export const generateShareMessage = async (fileName, senderName, expiryDate = null) => {
  try {
    const systemInstruction = `Generate a professional, secure email message for file sharing. 
    Include security reminders and clear instructions. Keep it friendly but professional.
    Consider privacy and safety, especially for vulnerable users.`

    const expiryText = expiryDate 
      ? ` This sharing link will expire on ${new Date(expiryDate).toLocaleDateString()}.`
      : ' This file has been shared with no expiration date.'

    const prompt = `Generate an email message for sharing a secure file:
    
    File: ${fileName}
    Sender: ${senderName}
    Expiry: ${expiryDate ? new Date(expiryDate).toLocaleDateString() : 'No expiry'}
    
    The message should:
    - Be professional and friendly
    - Explain that the file is encrypted and secure
    - Include basic security reminders
    - Be concise but informative`

    const response = await makeGeminiRequest(prompt, systemInstruction)
    return response
  } catch (error) {
    console.error('Share message generation error:', error)
    const expiryText = expiryDate 
      ? ` This sharing link will expire on ${new Date(expiryDate).toLocaleDateString()}.`
      : ' This file has been shared with no expiration date.'
      
    return `Hello,

${senderName} has securely shared "${fileName}" with you through SecureVault.

Your file has been encrypted end-to-end for maximum security.${expiryText}

Security reminders:
- Only download files from trusted sources
- Scan downloaded files with antivirus software
- Keep your account credentials secure

Best regards,
SecureVault Team`
  }
}

// Privacy assessment for uploaded content
export const assessPrivacy = async (fileName, fileType) => {
  try {
    const systemInstruction = `You are a privacy expert. Assess files for potential privacy risks and provide recommendations.
    
    Return a JSON object:
    {
      "privacyLevel": "public|internal|confidential|restricted",
      "risks": ["array of privacy risks"],
      "recommendations": ["array of privacy protection recommendations"],
      "shouldEncrypt": boolean,
      "suggestedRetention": "days|months|years"
    }`

    const prompt = `Assess privacy implications for:
    
    File Name: ${fileName}
    File Type: ${fileType}
    
    Consider potential personal information, business sensitivity, and legal implications.`

    const response = await makeGeminiRequest(prompt, systemInstruction)
    
    try {
      return JSON.parse(response)
    } catch (parseError) {
      return {
        privacyLevel: 'confidential',
        risks: ['Privacy assessment unavailable'],
        recommendations: ['Use strong encryption', 'Limit sharing'],
        shouldEncrypt: true,
        suggestedRetention: 'years'
      }
    }
  } catch (error) {
    console.error('Privacy assessment error:', error)
    return {
      privacyLevel: 'confidential',
      risks: ['Privacy assessment failed'],
      recommendations: ['Use strong encryption', 'Limit sharing'],
      shouldEncrypt: true,
      suggestedRetention: 'years'
    }
  }
}