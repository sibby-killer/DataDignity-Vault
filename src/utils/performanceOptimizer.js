// Performance optimization utilities

// Debounce function for search inputs and API calls
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function for scroll events and frequent updates
export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Image lazy loading utility
export const lazyLoadImage = (src, placeholder = '') => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(src)
    img.onerror = () => resolve(placeholder)
    img.src = src
  })
}

// File size formatter for better UX
export const formatFileSize = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Local storage with expiration
export const setWithExpiry = (key, value, ttl) => {
  const now = new Date()
  const item = {
    value: value,
    expiry: now.getTime() + ttl
  }
  localStorage.setItem(key, JSON.stringify(item))
}

export const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key)
  
  if (!itemStr) {
    return null
  }
  
  const item = JSON.parse(itemStr)
  const now = new Date()
  
  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key)
    return null
  }
  
  return item.value
}

// Rate limiter for API calls
class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindow
    this.requests = []
  }
  
  canMakeRequest() {
    const now = Date.now()
    
    // Remove old requests outside time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    
    // Check if under limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now)
      return true
    }
    
    return false
  }
  
  getWaitTime() {
    if (this.requests.length === 0) return 0
    
    const oldestRequest = Math.min(...this.requests)
    const waitTime = this.timeWindow - (Date.now() - oldestRequest)
    
    return Math.max(0, waitTime)
  }
}

// Create rate limiters for different services
export const geminiRateLimiter = new RateLimiter(15, 60000) // 15 requests per minute
export const supabaseRateLimiter = new RateLimiter(100, 60000) // 100 requests per minute

// Image compression for uploads
export const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      const { width, height } = img
      
      // Calculate new dimensions
      let newWidth = width
      let newHeight = height
      
      if (width > maxWidth) {
        newWidth = maxWidth
        newHeight = (height * maxWidth) / width
      }
      
      canvas.width = newWidth
      canvas.height = newHeight
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, newWidth, newHeight)
      
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// Memory usage monitor
export const getMemoryUsage = () => {
  if (performance.memory) {
    return {
      used: Math.round((performance.memory.usedJSHeapSize / 1048576) * 100) / 100,
      total: Math.round((performance.memory.totalJSHeapSize / 1048576) * 100) / 100,
      limit: Math.round((performance.memory.jsHeapSizeLimit / 1048576) * 100) / 100
    }
  }
  return null
}