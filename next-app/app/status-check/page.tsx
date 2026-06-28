'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    AuthTestService,
    type AuthTestResults,
    type TestResult,
} from '@/lib/auth-test';
import {
    BackendServicesTestService,
    type BackendServicesTestResults,
    type ServiceTestResult,
} from '@/lib/backend-services-test';
import { ApiService } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { config } from '@/lib/config';
import { Footer } from '@/components/Layout/Footer';

export default function StatusCheckPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [testResults, setTestResults] = useState<AuthTestResults | null>(
        null,
    );
    const [individualTests, setIndividualTests] = useState<{
        invalidCreds?: TestResult;
        emptyCreds?: TestResult;
        backendConnection?: TestResult;
    }>({});
    const [backendServicesResults, setBackendServicesResults] =
        useState<BackendServicesTestResults | null>(null);
    const [individualServiceTests, setIndividualServiceTests] = useState<
        Record<string, ServiceTestResult>
    >({});
    const [apiTestResults, setApiTestResults] = useState<Record<string, {
        success: boolean;
        data?: unknown;
        error?: string;
        details?: unknown;
    }>>(
        {},
    );
    const [apiLoading, setApiLoading] = useState<Record<string, boolean>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<{
        middleware: boolean;
        backend: boolean;
        backendServices: boolean;
        auth: boolean;
        checkTime: string;
    } | null>(null);

    useEffect(() => {
        checkSystemStatus();
    }, []);

    const checkSystemStatus = async () => {
        const checkTime = new Date().toLocaleTimeString('th-TH');

        // Check middleware (JWT in cookies)
        const jwtToken = document.cookie
            .split(';')
            .find((cookie) => cookie.trim().startsWith('jwt='));

        // Check auth token
        const authToken = AuthService.getToken();

        // Check backend connection (Strapi)
        let backendStatus = false;
        try {
            const response = await fetch(
                `${config.strapi.url}/api/auth/local`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                    body: JSON.stringify({ identifier: '', password: '' }),
                },
            );
            backendStatus = response.status !== 0;
        } catch {
            backendStatus = false;
        }

        // Check backend services connection
        let backendServicesStatus = false;
        try {
            const result =
                await BackendServicesTestService.quickConnectivityTest();
            backendServicesStatus = result.success;
        } catch {
            backendServicesStatus = false;
        }

        setConnectionStatus({
            middleware: !!jwtToken,
            backend: backendStatus,
            backendServices: backendServicesStatus,
            auth: !!authToken,
            checkTime,
        });
    };

    const runFullAuthTestSuite = async () => {
        setIsRunning(true);
        setTestResults(null);
        setIndividualTests({});

        try {
            const results = await AuthTestService.runAllTests();
            setTestResults(results);
        } catch (error) {
            console.error('Test suite failed:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const runFullBackendServicesTestSuite = async () => {
        setIsRunning(true);
        setBackendServicesResults(null);
        setIndividualServiceTests({});

        try {
            const results = await BackendServicesTestService.runAllTests();
            setBackendServicesResults(results);
        } catch (error) {
            console.error('Backend Services test suite failed:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const runIndividualTest = async (
        testType: 'invalid' | 'empty' | 'backend',
    ) => {
        setIsRunning(true);

        try {
            let result: TestResult;

            switch (testType) {
                case 'invalid':
                    result = await AuthTestService.testInvalidCredentials();
                    setIndividualTests((prev) => ({
                        ...prev,
                        invalidCreds: result,
                    }));
                    break;
                case 'empty':
                    result = await AuthTestService.testEmptyCredentials();
                    setIndividualTests((prev) => ({
                        ...prev,
                        emptyCreds: result,
                    }));
                    break;
                case 'backend':
                    result = await AuthTestService.testBackendConnection();
                    setIndividualTests((prev) => ({
                        ...prev,
                        backendConnection: result,
                    }));
                    break;
            }
        } catch (error) {
            console.error('Individual test failed:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const runIndividualServiceTest = async (serviceName: string) => {
        setIsRunning(true);

        try {
            const result = await BackendServicesTestService.testSpecificService(
                serviceName,
            );
            setIndividualServiceTests((prev) => ({
                ...prev,
                [serviceName]: result,
            }));
        } catch (error) {
            console.error(
                `Individual service test failed for ${serviceName}:`,
                error,
            );
            setIndividualServiceTests((prev) => ({
                ...prev,
                [serviceName]: {
                    service: serviceName,
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    duration: 0,
                },
            }));
        } finally {
            setIsRunning(false);
        }
    };

    const testApiEndpoint = async (
        name: string,
        testFn: () => Promise<unknown>,
    ) => {
        setApiLoading((prev) => ({ ...prev, [name]: true }));
        try {
            const result = await testFn();
            setApiTestResults((prev) => ({
                ...prev,
                [name]: { success: true, data: result },
            }));
        } catch (error: unknown) {
            setApiTestResults((prev) => ({
                ...prev,
                [name]: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    details: error,
                },
            }));
        } finally {
            setApiLoading((prev) => ({ ...prev, [name]: false }));
        }
    };

    const apiTests = [
        {
            name: 'GET /api/questions',
            fn: () => ApiService.getQuestions(),
        },
        {
            name: 'GET /api/users/me',
            fn: () => ApiService.getCurrentUser(),
        },
        {
            name: 'POST /api/forms',
            fn: () =>
                ApiService.createForm({
                    TypePos: 'SPEC',
                    Name_Pos: 'Test Position',
                    Num_Pos_M: 'TEST001',
                }),
        },
        {
            name: 'GET /api/forms/analyse/1',
            fn: () => ApiService.analyzeForm(1),
        },
    ];

    const testAuthToken = () => {
        const token = AuthService.getToken();
        const cookies = document.cookie;
        console.log('Current token:', token);
        console.log('All cookies:', cookies);

        setApiTestResults((prev) => ({
            ...prev,
            'Auth Token Check': {
                success: !!token,
                data: {
                    token: token || 'No token found',
                    cookies: cookies || 'No cookies found',
                    tokenExists: !!token,
                },
            },
        }));
    };

    const TestResultCard = ({
        result,
        title,
    }: {
        result: TestResult;
        title: string;
    }) => (
        <div
            className={`border rounded-lg p-4 ${
                result.success
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
            }`}
        >
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center">
                    {result.success ? (
                        <span className="text-green-600 mr-2">✅</span>
                    ) : (
                        <span className="text-red-600 mr-2">❌</span>
                    )}
                    {title}
                </h4>
                <span className="text-sm text-gray-500">
                    {result.duration}ms
                </span>
            </div>

            {result.error && (
                <div className="text-red-600 text-sm mb-2">
                    <strong>Error:</strong> {result.error}
                </div>
            )}

            {result.data != null && (
                <details className="text-sm text-gray-600">
                    <summary className="cursor-pointer font-medium">
                        View Data
                    </summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2) as string}
                    </pre>
                </details>
            )}
        </div>
    );

    const ServiceTestResultCard = ({
        result,
        title,
    }: {
        result: ServiceTestResult;
        title: string;
    }) => (
        <div
            className={`border rounded-lg p-4 ${
                result.success
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
            }`}
        >
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center">
                    {result.success ? (
                        <span className="text-green-600 mr-2">✅</span>
                    ) : (
                        <span className="text-red-600 mr-2">❌</span>
                    )}
                    {title}
                </h4>
                <div className="text-right">
                    <span className="text-sm text-gray-500">
                        {result.duration}ms
                    </span>
                    {result.status && (
                        <div
                            className={`text-xs ${
                                result.status < 400
                                    ? 'text-green-600'
                                    : result.status < 500
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                            }`}
                        >
                            HTTP {result.status}
                        </div>
                    )}
                </div>
            </div>

            {result.endpoint && (
                <div className="text-xs text-gray-500 mb-2">
                    <strong>Endpoint:</strong> {result.endpoint}
                </div>
            )}

            {result.error && (
                <div className="text-red-600 text-sm mb-2">
                    <strong>Error:</strong> {result.error}
                </div>
            )}

            {result.data != null && (
                <details className="text-sm text-gray-600">
                    <summary className="cursor-pointer font-medium">
                        View Response
                    </summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2) as string}
                    </pre>
                </details>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Header */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="relative w-24 h-12">
                                <Image
                                    src="/images/otepc-logo-002.png"
                                    alt="OTEPC Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <h1 className="ml-4 text-xl font-semibold text-gray-900">
                                ตรวจสอบสถานะ
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                            >
                                กลับสู่แดชบอร์ด
                            </button>
                            <div className="text-sm text-gray-700">
                                <span className="font-medium">
                                    {(user && 'displayname' in user ? user.displayname as string : undefined) ||
                                        user?.username}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* System Status Overview */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex items-center mb-4">
                        <div className="relative w-24 h-12 mr-4">
                            <Image
                                src="/images/otepc-logo-002.png"
                                alt="OTEPC Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                ระบบตรวจสอบสถานะ
                            </h1>
                            <p className="text-gray-600">
                                ตรวจสอบการเชื่อมต่อ การทำงานของระบบ และการแสดงผล
                            </p>
                        </div>
                        <button
                            onClick={checkSystemStatus}
                            className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                        >
                            รีเฟรชสถานะ
                        </button>
                    </div>

                    {connectionStatus && (
                        <div>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                                <div
                                    className={`p-4 rounded-lg border ${
                                        connectionStatus.middleware
                                            ? 'border-green-200 bg-green-50'
                                            : 'border-red-200 bg-red-50'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <span
                                            className={`w-3 h-3 rounded-full mr-2 ${
                                                connectionStatus.middleware
                                                    ? 'bg-green-500'
                                                    : 'bg-red-500'
                                            }`}
                                        ></span>
                                        <div>
                                            <div className="font-semibold text-sm">
                                                Middleware
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {connectionStatus.middleware
                                                    ? 'JWT OK'
                                                    : 'No JWT'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`p-4 rounded-lg border ${
                                        connectionStatus.backend
                                            ? 'border-green-200 bg-green-50'
                                            : 'border-red-200 bg-red-50'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <span
                                            className={`w-3 h-3 rounded-full mr-2 ${
                                                connectionStatus.backend
                                                    ? 'bg-green-500'
                                                    : 'bg-red-500'
                                            }`}
                                        ></span>
                                        <div>
                                            <div className="font-semibold text-sm">
                                                Strapi Backend
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {connectionStatus.backend
                                                    ? 'Connected'
                                                    : 'Offline'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`p-4 rounded-lg border ${
                                        connectionStatus.backendServices
                                            ? 'border-green-200 bg-green-50'
                                            : 'border-red-200 bg-red-50'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <span
                                            className={`w-3 h-3 rounded-full mr-2 ${
                                                connectionStatus.backendServices
                                                    ? 'bg-green-500'
                                                    : 'bg-red-500'
                                            }`}
                                        ></span>
                                        <div>
                                            <div className="font-semibold text-sm">
                                                Backend Services
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {connectionStatus.backendServices
                                                    ? 'Online'
                                                    : 'Offline'}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {config.getBackendServicesUrl()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`p-4 rounded-lg border ${
                                        connectionStatus.auth
                                            ? 'border-green-200 bg-green-50'
                                            : 'border-red-200 bg-red-50'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <span
                                            className={`w-3 h-3 rounded-full mr-2 ${
                                                connectionStatus.auth
                                                    ? 'bg-green-500'
                                                    : 'bg-red-500'
                                            }`}
                                        ></span>
                                        <div>
                                            <div className="font-semibold text-sm">
                                                Authentication
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {connectionStatus.auth
                                                    ? 'Token Valid'
                                                    : 'No Token'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 rounded-full mr-2 bg-blue-500"></span>
                                        <div>
                                            <div className="font-semibold text-sm">
                                                Last Check
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {connectionStatus.checkTime}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Environment Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-sm text-gray-700 mb-2">
                                    Environment Configuration
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
                                    <div>
                                        <div className="font-medium">
                                            Environment:
                                        </div>
                                        <div>{config.app.env}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            Strapi URL:
                                        </div>
                                        <div className="break-all">
                                            {config.strapi.url}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            Backend Services URL:
                                        </div>
                                        <div className="break-all">
                                            {config.getBackendServicesUrl()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Authentication Tests */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">
                        การทดสอบการยืนยันตัวตน (Authentication Tests)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={runFullAuthTestSuite}
                            disabled={isRunning}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                            {isRunning ? 'กำลังทดสอบ...' : 'ทดสอบทั้งหมด'}
                        </button>

                        <button
                            onClick={() => runIndividualTest('backend')}
                            disabled={isRunning}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                            ทดสอบการเชื่อมต่อ Backend
                        </button>

                        <button
                            onClick={() => runIndividualTest('invalid')}
                            disabled={isRunning}
                            className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                            ทดสอบ Invalid Credentials
                        </button>

                        <button
                            onClick={() => runIndividualTest('empty')}
                            disabled={isRunning}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                            ทดสอบ Empty Credentials
                        </button>
                    </div>

                    {/* Auth Test Results Summary */}
                    {testResults && (
                        <div className="mt-6">
                            <h3 className="text-md font-semibold mb-4">
                                ผลการทดสอบการยืนยันตัวตน
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {testResults.summary.totalTests}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Total Tests
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {testResults.summary.passed}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        ผ่าน
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">
                                        {testResults.summary.failed}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        ไม่ผ่าน
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {testResults.summary.duration}ms
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        เวลาทั้งหมด
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <TestResultCard
                                    result={testResults.loginTest}
                                    title="ทดสอบการเข้าสู่ระบบ"
                                />
                                <TestResultCard
                                    result={testResults.tokenValidationTest}
                                    title="ทดสอบการตรวจสอบ Token"
                                />
                                <TestResultCard
                                    result={testResults.userInfoTest}
                                    title="ทดสอบการดึงข้อมูลผู้ใช้"
                                />
                                <TestResultCard
                                    result={testResults.logoutTest}
                                    title="ทดสอบการออกจากระบบ"
                                />
                            </div>
                        </div>
                    )}

                    {/* Individual Test Results */}
                    {(individualTests.backendConnection ||
                        individualTests.invalidCreds ||
                        individualTests.emptyCreds) && (
                        <div className="mt-6">
                            <h3 className="text-md font-semibold mb-4">
                                ผลการทดสอบเฉพาะ
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {individualTests.backendConnection && (
                                    <TestResultCard
                                        result={
                                            individualTests.backendConnection
                                        }
                                        title="การเชื่อมต่อ Backend"
                                    />
                                )}
                                {individualTests.invalidCreds && (
                                    <TestResultCard
                                        result={individualTests.invalidCreds}
                                        title="Invalid Credentials"
                                    />
                                )}
                                {individualTests.emptyCreds && (
                                    <TestResultCard
                                        result={individualTests.emptyCreds}
                                        title="Empty Credentials"
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Backend Services Tests */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">
                        การทดสอบ Backend Services
                    </h2>
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-4">
                            ทดสอบการเชื่อมต่อกับ Backend Services ที่แยกจาก
                            Strapi Backend โดยใช้ URL:
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs ml-1">
                                {config.getBackendServicesUrl()}
                            </code>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <button
                            onClick={runFullBackendServicesTestSuite}
                            disabled={isRunning}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                            {isRunning
                                ? 'กำลังทดสอบ...'
                                : 'ทดสอบ Backend Services ทั้งหมด'}
                        </button>

                        <button
                            onClick={() => runIndividualServiceTest('health')}
                            disabled={isRunning}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                            Health Check
                        </button>

                        <button
                            onClick={() => runIndividualServiceTest('api')}
                            disabled={isRunning}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                            API Status
                        </button>

                        <button
                            onClick={() => runIndividualServiceTest('database')}
                            disabled={isRunning}
                            className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                            Database Connection
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => runIndividualServiceTest('auth')}
                            disabled={isRunning}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                            Auth Service
                        </button>

                        <button
                            onClick={() => runIndividualServiceTest('form')}
                            disabled={isRunning}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                            Form Service
                        </button>

                        <button
                            onClick={() => runIndividualServiceTest('analysis')}
                            disabled={isRunning}
                            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                            Analysis Service
                        </button>
                    </div>

                    {/* Backend Services Test Results Summary */}
                    {backendServicesResults && (
                        <div className="mt-6">
                            <h3 className="text-md font-semibold mb-4">
                                ผลการทดสอบ Backend Services
                            </h3>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {
                                            backendServicesResults.summary
                                                .totalServices
                                        }
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Total Services
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {
                                            backendServicesResults.summary
                                                .onlineServices
                                        }
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Online
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">
                                        {
                                            backendServicesResults.summary
                                                .offlineServices
                                        }
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Offline
                                    </div>
                                </div>
                                <div
                                    className={`text-center p-4 rounded-lg ${
                                        backendServicesResults.summary
                                            .overallStatus === 'healthy'
                                            ? 'bg-green-50'
                                            : backendServicesResults.summary
                                                  .overallStatus === 'degraded'
                                            ? 'bg-yellow-50'
                                            : 'bg-red-50'
                                    }`}
                                >
                                    <div
                                        className={`text-2xl font-bold ${
                                            backendServicesResults.summary
                                                .overallStatus === 'healthy'
                                                ? 'text-green-600'
                                                : backendServicesResults.summary
                                                      .overallStatus ===
                                                  'degraded'
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                        }`}
                                    >
                                        {backendServicesResults.summary.overallStatus.toUpperCase()}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Overall Status
                                    </div>
                                </div>
                            </div>

                            {/* Service Test Results */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <ServiceTestResultCard
                                    result={backendServicesResults.healthCheck}
                                    title="Health Check"
                                />
                                <ServiceTestResultCard
                                    result={backendServicesResults.apiStatus}
                                    title="API Status"
                                />
                                <ServiceTestResultCard
                                    result={
                                        backendServicesResults.databaseConnection
                                    }
                                    title="Database Connection"
                                />
                                <ServiceTestResultCard
                                    result={backendServicesResults.authService}
                                    title="Authentication Service"
                                />
                                <ServiceTestResultCard
                                    result={backendServicesResults.formService}
                                    title="Form Service"
                                />
                                <ServiceTestResultCard
                                    result={
                                        backendServicesResults.analysisService
                                    }
                                    title="Analysis Service"
                                />
                            </div>
                        </div>
                    )}

                    {/* Individual Service Test Results */}
                    {Object.keys(individualServiceTests).length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-md font-semibold mb-4">
                                ผลการทดสอบ Service เฉพาะ
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {Object.entries(individualServiceTests).map(
                                    ([serviceName, result]) => (
                                        <ServiceTestResultCard
                                            key={serviceName}
                                            result={result}
                                            title={
                                                serviceName
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                serviceName.slice(1)
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* API Endpoint Tests */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">
                        การทดสอบ API Endpoints
                    </h2>

                    <div className="space-y-4">
                        <button
                            onClick={testAuthToken}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            ตรวจสอบ Auth Token
                        </button>

                        {apiTests.map((test) => (
                            <div
                                key={test.name}
                                className="flex items-center space-x-4"
                            >
                                <button
                                    onClick={() =>
                                        testApiEndpoint(test.name, test.fn)
                                    }
                                    disabled={apiLoading[test.name]}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 min-w-[250px]"
                                >
                                    {apiLoading[test.name]
                                        ? 'กำลังทดสอบ...'
                                        : `ทดสอบ ${test.name}`}
                                </button>

                                {apiTestResults[test.name] && (
                                    <div
                                        className={`px-3 py-1 rounded text-sm ${
                                            apiTestResults[test.name].success
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {apiTestResults[test.name].success
                                            ? 'สำเร็จ'
                                            : 'ล้มเหลว'}
                                        {!apiTestResults[test.name].success && (
                                            <span className="block text-xs mt-1">
                                                {
                                                    apiTestResults[test.name]
                                                        .error
                                                }
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {Object.keys(apiTestResults).length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-medium text-gray-900 mb-2">
                                ผลการทดสอบ API:
                            </h4>
                            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                                {JSON.stringify(apiTestResults, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Debug Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">ข้อมูล Debug</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h3 className="font-semibold text-green-600 mb-2">
                                ✅ Strapi Backend (Expected):
                            </h3>
                            <ul className="text-sm space-y-1 text-gray-600">
                                <li>• Strapi URL: {config.strapi.url}</li>
                                <li>• JWT Token ในคุกกี้</li>
                                <li>• Authentication Token ใน LocalStorage</li>
                                <li>• API Endpoints เข้าถึงได้</li>
                                <li>• Response time ต่ำกว่า 1000ms</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-blue-600 mb-2">
                                🏗️ Backend Services (Expected):
                            </h3>
                            <ul className="text-sm space-y-1 text-gray-600">
                                <li>
                                    • Services URL:{' '}
                                    {config.getBackendServicesUrl()}
                                </li>
                                <li>• Health Check: /health</li>
                                <li>• API Status: /api/status</li>
                                <li>• Database: /api/db/ping</li>
                                <li>• Auth: /api/auth/verify</li>
                                <li>• Forms: /api/forms</li>
                                <li>• Analysis: /api/analysis/ping</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-red-600 mb-2">
                                ❌ ปัญหาที่อาจเจอ:
                            </h3>
                            <ul className="text-sm space-y-1 text-gray-600">
                                <li>• Backend Servers ไม่ทำงาน (500)</li>
                                <li>• Network connectivity issues</li>
                                <li>• Invalid credentials (401)</li>
                                <li>• Missing permissions (403)</li>
                                <li>• Token หมดอายุ</li>
                                <li>• Cross-server communication issues</li>
                                <li>• Firewall blocking connections</li>
                                <li>• Environment configuration mismatch</li>
                            </ul>
                        </div>
                    </div>

                    {/* Configuration Details */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-700 mb-4">
                            Configuration Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-600 mb-2">
                                    Environment Variables
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-lg text-xs font-mono">
                                    <div>
                                        NEXT_PUBLIC_APP_ENV: {config.app.env}
                                    </div>
                                    <div>
                                        NEXT_PUBLIC_STRAPI_URL:{' '}
                                        {config.strapi.url}
                                    </div>
                                    <div>
                                        NEXT_PUBLIC_BACKEND_SERVICES_URL:{' '}
                                        {config.backendServices.url}
                                    </div>
                                    <div>
                                        NEXT_PUBLIC_BACKEND_SERVICES_API_URL:{' '}
                                        {config.backendServices.apiUrl}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-600 mb-2">
                                    Network Settings
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-lg text-xs font-mono">
                                    <div>
                                        Connection Timeout:{' '}
                                        {config.network.connectionTimeout}ms
                                    </div>
                                    <div>
                                        API Timeout: {config.network.apiTimeout}
                                        ms
                                    </div>
                                    <div>
                                        Debug Mode:{' '}
                                        {config.debug.enabled
                                            ? 'Enabled'
                                            : 'Disabled'}
                                    </div>
                                    <div>
                                        Log Level: {config.debug.logLevel}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Production Deployment Notes */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-semibold text-orange-600 mb-4">
                            📝 Production Deployment Notes
                        </h3>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <ul className="text-sm space-y-2 text-orange-800">
                                <li>
                                    • <strong>Backend Services URL:</strong>{' '}
                                    ต้องเปลี่ยนจาก localhost เป็น production
                                    server IP/domain
                                </li>
                                <li>
                                    • <strong>Environment Variables:</strong>{' '}
                                    ตั้งค่า
                                    NEXT_PUBLIC_BACKEND_SERVICES_PROD_URL ใน
                                    production
                                </li>
                                <li>
                                    • <strong>Network Security:</strong> ตรวจสอบ
                                    firewall และ cors settings ระหว่าง servers
                                </li>
                                <li>
                                    • <strong>Authentication:</strong> ตั้งค่า
                                    BACKEND_SERVICES_API_TOKEN สำหรับ production
                                </li>
                                <li>
                                    • <strong>Health Checks:</strong>{' '}
                                    ตรวจสอบให้แน่ใจว่า /health endpoints ทำงานใน
                                    production
                                </li>
                                <li>
                                    • <strong>SSL/HTTPS:</strong> ใช้ HTTPS URLs
                                    ใน production environment
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
