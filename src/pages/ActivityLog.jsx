/**
 * Activity Log Page
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActivityLogs } from '../services/supabase';
import ActivityLogEntry from '../components/ActivityLogEntry';
import { Activity } from 'lucide-react';

export default function ActivityLog() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, [user]);

    const loadLogs = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const data = await getActivityLogs(user.id);
            setLogs(data);
        } catch (error) {
            console.error('Error loading logs:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading activity logs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-h1 font-semibold text-neutral-900">Activity Log</h1>
                <p className="text-neutral-600 mt-1">Track all actions on your files</p>
            </div>

            {logs.length === 0 ? (
                <div className="card text-center py-12">
                    <Activity className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-h3 font-medium text-neutral-900 mb-2">No activity yet</h3>
                    <p className="text-neutral-600">Your file activity will appear here</p>
                </div>
            ) : (
                <div className="card p-0">
                    <div className="divide-y divide-neutral-200">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4">
                                <ActivityLogEntry log={log} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
