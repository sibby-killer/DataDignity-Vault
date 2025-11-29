import React, { useState } from 'react'
import { resendConfirmation } from '../services/supabase'

const EmailConfirmationBanner = ({ user, onToast }) => {
  const [resending, setResending] = useState(false)
  
  // Only show if user exists but email is not confirmed
  if (!user || user.email_confirmed_at) {
    return null
  }

  const handleResendConfirmation = async () => {
    setResending(true)
    try {
      const result = await resendConfirmation(user.email)
      if (result.error) {
        throw new Error(result.error.message)
      }
      onToast('📧 Confirmation email sent! Check your inbox.', 'success')
    } catch (error) {
      console.error('Resend confirmation error:', error)
      onToast(`Failed to resend confirmation: ${error.message}`, 'error')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            📧 Email Confirmation Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              We sent a confirmation link to <strong>{user.email}</strong>. 
              Please check your email (including spam folder) and click the link to activate your account.
            </p>
          </div>
          <div className="mt-4">
            <div className="flex">
              <button
                onClick={handleResendConfirmation}
                disabled={resending}
                className="bg-yellow-100 px-3 py-2 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? 'Sending...' : 'Resend Confirmation Email'}
              </button>
              <div className="ml-4 text-xs text-yellow-600 self-center">
                <p>Can't find the email? Check spam folder or try resending.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailConfirmationBanner