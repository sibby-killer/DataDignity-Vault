/**
 * File Context
 * Manages file state and operations throughout the app
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserFiles, getSharedFiles } from '../services/supabase';

const FileContext = createContext({});

export function FileProvider({ children }) {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [sharedFiles, setSharedFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadQueue, setUploadQueue] = useState([]);

    // Load files when user changes
    useEffect(() => {
        if (user) {
            loadFiles();
        } else {
            setFiles([]);
            setSharedFiles([]);
            setLoading(false);
        }
    }, [user]);

    const loadFiles = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const [userFiles, shared] = await Promise.all([
                getUserFiles(user.id),
                getSharedFiles(user.id),
            ]);

            setFiles(userFiles);
            setSharedFiles(shared);
        } catch (error) {
            console.error('Error loading files:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const addFile = useCallback((file) => {
        setFiles((prev) => [file, ...prev]);
    }, []);

    const updateFile = useCallback((fileId, updates) => {
        setFiles((prev) =>
            prev.map((file) => (file.id === fileId ? { ...file, ...updates } : file))
        );
    }, []);

    const removeFile = useCallback((fileId) => {
        setFiles((prev) => prev.filter((file) => file.id !== fileId));
    }, []);

    const addToUploadQueue = useCallback((upload) => {
        setUploadQueue((prev) => [...prev, upload]);
    }, []);

    const updateUploadProgress = useCallback((uploadId, progress) => {
        setUploadQueue((prev) =>
            prev.map((upload) =>
                upload.id === uploadId ? { ...upload, ...progress } : upload
            )
        );
    }, []);

    const removeFromUploadQueue = useCallback((uploadId) => {
        setUploadQueue((prev) => prev.filter((upload) => upload.id !== uploadId));
    }, []);

    const value = {
        files,
        sharedFiles,
        loading,
        uploadQueue,
        loadFiles,
        refreshFiles: loadFiles, // Alias for clarity
        addFile,
        updateFile,
        removeFile,
        addToUploadQueue,
        updateUploadProgress,
        removeFromUploadQueue,
    };

    return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
}

export function useFiles() {
    const context = useContext(FileContext);
    if (context === undefined) {
        throw new Error('useFiles must be used within a FileProvider');
    }
    return context;
}
