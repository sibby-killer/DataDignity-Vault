/**
 * Reusable Input Component
 */

export default function Input({
    label,
    error,
    type = 'text',
    className = '',
    ...props
}) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {label}
                </label>
            )}
            <input
                type={type}
                className={`input ${error ? 'border-destructive focus:ring-destructive' : ''} ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-destructive">{error}</p>
            )}
        </div>
    );
}
