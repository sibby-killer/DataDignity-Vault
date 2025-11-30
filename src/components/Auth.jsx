import React, { useState, useEffect } from 'react'
import { signInWithEmail, signUpWithEmail, createUser } from '../services/supabase'
import { handleAuthError, handleValidationError } from '../utils/errorHandler'
import { checkPasswordStrength } from '../utils/authManager'
import LoadingSpinner from './LoadingSpinner'
import TermsAndConditions from './TermsAndConditions'

const Auth = ({ onToast }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field-specific errors and global error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
    
    // Clear global error and success message when user starts typing
    if (globalError) {
      setGlobalError('')
    }
    if (successMessage) {
      setSuccessMessage('')
    }
    
    // Check password strength for password field
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value))
    }
    
    // Validate confirm password
    if (name === 'confirmPassword' && formData.password && value !== formData.password) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }))
    }
  }
  
  const validateForm = () => {
    const newErrors = {}
    
    // Email validation
    const emailError = handleValidationError('email', formData.email)
    if (emailError) newErrors.email = emailError
    
    // Password validation
    const passwordError = handleValidationError('password', formData.password)
    if (passwordError) newErrors.password = passwordError
    
    if (!isLogin) {
      // Full name validation for signup
      const nameError = handleValidationError('fullName', formData.fullName)
      if (nameError) newErrors.fullName = nameError
      
      // Confirm password validation
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // For signup, check terms acceptance first
    if (!isLogin && !termsAccepted) {
      setShowTerms(true)
      return
    }
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const { user, error } = await signInWithEmail(formData.email, formData.password)
        if (error) {
          throw error
        }
        onToast('Signed in successfully', 'success')
      } else {
        // Sign up
        const { user, error } = await signUpWithEmail(formData.email, formData.password)
        if (error) {
          throw error
        }

        // Show success message and detailed instructions
        if (user) {
          setSuccessMessage('🎉 Account created successfully! Please check your email for a confirmation link.')
          onToast('🎉 Account created successfully!', 'success')
          
          // Show detailed email confirmation instructions
          setTimeout(() => {
            setSuccessMessage('📧 Check your email and click the confirmation link to activate your account.')
          }, 2000)
          
          // Wait 5 seconds then switch to login view
          setTimeout(() => {
            setIsLogin(true)
            setSuccessMessage('')
            setFormData({
              email: formData.email, // Keep the email for convenience
              password: '',
              confirmPassword: '',
              fullName: ''
            })
            onToast('You can now sign in with your credentials', 'info')
          }, 5000)
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      
      let friendlyMessage = 'Something went wrong. Please try again.'
      let shouldSwitchToLogin = false
      
      // Handle specific error types with user-friendly messages
      if (error.message?.includes('Invalid login credentials')) {
        friendlyMessage = '❌ Invalid email or password. Please check your credentials and try again.'
      } else if (error.message?.includes('Email rate limit exceeded')) {
        friendlyMessage = '⏱️ Too many attempts. Please wait a moment before trying again.'
      } else if (error.message?.includes('Email not confirmed')) {
        friendlyMessage = '📧 Please check your email and click the confirmation link before signing in.'
      } else if (error.message?.includes('User already registered')) {
        friendlyMessage = '✉️ This email is already registered. Please sign in instead.'
        shouldSwitchToLogin = true
      } else if (error.message?.includes('Signup is disabled')) {
        friendlyMessage = '🚫 New account registration is currently disabled. Please contact support.'
      } else if (error.message?.includes('Password should be at least')) {
        friendlyMessage = '🔒 Password must be at least 6 characters long.'
      } else if (error.message?.includes('Unable to validate email address')) {
        friendlyMessage = '📧 Please enter a valid email address.'
      } else if (error.message?.includes('Network request failed')) {
        friendlyMessage = '🌐 Network error. Please check your connection and try again.'
      } else {
        // Use the error handler for other cases
        friendlyMessage = handleAuthError(error)
      }
      
      // Set both global error (for form display) and toast
      setGlobalError(friendlyMessage)
      onToast(friendlyMessage, 'error')
      
      // Switch to login if user already exists
      if (shouldSwitchToLogin) {
        setTimeout(() => {
          setIsLogin(true)
          setGlobalError('')
        }, 2500)
      }
      
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-4">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">DataDignity Vault</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your files, your control, your dignity
          </p>
        </div>

        {/* Auth Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            
            {/* Success Message Display */}
            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700 font-medium">
                      {successMessage}
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        onClick={() => setSuccessMessage('')}
                        className="inline-flex bg-green-50 rounded-md p-1.5 text-green-400 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Global Error Display */}
            {globalError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">
                      {globalError}
                    </p>
                    {globalError.includes('Invalid login credentials') && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsLogin(false)
                            setGlobalError('')
                          }}
                          className="text-sm text-red-600 hover:text-red-500 underline"
                        >
                          Need to create an account?
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        onClick={() => setGlobalError('')}
                        className="inline-flex bg-red-50 rounded-md p-1.5 text-red-400 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!isLogin && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.fullName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              {!isLogin && passwordStrength && formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.color === 'green' ? 'bg-green-500' :
                          passwordStrength.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.color === 'green' ? 'text-green-600' :
                      passwordStrength.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {passwordStrength.strength}
                    </span>
                  </div>
                  {passwordStrength.suggestions.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-500">Suggestions:</p>
                      <ul className="text-xs text-gray-500 space-y-1">
                        {passwordStrength.suggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !termsAccepted)}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                loading || (!isLogin && !termsAccepted) 
                  ? 'bg-gray-400' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : null}
              {loading 
                ? 'Processing...' 
                : isLogin 
                  ? 'Sign in' 
                  : termsAccepted 
                    ? 'Create Account' 
                    : 'Read Terms & Create Account'
              }
            </button>

            {!isLogin && (
              <div className="mt-4 space-y-2">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    I have read and accept the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-blue-600 hover:text-blue-500 underline font-medium"
                    >
                      Terms and Conditions
                    </button>
                    <span className="block text-xs text-gray-500 mt-1">
                      Required to create account - click to read our privacy policy
                    </span>
                  </span>
                </label>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    fullName: ''
                  })
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </div>
        </form>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Why DataDignity Vault?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              End-to-end encryption
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Blockchain-powered permissions
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              AI-powered security monitoring
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Secure file sharing
            </li>
          </ul>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <TermsAndConditions
          onAccept={() => {
            setTermsAccepted(true)
            setShowTerms(false)
            onToast('Terms accepted! You can now create your account.', 'success')
          }}
          onDecline={() => {
            setShowTerms(false)
            onToast('Terms must be accepted to create an account.', 'info')
          }}
        />
      )}
    </div>
  )
}

export default Auth