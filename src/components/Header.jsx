/**
 * Header Component
 */

import { useState } from 'react';
import { Upload, AlertTriangle, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export default function Header({ onUploadClick, onLockdownClick }) {
    const { user, signOut } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 z-40">
            <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                    Welcome back, {user?.email?.split('@')[0]}
                </h2>
                <p className="text-sm text-neutral-500">Your files are secure</p>
            </div>

            <div className="flex items-center gap-3">
                <Button onClick={onUploadClick} variant="primary">
                    <Upload className="w-4 h-4" />
                    Upload File
                </Button>

                <Button onClick={onLockdownClick} variant="destructive" size="sm">
                    <AlertTriangle className="w-4 h-4" />
                    Emergency Lockdown
                </Button>

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors"
                    >
                        <User className="w-5 h-5" />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 top-12 w-48 bg-white border border-neutral-200 rounded-lg shadow-xl py-2 animate-fade-in">
                            <div className="px-4 py-2 border-b border-neutral-200">
                                <p className="text-sm font-medium text-neutral-900 truncate">
                                    {user?.email}
                                </p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
