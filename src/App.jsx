import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase, getCurrentUser } from './services/supabase'
import { connectMetaMask, onAccountChanged, onNetworkChanged, isMetaMaskConnected } from './services/blockchain'
import { generateDailyMotivation, getPersonalizedGreeting, getTimeOfDay } from './services/motivationService'
import authManager from './utils/authManager'
import { handleError } from './utils/errorHandler'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import FileManager from './components/FileManager'
import SharedFiles from './components/SharedFiles'
import Profile from './components/Profile'
import Help from './components/Help'
import BreachMonitor from './components/BreachMonitor'
import Auth from './components/Auth'
import Toast from './components/Toast'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [walletAddress, setWalletAddress] = useState(null)
  const [toast, setToast] = useState(null)
  const [motivation, setMotivation] = useState('')
  const [showMotivation, setShowMotivation] = useState(false)

  // Toast helper function
  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  // Initialize app and check authentication
  useEffect(() => {
    initializeApp()
    
    // Set up auto-logout callback
    authManager.setLogoutCallback((message, type) => {
      showToast(message, type)
      setUser(null)
      setWalletAddress(null)
      authManager.stopSession()
    })
  }, [])

  // Generate motivation when user logs in
  useEffect(() => {
    if (user && !showMotivation) {
      generateWelcomeMotivation()
    }
  }, [user])

  const generateWelcomeMotivation = async () => {
    try {
      const userName = user?.email?.split('@')[0] || 'User'
      const greeting = getPersonalizedGreeting(userName)
      const timeOfDay = getTimeOfDay()
      
      // Show greeting first
      setMotivation(greeting)
      setShowMotivation(true)
      
      // Generate AI motivation in background
      try {
        const aiMotivation = await generateDailyMotivation(userName, timeOfDay)
        setTimeout(() => {
          setMotivation(aiMotivation)
        }, 2000)
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
          setShowMotivation(false)
        }, 8000)
      } catch (error) {
        console.warn('Failed to generate AI motivation:', error)
        // Keep the greeting for a few seconds
        setTimeout(() => {
          setShowMotivation(false)
        }, 4000)
      }
    } catch (error) {
      console.error('Error generating welcome motivation:', error)
    }
  }

  const initializeApp = async () => {
    try {
      // Check session validity first
      if (!authManager.checkSessionValidity()) {
        return // Session expired, user will be logged out
      }

      // Check current auth state (handle gracefully if no session)
      try {
        const currentUser = await getCurrentUser()
        
        if (currentUser) {
          setUser(currentUser)
          authManager.startSession()
        }
      } catch (authError) {
        console.log('No active session found')
        // This is normal for new users
      }

      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            setUser(session.user)
            authManager.startSession()
          } else {
            setUser(null)
            setWalletAddress(null)
            authManager.stopSession()
          }
        }
      )

      // Try to connect to MetaMask if available (optional)
      try {
        if (window.ethereum) {
          const isConnected = await isMetaMaskConnected()
          if (isConnected) {
            const result = await connectMetaMask()
            if (result.success) {
              setWalletAddress(result.address)
            }
          }
        }
      } catch (error) {
        // MetaMask is optional - app works without it
        console.log('MetaMask not available')
      }

      // Set up blockchain event listeners
      onAccountChanged((address) => {
        setWalletAddress(address)
        if (address) {
          showToast('Wallet connected successfully', 'success')
        } else {
          showToast('Wallet disconnected', 'warning')
        }
      })

      onNetworkChanged(() => {
        showToast('Network changed - reloading...', 'info')
      })

      return () => {
        subscription?.unsubscribe()
      }
    } catch (error) {
      console.error('App initialization error:', error)
      const message = handleError(error, 'App Initialization')
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Handle wallet connection
  const handleWalletConnect = async () => {
    try {
      const result = await connectMetaMask()
      if (result.success) {
        setWalletAddress(result.address)
        showToast('Wallet connected successfully!', 'success')
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      showToast(`Failed to connect wallet: ${error.message}`, 'error')
    }
  }

  // Show loading spinner during initialization
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // Show auth page if user is not logged in
  if (!user) {
    return <Auth onToast={showToast} />
  }

  // Main app layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        user={user}
        walletAddress={walletAddress}
        onWalletConnect={handleWalletConnect}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onToast={showToast}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
        />

        {/* Main content */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-16'
        } mt-16`}>
          <div className="p-4 md:p-6">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    user={user} 
                    walletAddress={walletAddress}
                    onToast={showToast}
                  />
                } 
              />
              <Route 
                path="/files" 
                element={
                  <FileManager 
                    user={user} 
                    walletAddress={walletAddress}
                    onToast={showToast}
                  />
                } 
              />
              <Route 
                path="/shared" 
                element={
                  <SharedFiles 
                    user={user} 
                    onToast={showToast}
                  />
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <Profile 
                    user={user} 
                    onToast={showToast}
                  />
                } 
              />
              <Route 
                path="/help" 
                element={
                  <Help 
                    user={user} 
                    onToast={showToast}
                  />
                } 
              />
              <Route 
                path="/security" 
                element={
                  <BreachMonitor 
                    user={user} 
                    onToast={showToast}
                  />
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Motivational Message */}
      {showMotivation && motivation && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md mx-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-lg shadow-lg border border-white/20">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{motivation}</p>
              </div>
              <button
                onClick={() => setShowMotivation(false)}
                className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App