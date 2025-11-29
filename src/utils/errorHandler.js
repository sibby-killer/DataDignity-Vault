// Centralized error handling system

export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error)
  
  // Parse common error types
  if (error.message?.includes('network')) {
    return 'Network connection failed. Please check your internet connection.'
  }
  
  if (error.message?.includes('MetaMask')) {
    return 'MetaMask connection error. Please ensure MetaMask is installed and unlocked.'
  }
  
  if (error.message?.includes('Supabase') || error.status === 406) {
    return 'Database error. Please try again or contact support.'
  }
  
  if (error.message?.includes('Gemini') || error.status === 403 || error.status === 404) {
    return 'AI service temporarily unavailable. Please try again later.'
  }
  
  if (error.message?.includes('auth')) {
    return 'Authentication error. Please sign in again.'
  }
  
  if (error.message?.includes('file')) {
    return 'File operation failed. Please check file size and format.'
  }
  
  if (error.code === 4001) {
    return 'Transaction cancelled by user.'
  }
  
  // Generic fallback
  return error.message || 'An unexpected error occurred. Please try again.'
}

export const handleAuthError = (error) => {
  const message = error?.message || error?.error_description || 'Authentication failed'
  
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials.'
  }
  
  if (message.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link.'
  }
  
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.'
  }
  
  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  
  if (message.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  
  return message
}

export const handleValidationError = (field, value) => {
  switch (field) {
    case 'email':
      if (!value) return 'Email is required'
      if (!value.includes('@')) return 'Please enter a valid email address'
      return null
      
    case 'password':
      if (!value) return 'Password is required'
      if (value.length < 6) return 'Password must be at least 6 characters'
      return null
      
    case 'confirmPassword':
      if (!value) return 'Please confirm your password'
      return null
      
    case 'fullName':
      if (!value) return 'Full name is required'
      if (value.length < 2) return 'Name must be at least 2 characters'
      return null
      
    default:
      return null
  }
}

export const handleFileValidation = (file) => {
  const maxSize = 50 * 1024 * 1024 // 50MB
  
  if (!file) {
    return 'Please select a file'
  }
  
  if (file.size > maxSize) {
    return 'File size must be less than 50MB'
  }
  
  // Check for potentially dangerous file types
  const dangerousTypes = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
  const fileName = file.name.toLowerCase()
  
  if (dangerousTypes.some(type => fileName.endsWith(type))) {
    return 'This file type is not allowed for security reasons'
  }
  
  return null
}

export const handleNetworkError = (error) => {
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network and try again.'
  }
  
  if (error.name === 'TimeoutError') {
    return 'Request timed out. Please try again.'
  }
  
  if (error.status >= 500) {
    return 'Server error. Please try again later.'
  }
  
  if (error.status === 429) {
    return 'Rate limit exceeded. Please wait a moment and try again.'
  }
  
  return 'Network error. Please check your connection and try again.'
}

// Wrapper for async operations with error handling
export const withErrorHandling = (asyncFn, context = '') => {
  return async (...args) => {
    try {
      return await asyncFn(...args)
    } catch (error) {
      const message = handleError(error, context)
      throw new Error(message)
    }
  }
}

// Global error boundary handler
export const setupGlobalErrorHandler = (onError) => {
  window.addEventListener('error', (event) => {
    const message = handleError(event.error, 'Global')
    onError(message, 'error')
  })
  
  window.addEventListener('unhandledrejection', (event) => {
    const message = handleError(event.reason, 'Promise')
    onError(message, 'error')
    event.preventDefault()
  })
}