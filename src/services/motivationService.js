import { makeGeminiRequest } from './gemini'
import { getFallbackMotivation } from './fallbackService'

// Generate daily motivation using Gemini AI
export const generateDailyMotivation = async (userName = 'User', timeOfDay = 'morning') => {
  try {
    const systemInstruction = `You are a supportive, empowering AI assistant for SecureVault users. 
    Generate a brief, uplifting, and motivational message that:
    - Is warm and personal
    - Relates to digital security, privacy, or personal empowerment
    - Is encouraging and positive
    - Mentions the importance of taking control of their digital life
    - Is 1-2 sentences maximum
    - Feels authentic and not corporate
    
    Keep it simple, friendly, and inspiring.`

    const prompt = `Create a ${timeOfDay} motivational message for ${userName} who just logged into SecureVault.
    
    Make it relevant to:
    - Digital privacy and security
    - Personal empowerment
    - Taking control of their data
    - Feeling confident about their choices
    
    Keep it brief, warm, and genuinely motivating.`

    const motivation = await makeGeminiRequest(prompt, systemInstruction)
    return motivation
  } catch (error) {
    console.warn('Failed to generate AI motivation:', error)
    // Use improved fallback service
    return getFallbackMotivation(userName, timeOfDay)
  }
}

// Get time of day for contextual messages
export const getTimeOfDay = () => {
  const hour = new Date().getHours()
  
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

// Get personalized greeting
export const getPersonalizedGreeting = (userName) => {
  const timeOfDay = getTimeOfDay()
  const greetings = {
    morning: [
      `Good morning, ${userName}! ☀️`,
      `Rise and shine, ${userName}! 🌅`,
      `Morning, ${userName}! ✨`
    ],
    afternoon: [
      `Good afternoon, ${userName}! 🌤️`,
      `Hey there, ${userName}! ☀️`,
      `Afternoon, ${userName}! 🌈`
    ],
    evening: [
      `Good evening, ${userName}! 🌆`,
      `Evening, ${userName}! 🌙`,
      `Hey ${userName}! 🌟`
    ],
    night: [
      `Good evening, ${userName}! 🌙`,
      `Hey ${userName}! ⭐`,
      `Evening, ${userName}! 🌌`
    ]
  }
  
  const options = greetings[timeOfDay]
  return options[Math.floor(Math.random() * options.length)]
}