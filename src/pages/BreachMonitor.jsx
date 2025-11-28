/**
 * Breach Monitor Page
 * AI-powered breach detection and monitoring
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { scanForBreaches } from '../services/gemini';

export default function BreachMonitor() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [scanning, setScanning] = useState(false);
    const [lastScan, setLastScan] = useState(null);
    const [breachResults, setBreachResults] = useState(null);

    const handleScan = async () => {
        setScanning(true);
        try {
            showToast('Scanning for potential breaches...', 'info');
            const results = await scanForBreaches(user.email);
            setBreachResults(results);
            setLastScan(new Date());

            if (results.breachesFound > 0) {
                showToast(`Warning: ${results.breachesFound} potential breach(es) detected!`, 'warning');
            } else {
                showToast('No breaches detected. Your data is secure!', 'success');
            }
        } catch (error) {
            console.error('Breach scan error:', error);
            showToast(error.message || 'Scan failed', 'error');
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 font-semibold text-neutral-900">Breach Monitor</h1>
                    <p className="text-neutral-600 mt-1">
                        AI-powered security monitoring for your account
                    </p>
                </div>
                <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                    {scanning ? 'Scanning...' : 'Scan Now'}
                </button>
            </div>

            {/* Status Card */}
            <div className="card">
                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${breachResults?.breachesFound > 0
                            ? 'bg-destructive/10'
                            : 'bg-green-100'
                        }`}>
                        {breachResults?.breachesFound > 0 ? (
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        ) : (
                            <Shield className="w-8 h-8 text-green-600" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-h2 font-semibold text-neutral-900">
                            {breachResults?.breachesFound > 0
                                ? 'Potential Breaches Detected'
                                : 'No Breaches Detected'}
                        </h2>
                        <p className="text-neutral-600">
                            {lastScan
                                ? `Last scanned: ${lastScan.toLocaleString()}`
                                : 'Click "Scan Now" to check for breaches'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Breach Results */}
            {breachResults && (
                <div className="space-y-4">
                    {breachResults.breachesFound > 0 ? (
                        <div className="card bg-red-50 border-2 border-destructive">
                            <div className="flex gap-3">
                                <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-destructive mb-2">
                                        ⚠️ Security Alert
                                    </h3>
                                    <p className="text-sm text-red-900 mb-3">
                                        {breachResults.message}
                                    </p>
                                    {breachResults.recommendations && (
                                        <div>
                                            <h4 className="font-medium text-red-900 mb-2">
                                                Recommended Actions:
                                            </h4>
                                            <ul className="list-disc list-inside text-sm text-red-900 space-y-1">
                                                {breachResults.recommendations.map((rec, idx) => (
                                                    <li key={idx}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card bg-green-50 border-2 border-green-600">
                            <div className="flex gap-3">
                                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-green-900 mb-2">
                                        ✅ All Clear
                                    </h3>
                                    <p className="text-sm text-green-900">
                                        No security breaches detected. Your account appears to be secure.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Information Card */}
            <div className="card">
                <h3 className="font-semibold text-neutral-900 mb-3">About Breach Monitoring</h3>
                <div className="space-y-2 text-sm text-neutral-700">
                    <p>
                        Our AI-powered breach monitor checks for potential security issues including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Known data breaches involving your email</li>
                        <li>Compromised credentials</li>
                        <li>Suspicious account activity</li>
                        <li>Security vulnerabilities</li>
                    </ul>
                    <p className="mt-3 text-neutral-600">
                        <strong>Note:</strong> This feature uses Google Gemini AI to analyze publicly available breach databases.
                        Regular scans are recommended for optimal security.
                    </p>
                </div>
            </div>
        </div>
    );
}
