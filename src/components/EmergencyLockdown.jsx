import React, { useState } from 'react'
import { emergencyLockdown } from '../services/permissionManager'
import LoadingSpinner from './LoadingSpinner'

const EmergencyLockdown = ({ user, walletAddress, onToast, onSuccess }) => {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [executing, setExecuting] = useState(false)
  const [lockdownComplete, setLockdownComplete] = useState(false)
  const [results, setResults] = useState(null)

  const handleInitiateLockdown = () => {
    setShowConfirmation(true)
  }

  const handleConfirmLockdown = async () => {
    if (confirmText !== 'LOCKDOWN') {
      onToast('❌ Please type LOCKDOWN to confirm', 'error')
      return
    }

    setExecuting(true)
    
    try {
      onToast('🚨 EMERGENCY LOCKDOWN INITIATED...', 'warning')
      
      const results = await emergencyLockdown(user.id, walletAddress)
      
      setResults(results)
      setLockdownComplete(true)
      
      // Flash red screen to indicate completion
      document.body.style.backgroundColor = '#DC2626'
      setTimeout(() => {
        document.body.style.backgroundColor = ''
      }, 200)
      
      onToast('🛡️ EMERGENCY LOCKDOWN COMPLETE', 'success')
      
      if (onSuccess) {
        onSuccess(results)
      }
      
    } catch (error) {
      console.error('Emergency lockdown error:', error)
      onToast(`❌ Lockdown failed: ${error.message}`, 'error')
    } finally {
      setExecuting(false)
    }
  }

  const resetLockdown = () => {
    setShowConfirmation(false)
    setConfirmText('')
    setExecuting(false)
    setLockdownComplete(false)
    setResults(null)
  }

  if (lockdownComplete) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              🚨 EMERGENCY LOCKDOWN COMPLETE
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <div className="space-y-1">
                <p>✅ <strong>{results.filesAffected}</strong> files affected</p>
                <p>✅ <strong>{results.permissionsRevoked}</strong> permissions revoked</p>
                <p>✅ <strong>{results.blockchainRevocations}</strong> blockchain revocations</p>
                <p>✅ <strong>{results.notifications}</strong> people notified</p>
                <p className="mt-2 font-medium">
                  🛡️ All access to your files has been permanently revoked.
                </p>
                <p className="text-xs mt-2">
                  Locked at: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={resetLockdown}
                className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded text-sm"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showConfirmation) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-red-900 mb-2">
            ⚠️ EMERGENCY LOCKDOWN CONFIRMATION
          </h3>
          
          <p className="text-sm text-red-800 mb-4">
            This will IMMEDIATELY revoke ALL access to ALL your files for ALL people you've shared with. 
            This action cannot be undone easily.
          </p>
          
          <div className="bg-red-100 p-3 rounded-md mb-4 text-left">
            <p className="text-xs text-red-800 font-medium mb-2">What will happen:</p>
            <ul className="text-xs text-red-700 space-y-1">
              <li>• All active file sharing permissions will be revoked</li>
              <li>• All recipients will be notified immediately</li>
              <li>• Blockchain records will be updated with revocation timestamps</li>
              <li>• Future sharing will require re-granting permissions</li>
              <li>• This provides court-admissible proof of revocation</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <label htmlFor="confirm-text" className="block text-sm font-medium text-red-900 mb-2">
              Type <span className="font-bold">LOCKDOWN</span> to confirm:
            </label>
            <input
              id="confirm-text"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type LOCKDOWN"
              className="w-full px-3 py-2 border-2 border-red-300 rounded-md focus:ring-red-500 focus:border-red-500 text-center font-mono"
              autoComplete="off"
            />
          </div>
          
          <div className="flex justify-center space-x-3">
            <button
              onClick={handleConfirmLockdown}
              disabled={confirmText !== 'LOCKDOWN' || executing}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg disabled:cursor-not-allowed flex items-center"
            >
              {executing ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  EXECUTING LOCKDOWN...
                </>
              ) : (
                '🚨 EXECUTE EMERGENCY LOCKDOWN'
              )}
            </button>
            
            <button
              onClick={() => setShowConfirmation(false)}
              disabled={executing}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-6 rounded-lg disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-bold">🚨 EMERGENCY LOCKDOWN</h3>
            <p className="text-red-100 text-sm">
              Instantly revoke ALL file access if you feel unsafe
            </p>
          </div>
        </div>
        
        <button
          onClick={handleInitiateLockdown}
          className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-lg border-2 border-red-300 transition-all hover:scale-105 shadow-lg"
        >
          🛑 LOCKDOWN NOW
        </button>
      </div>
      
      <div className="mt-4 text-xs text-red-100 bg-red-600 rounded p-2">
        <p className="font-medium mb-1">⚡ When to use Emergency Lockdown:</p>
        <ul className="space-y-1">
          <li>• You're fleeing an abusive relationship</li>
          <li>• Someone threatens to leak your files</li>
          <li>• You suspect unauthorized access</li>
          <li>• Any situation where immediate protection is needed</li>
        </ul>
      </div>
    </div>
  )
}

export default EmergencyLockdown