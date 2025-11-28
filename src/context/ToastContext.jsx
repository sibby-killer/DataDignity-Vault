/**
 * Toast Context
 * Manages toast notifications throughout the app
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const ToastContext = createContext({});

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 5000);
    }, []);

    const hideToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const value = {
        showToast,
        hideToast,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'
                            } animate-slide-in`}
                    >
                        <div className="flex items-start gap-3">
                            {toast.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            )}
                            <p className="text-sm text-neutral-900 flex-1">{toast.message}</p>
                            <button
                                onClick={() => hideToast(toast.id)}
                                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
