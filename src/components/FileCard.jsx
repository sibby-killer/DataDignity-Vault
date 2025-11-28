/**
 * File Card Component
 */

import { useState } from 'react';
import { MoreVertical, Download, Share2, Trash2, FileText, Image, File, ShieldOff } from 'lucide-react';
import { formatFileSize } from '../utils/storage';

export default function FileCard({ file, onDownload, onShare, onDelete, onRevoke }) {
    const [showMenu, setShowMenu] = useState(false);

    const getFileIcon = () => {
        const type = file.type?.toLowerCase() || '';

        if (type.includes('pdf')) {
            return <div className="file-icon file-icon-pdf">PDF</div>;
        } else if (type.includes('doc') || type.includes('word')) {
            return <div className="file-icon file-icon-doc">DOC</div>;
        } else if (type.includes('image')) {
            return <div className="file-icon file-icon-img"><Image className="w-5 h-5" /></div>;
        } else {
            return <div className="file-icon file-icon-default"><File className="w-5 h-5" /></div>;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="card group">
            <div className="flex items-start gap-3">
                {getFileIcon()}

                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-900 truncate">{file.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-caption text-neutral-500">
                            {formatFileSize(file.size)}
                        </span>
                        <span className="text-neutral-300">•</span>
                        <span className="text-caption text-neutral-500">
                            {formatDate(file.created_at)}
                        </span>
                    </div>

                    {file.shared_count > 0 && (
                        <div className="mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                <Share2 className="w-3 h-3" />
                                Shared with {file.shared_count}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-lg hover:bg-neutral-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <MoreVertical className="w-4 h-4 text-neutral-600" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-10 w-40 bg-white border border-neutral-200 rounded-lg shadow-xl py-1 z-10 animate-fade-in">
                            <button
                                onClick={() => {
                                    onDownload(file);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            <button
                                onClick={() => {
                                    onShare(file);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 flex items-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                            {file.shared_count > 0 && onRevoke && (
                                <button
                                    onClick={() => {
                                        onRevoke(file);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                                >
                                    <ShieldOff className="w-4 h-4" />
                                    Revoke Access
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    onDelete(file);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
