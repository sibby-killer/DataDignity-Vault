// Authentication and session management
import { supabase } from '../services/supabase'

const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutes in milliseconds

class AuthManager {
  constructor() {
    this.inactivityTimer = null
    this.lastActivity = Date.now()
    this.isActive = true
    this.onLogout = null
    
    this.setupActivityTracking()
  }

  // Set up activity tracking for auto-logout
  setupActivityTracking() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const resetTimer = () => {
      this.lastActivity = Date.now()
      
      if (!this.isActive) return
      
      // Clear existing timer
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer)
      }
      
      // Set new timer
      this.inactivityTimer = setTimeout(() => {
        this.handleInactivity()
      }, INACTIVITY_TIMEOUT)
    }
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true)
    })
    
    // Initial timer setup
    resetTimer()
  }

  // Handle user inactivity
  async handleInactivity() {
    if (!this.isActive) return
    
    try {
      await supabase.auth.signOut()
      
      if (this.onLogout) {
        this.onLogout('Session expired due to inactivity. Please sign in again.', 'warning')
      }
      
      // Clear any stored session data
      localStorage.removeItem('lastActivity')
      sessionStorage.clear()
      
    } catch (error) {
      console.error('Error during auto-logout:', error)
    }
  }

  // Set logout callback
  setLogoutCallback(callback) {
    this.onLogout = callback
  }

  // Start session monitoring
  startSession() {
    this.isActive = true
    this.lastActivity = Date.now()
    localStorage.setItem('lastActivity', this.lastActivity.toString())
  }

  // Stop session monitoring
  stopSession() {
    this.isActive = false
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
      this.inactivityTimer = null
    }
    
    localStorage.removeItem('lastActivity')
  }

  // Check if session is still valid (for page refresh)
  checkSessionValidity() {
    const lastActivity = localStorage.getItem('lastActivity')
    
    if (!lastActivity) return true // New session
    
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity)
    
    if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
      // Session expired
      this.handleInactivity()
      return false
    }
    
    return true
  }

  // Update activity timestamp
  updateActivity() {
    this.lastActivity = Date.now()
    localStorage.setItem('lastActivity', this.lastActivity.toString())
  }

  // Get remaining session time
  getRemainingTime() {
    const timeElapsed = Date.now() - this.lastActivity
    const remaining = INACTIVITY_TIMEOUT - timeElapsed
    return Math.max(0, remaining)
  }

  // Format remaining time for display
  getFormattedRemainingTime() {
    const remaining = this.getRemainingTime()
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

// Create singleton instance
const authManager = new AuthManager()

export default authManager

// Password strength checker
export const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
  
  const score = Object.values(checks).filter(Boolean).length
  
  let strength = 'weak'
  let color = 'red'
  
  if (score >= 4) {
    strength = 'strong'
    color = 'green'
  } else if (score >= 3) {
    strength = 'medium'
    color = 'yellow'
  }
  
  return {
    strength,
    color,
    score,
    checks,
    suggestions: generatePasswordSuggestions(checks)
  }
}

const generatePasswordSuggestions = (checks) => {
  const suggestions = []
  
  if (!checks.length) suggestions.push('Use at least 8 characters')
  if (!checks.lowercase) suggestions.push('Add lowercase letters')
  if (!checks.uppercase) suggestions.push('Add uppercase letters')
  if (!checks.number) suggestions.push('Add numbers')
  if (!checks.special) suggestions.push('Add special characters (!@#$%^&*)')
  
  return suggestions
}