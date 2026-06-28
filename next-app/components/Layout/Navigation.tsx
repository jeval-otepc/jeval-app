'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLogout } from '@/hooks/useLogout';

interface NavigationProps {
    title: string;
    showBackButton?: boolean;
    backButtonText?: string;
    backButtonHref?: string;
    showStatusCheck?: boolean;
    middlewareStatus?: {
        jwtValid: boolean;
        checkTime: string;
    } | null;
}

export function Navigation({
    title,
    showBackButton = false,
    backButtonText = 'กลับสู่แดชบอร์ด',
    backButtonHref = '/dashboard',
    showStatusCheck = false,
    middlewareStatus = null
}: NavigationProps) {
    const router = useRouter();
    const { user } = useAuth();
    const handleLogout = useLogout();

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <div className="relative w-24 h-12">
                            <Image
                                src="/images/otepc-logo-002.png"
                                alt="OTEPC Logo"
                                fill
                                sizes="96px"
                                className="object-contain"
                            />
                        </div>
                        <h1 className="ml-4 text-xl font-semibold text-gray-900">
                            {title}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Navigation Menu - only show on dashboard */}
                        {showStatusCheck && (
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => router.push('/status-check')}
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200"
                                >
                                    ตรวจสอบสถานะ
                                </button>
                            </div>
                        )}

                        {/* Back Button - show on other pages */}
                        {showBackButton && (
                            <button
                                onClick={() => router.push(backButtonHref)}
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                            >
                                {backButtonText}
                            </button>
                        )}

                        {/* Middleware Status Indicator */}
                        {middlewareStatus && (
                            <div className="flex items-center space-x-2 text-xs">
                                <div
                                    className={`w-2 h-2 rounded-full ${
                                        middlewareStatus.jwtValid
                                            ? 'bg-green-500'
                                            : 'bg-red-500'
                                    }`}
                                ></div>
                                <span className="text-gray-500">
                                    MW:{' '}
                                    {middlewareStatus.jwtValid ? 'OK' : 'FAIL'}{' '}
                                    ({middlewareStatus.checkTime})
                                </span>
                            </div>
                        )}

                        <div className="text-sm text-gray-700">
                            {(user as any)?.displayname ? (
                                <>
                                    สวัสดี{' '}
                                    <span className="font-medium">
                                        {(user as any).displayname}
                                    </span>
                                </>
                            ) : (
                                'สวัสดี'
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            ออกจากระบบ
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}