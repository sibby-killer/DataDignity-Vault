import React, { useState, useEffect } from 'react'

const TermsAndConditions = ({ onAccept, onDecline }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showMetaMaskGuide, setShowMetaMaskGuide] = useState(false)

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    const scrolledPercentage = (scrollTop + clientHeight) / scrollHeight
    
    if (scrolledPercentage >= 0.95) {
      setHasScrolledToBottom(true)
    }
  }

  useEffect(() => {
    if (hasScrolledToBottom) {
      setAgreedToTerms(true)
    }
  }, [hasScrolledToBottom])

  const handleAccept = () => {
    if (agreedToTerms) {
      onAccept()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900 bg-opacity-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Welcome to SecureVault</h2>
            </div>
            <div className="text-sm">
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded">Terms & Privacy</span>
            </div>
          </div>

          {/* Terms Content */}
          <div 
            className="p-6 h-96 overflow-y-auto space-y-6"
            onScroll={handleScroll}
          >
            {/* Introduction */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">🔐 Your Privacy & Security First</h3>
              <p className="text-blue-800 text-sm">
                SecureVault is designed with your safety in mind, especially for individuals concerned about digital privacy and security. 
                We use blockchain technology and end-to-end encryption to ensure you maintain complete control over your data.
              </p>
            </div>

            {/* MetaMask Requirement */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 mt-0.5">
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwLjQ5IDEwLjIxTDEyIDIuMDVMMy41MSAxMC4yMUwxMiAxNi40NUwyMC40OSAxMC4yMVoiIGZpbGw9IiNGNjg1MUIiLz4KPHBhdGggZD0iTTMuNTEgMTAuMjFMMTIgMTYuNDVWMjEuOTVMMy41MSAxMC4yMVoiIGZpbGw9IiNFMjc2MjUiLz4KPHBhdGggZD0iTTIwLjQ5IDEwLjIxTDEyIDIxLjk1VjE2LjQ1TDIwLjQ5IDEwLjIxWiIgZmlsbD0iI0UyNzYyNSIvPgo8L3N2Zz4K" alt="MetaMask" className="w-full h-full" />
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 mb-2">📦 MetaMask Extension Required</h4>
                  <p className="text-orange-800 text-sm mb-3">
                    For maximum security, SecureVault requires MetaMask browser extension to manage blockchain permissions. 
                    This ensures your files are protected by decentralized, tamper-proof access controls.
                  </p>
                  <button
                    onClick={() => setShowMetaMaskGuide(!showMetaMaskGuide)}
                    className="text-orange-700 hover:text-orange-900 text-sm font-medium underline"
                  >
                    {showMetaMaskGuide ? 'Hide Installation Guide' : 'Show Installation Guide →'}
                  </button>
                  
                  {showMetaMaskGuide && (
                    <div className="mt-3 bg-white rounded-lg p-4 border border-orange-200">
                      <h5 className="font-medium text-gray-900 mb-2">🔧 How to Install MetaMask:</h5>
                      <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                        <li>Visit <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">metamask.io</a></li>
                        <li>Click "Download" and select your browser (Chrome, Firefox, Edge, etc.)</li>
                        <li>Install the extension from your browser's extension store</li>
                        <li>Create a new wallet or import existing one</li>
                        <li>Add Polygon Amoy Testnet:
                          <ul className="ml-4 mt-1 text-xs space-y-1 list-disc list-inside">
                            <li>Network Name: Polygon Amoy Testnet</li>
                            <li>RPC URL: https://rpc-amoy.polygon.technology/</li>
                            <li>Chain ID: 80002</li>
                            <li>Currency: MATIC</li>
                          </ul>
                        </li>
                        <li>Return to SecureVault and connect your wallet</li>
                      </ol>
                      <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs text-green-800">
                          ✅ <strong>Note:</strong> You can use SecureVault without MetaMask, but blockchain features will be disabled. 
                          Your files will still be encrypted and secure.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy Policy */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🛡️ Privacy Policy</h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900">Data Collection & Storage</h4>
                  <ul className="mt-1 space-y-1 list-disc list-inside ml-4">
                    <li><strong>We DO NOT collect personal data</strong> beyond what's necessary for account creation</li>
                    <li>Your files are encrypted end-to-end before upload</li>
                    <li>We cannot access, read, or share your file contents</li>
                    <li>Metadata is minimized and anonymized where possible</li>
                    <li>No tracking cookies or analytics that compromise privacy</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Data Sharing</h4>
                  <ul className="mt-1 space-y-1 list-disc list-inside ml-4">
                    <li><strong>Zero-knowledge architecture:</strong> We cannot share what we cannot see</li>
                    <li>No data sold to third parties - ever</li>
                    <li>No advertising or marketing data collection</li>
                    <li>Law enforcement requests handled according to legal requirements, but encrypted data remains protected</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Your Rights</h4>
                  <ul className="mt-1 space-y-1 list-disc list-inside ml-4">
                    <li>Complete control over file access and sharing</li>
                    <li>Right to delete all data at any time</li>
                    <li>Emergency lockdown feature for immediate protection</li>
                    <li>Export your data in standard formats</li>
                    <li>Account deletion removes all associated data</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Terms of Service */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Terms of Service</h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900">Acceptable Use</h4>
                  <ul className="mt-1 space-y-1 list-disc list-inside ml-4">
                    <li>Use SecureVault for legal purposes only</li>
                    <li>Do not upload content that violates laws or rights of others</li>
                    <li>Respect storage limits and fair usage policies</li>
                    <li>Do not attempt to circumvent security measures</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Security Responsibilities</h4>
                  <ul className="mt-1 space-y-1 list-disc list-inside ml-4">
                    <li>Keep your password and recovery phrases secure</li>
                    <li>Enable two-factor authentication when available</li>
                    <li>Report security vulnerabilities responsibly</li>
                    <li>Use emergency lockdown if you feel unsafe</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Service Availability</h4>
                  <ul className="mt-1 space-y-1 list-disc list-inside ml-4">
                    <li>Service provided "as is" with 99.9% uptime target</li>
                    <li>Regular security updates and improvements</li>
                    <li>Open source code available for transparency</li>
                    <li>Community-driven support and development</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Special Considerations for Vulnerable Users */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">💜 Special Protection for Vulnerable Users</h3>
              <div className="text-sm text-purple-800 space-y-2">
                <p>
                  <strong>SecureVault is designed with Gender-Based Violence (GBV) prevention in mind.</strong> 
                  We understand that digital safety can be a matter of personal security.
                </p>
                <ul className="space-y-1 list-disc list-inside ml-4">
                  <li>Emergency lockdown feature for immediate protection</li>
                  <li>No location tracking or metadata that could compromise safety</li>
                  <li>Anonymous usage options where possible</li>
                  <li>Support resources and guidance for digital safety</li>
                  <li>Non-judgmental AI assistance trained in safety protocols</li>
                </ul>
                <p className="font-medium">
                  If you're in immediate danger, please contact local emergency services. Your safety comes first.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📞 Contact & Support</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>GitHub Repository:</strong> <a href="https://github.com/sibby-killer/DataDignity-Vault" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">github.com/sibby-killer/DataDignity-Vault</a></p>
                <p><strong>Support:</strong> Create an issue on GitHub for technical support</p>
                <p><strong>Emergency:</strong> Use the in-app emergency lockdown feature</p>
                <p><strong>Community:</strong> Join our open source community for updates and discussions</p>
              </div>
            </div>

            {/* Scroll indicator for mobile */}
            {!hasScrolledToBottom && (
              <div className="sticky bottom-0 bg-gradient-to-t from-white to-transparent pt-8 text-center">
                <div className="inline-flex items-center space-x-2 text-gray-500 text-sm">
                  <span>Please scroll to read all terms</span>
                  <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Agreement Section */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="space-y-4">
              {/* Agreement Checkbox */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">I agree to the Terms of Service and Privacy Policy.</span>
                  <br />
                  I understand that MetaMask is recommended for blockchain features, and I acknowledge that SecureVault prioritizes user privacy and security.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={onDecline}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Decline & Exit
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!agreedToTerms}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    agreedToTerms
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {agreedToTerms ? 'Accept & Continue' : 'Read Terms to Continue'}
                </button>
              </div>

              {!agreedToTerms && (
                <p className="text-xs text-gray-500 text-center">
                  {hasScrolledToBottom 
                    ? 'Please check the agreement box to continue'
                    : 'Scroll through the terms above to continue'
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions