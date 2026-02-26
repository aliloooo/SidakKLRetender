export default function LoadingSpinner({ fullscreen = false, size = 'md' }) {
    const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
    const spinner = (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizes[size]} border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin`}
            />
            <span className="text-sm text-gray-500">Memuat...</span>
        </div>
    )
    if (fullscreen) {
        return (
            <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
                {spinner}
            </div>
        )
    }
    return (
        <div className="flex items-center justify-center py-12">
            {spinner}
        </div>
    )
}
