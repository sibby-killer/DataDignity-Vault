/**
 * Activity Log Entry Component
 */

import { useState } from 'react';
import {
    Upload,
    Download,
    Share2,
    XCircle,
    Shield,
    AlertTriangle,
    ChevronDown,
    ChevronRight
} from 'lucide-react';

export default function ActivityLogEntry({ log }) {
    const [expanded, setExpanded] = useState(false);

    const getIcon = () => {
        const iconClass = "w-5 h-5";

        switch (log.action) {
            case 'file_uploaded':
                return <Upload className={iconClass + " text-green-500"} />;
            case 'file_downloaded':
                return <Download className={iconClass + " text-blue-500"} />;
            case 'access_granted':
                return <Share2 className={iconClass + " text-primary"} />;
            case 'access_revoked':
                return <XCircle className={iconClass + " text-orange-500"} />;
            case 'breach_detected':
                return <AlertTriangle className={iconClass + " text-destructive"} />;
            case 'lockdown_executed':
                return <Shield className={iconClass + " text-destructive"} />;
            default:
                return <Shield className={iconClass + " text-neutral-500"} />;
        }
    };

    const getActionText = () => {
        switch (log.action) {
            case 'file_uploaded':
                return 'File uploaded';
            case 'file_downloaded':
                return 'File downloaded';
            case 'access_granted':
                return 'Access granted';
            case 'access_revoked':
                return 'Access revoked';
            case 'breach_detected':
                return 'Potential breach detected';
            case 'lockdown_executed':
                return 'Emergency lockdown executed';
            default:
                return log.action;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    return (
        <div
            className="log-entry"
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-start gap-3">
                {getIcon()}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-900">{getActionText()}</p>
                        {log.file?.name && (
                            <>
                                <span className="text-neutral-300">•</span>
                                <p className="text-sm text-neutral-600 truncate">{log.file.name}</p>
                            </>
                        )}
                    </div>

                    <p className="text-caption text-neutral-500 mt-0.5">
                        {formatTime(log.created_at)}
                    </p>

                    {expanded && log.details && (
                        <div className="mt-2 p-3 bg-neutral-50 rounded-lg">
                            <p className="text-sm text-neutral-700">{log.details}</p>
                        </div>
                    )}
                </div>

                {log.details && (
                    <button className="text-neutral-400 hover:text-neutral-600">
                        {expanded ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
