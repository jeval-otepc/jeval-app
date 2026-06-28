'use client';

interface LoadingSpinnerProps {
    message?: string;
    showMiddleware?: boolean;
}

export function LoadingSpinner({ 
    message = 'กำลังโหลด...', 
    showMiddleware = false 
}: LoadingSpinnerProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <div className="text-sm text-gray-600">
                    {message}
                </div>
                {showMiddleware && (
                    <div className="text-xs text-gray-500 mt-2">
                        ✅ Middleware: JWT ได้รับการตรวจสอบแล้ว
                    </div>
                )}
            </div>
        </div>
    );
}