'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn, getSession } from 'next-auth/react';
import { useAuth } from '@/contexts/AuthContext';
import { FOOTER_TEXT } from '@/components/Layout/Footer';

export default function LoginPage() {
    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
        
        // For password field, remove the value attribute to prevent HTML inspection
        if (name === 'password') {
            e.target.removeAttribute('value');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Use AuthContext login method which will preload user data
            await login(formData.identifier, formData.password);
            
            // At this point, the user is authenticated and context is updated
            // Navigate to dashboard - it will load immediately with user data
            router.push('/dashboard');
        } catch (error: any) {
            setError(
                error.message ||
                'Login failed. Please check your credentials.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            setIsLoading(true);
            
            const result = await signIn('google', {
                callbackUrl: '/dashboard',
                redirect: false,
            });

            if (result?.error) {
                setError('Google authentication failed. Please try again.');
            } else if (result?.url) {
                // Check if we have a Strapi JWT after successful Google auth
                const session = await getSession();
                if (session?.strapiJwt) {
                    // Set the Strapi JWT as a cookie for traditional auth flow
                    document.cookie = `jwt=${
                        session.strapiJwt
                    }; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
                    
                    // Force AuthContext to reload with new token
                    window.location.href = '/dashboard';
                } else {
                    router.push('/dashboard');
                }
            }
        } catch (error) {
            setError('Google authentication failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Login Form */}
            <div
                className={`w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white transition-all duration-1000 ease-out transform ${
                    isVisible
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-10'
                }`}
            >
                <div className="max-w-md w-full space-y-8">
                    {/* Logo and Title */}
                    <div className="text-center">
                        <div className="relative w-24 h-16 mx-auto mb-6">
                            <Image
                                src="/images/otepc-logo-002.png"
                                alt="OTEPC Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            ระบบประเมินค่างาน OTEPC
                        </h2>
                        <p className="text-gray-600">
                            เข้าสู่ระบบเพื่อเริ่มใช้งาน
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="identifier"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    อีเมล
                                </label>
                                <input
                                    id="identifier"
                                    name="identifier"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.identifier}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                                    placeholder="example@email.com"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    รหัสผ่าน
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                                    placeholder="กรอกรหัสผ่าน"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Remember me and Forgot password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) =>
                                        setRememberMe(e.target.checked)
                                    }
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="remember-me"
                                    className="ml-2 block text-sm text-gray-700"
                                >
                                    จำรหัสผ่าน
                                </label>
                            </div>
                            <button
                                type="button"
                                className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
                            >
                                ลืมรหัสผ่าน?
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-5 w-5 text-red-400"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">
                                            {error}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    กำลังเข้าสู่ระบบ...
                                </div>
                            ) : (
                                'เข้าสู่ระบบ'
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    หรือ
                                </span>
                            </div>
                        </div>

                        {/* Social Login */}
                        {/* <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <svg
                                    className="w-5 h-5 text-red-500"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                <span className="ml-2">Google</span>
                            </button>

                            <button
                                type="button"
                                className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                <span className="ml-2">GitHub</span>
                            </button>
                        </div> */}

                        {/* Sign up link */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                ยังไม่มีบัญชี?{' '}
                                <button
                                    type="button"
                                    className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
                                >
                                    สมัครสมาชิก
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Side - Background Image */}
            <div
                className={`hidden lg:block lg:w-1/2 relative overflow-hidden transition-all duration-1000 ease-out transform ${
                    isVisible
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 translate-x-10'
                }`}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-purple-700/90 z-10"></div>
                <Image
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&h=1080&q=80"
                    alt="Modern workspace"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Overlay content */}
                <div className="absolute inset-0 z-20 flex items-center justify-center p-12">
                    <div className="text-center text-white">
                        <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                            ยินดีต้อนรับ
                        </h1>
                        <p className="text-xl lg:text-2xl mb-8 opacity-90">
                            ระบบประเมินค่างาน เพื่อกำหนดตำแหน่ง
                            <br />
                            บุคลากรทางการศึกษาอื่นตามมาตรา 38 ค.(2)
                        </p>
                        <div className="w-24 h-1 bg-white/50 mx-auto rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Copyright Footer — fixed to the bottom of the full-screen login,
                using the shared canonical text */}
            <footer className="fixed bottom-0 left-0 w-full bg-gray-100 border-t border-gray-200 py-3">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-600">{FOOTER_TEXT}</p>
                </div>
            </footer>
        </div>
    );
}
