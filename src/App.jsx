/**
 * Main App Component
 * Handles routing and layout
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { FileProvider } from './context/FileContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MyFiles from './pages/MyFiles';
import SharedWithMe from './pages/SharedWithMe';
import BreachMonitor from './pages/BreachMonitor';
import ActivityLog from './pages/ActivityLog';
import Settings from './pages/Settings';
import Help from './pages/Help';
import UploadModal from './components/modals/UploadModal';
import LockdownModal from './components/modals/LockdownModal';
import { useState } from 'react';

// Protected Route Component
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

// Main Layout Component
function MainLayout({ children }) {
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [lockdownModalOpen, setLockdownModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-neutral-50">
            <Sidebar />
            <Header
                onUploadClick={() => setUploadModalOpen(true)}
                onLockdownClick={() => setLockdownModalOpen(true)}
            />

            <main className="ml-64 mt-16 p-6">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            <UploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
            />
            <LockdownModal
                isOpen={lockdownModalOpen}
                onClose={() => setLockdownModalOpen(false)}
            />
        </div>
    );
}

// App Component
function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <FileProvider>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />

                            {/* Protected Routes */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <MainLayout>
                                            <Dashboard />
                                        </MainLayout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/my-files"
                                element={
                                    <ProtectedRoute>
                                        <MainLayout>
                                            <MyFiles />
                                        </MainLayout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/shared"
                                element={
                                    <ProtectedRoute>
                                        <MainLayout>
                                            <SharedWithMe />
                                        </MainLayout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/breach-monitor"
                                element={
                                    <ProtectedRoute>
                                        <MainLayout>
                                            <BreachMonitor />
                                        </MainLayout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/activity"
                                element={
                                    <ProtectedRoute>
                                        <MainLayout>
                                            <ActivityLog />
                                        </MainLayout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/help"
                                element={
                                    <ProtectedRoute>
                                        <MainLayout>
                                            <Help />
                                        </MainLayout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <ProtectedRoute>
                                        <MainLayout>
                                            <Settings />
                                        </MainLayout>
                                    </ProtectedRoute>
                                }
                            />

                            {/* Default Route */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </FileProvider>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
