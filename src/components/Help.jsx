import React, { useState } from 'react'
import ChatHelp from './ChatHelp'
import LoadingSpinner from './LoadingSpinner'

const Help = ({ user, onToast }) => {
  const [activeTab, setActiveTab] = useState('chat')

  const faqItems = [
    {
      question: "How secure are my files?",
      answer: "Your files are encrypted end-to-end with AES-256 encryption. Additionally, file permissions are managed on the blockchain for tamper-proof security."
    },
    {
      question: "What is blockchain registration?",
      answer: "When you connect your wallet, files are registered on Polygon Amoy testnet, creating an immutable record of ownership and sharing permissions."
    },
    {
      question: "How does AI monitoring work?",
      answer: "Our AI scans uploaded files for potential security risks, malware signatures, and privacy concerns, providing real-time alerts."
    },
    {
      question: "Can I share files with non-users?",
      answer: "Recipients need a SecureVault account to access shared files securely. This ensures end-to-end encryption and proper access controls."
    },
    {
      question: "What file types are supported?",
      answer: "All file types are supported up to 50MB per file. Images get thumbnail previews, and all files are scanned for security."
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="mt-1 text-sm text-gray-500">
          Get help with SecureVault or ask our AI assistant
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💬 Chat with AI
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'faq'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 FAQ
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'contact'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📧 Contact
          </button>
        </nav>
      </div>

      {/* Chat Interface */}
      {activeTab === 'chat' && (
        <div>
          <ChatHelp user={user} onToast={onToast} />
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    ❓ {item.question}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Support</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Support</h3>
                  <p className="text-sm text-gray-600">support@securevault.com</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">GitHub Repository</h3>
                  <a 
                    href="https://github.com/sibby-killer/DataDignity-Vault" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    github.com/sibby-killer/DataDignity-Vault
                  </a>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">AI Chat Assistant</h3>
                  <p className="text-sm text-gray-600">Chat with our AI helper above</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Documentation & Issues</h3>
                  <p className="text-sm text-gray-600">Check our GitHub for full docs</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">GBV Support</h3>
                  <p className="text-sm text-gray-600">Digital safety resources & support</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Our Mission</h3>
              <p className="text-sm text-gray-600 mb-2">
                SecureVault is committed to digital safety and privacy, with special focus on protecting vulnerable individuals from Gender-Based Violence (GBV).
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Open source & transparent</li>
                <li>• Privacy-first design</li>
                <li>• Community-driven support</li>
                <li>• Free for everyone</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="text-sm font-medium text-red-900 mb-2">🚨 Security Emergency?</h3>
              <p className="text-sm text-red-700 mb-3">
                If you suspect unauthorized access, harassment, or are in immediate danger:
              </p>
              <div className="space-y-2">
                <button 
                  onClick={() => window.location.href = '/security'}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                >
                  🔒 Emergency Lockdown
                </button>
                <a 
                  href="https://github.com/sibby-killer/DataDignity-Vault/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors text-center"
                >
                  📢 Report Issue on GitHub
                </a>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-2">💚 Need Support?</h3>
              <p className="text-sm text-green-700 mb-3">
                Our AI assistant is trained in digital safety and GBV prevention.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-green-600">
                  ✓ Non-judgmental support<br/>
                  ✓ Privacy-focused advice<br/>
                  ✓ Security best practices<br/>
                  ✓ 24/7 available
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Help