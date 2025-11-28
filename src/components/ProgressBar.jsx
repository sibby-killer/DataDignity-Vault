/**
 * Progress Bar Component
 * Shows upload/encryption progress
 */

export default function ProgressBar({ progress, status, className = '' }) {
    return (
        <div className={`w-full ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">{status}</span>
                <span className="text-sm font-medium text-neutral-700">{progress}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                <div
                    className="bg-primary h-full transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
