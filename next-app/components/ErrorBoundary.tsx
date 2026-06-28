'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
    retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
    private readonly maxRetries = 3;

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            retryCount: 0,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({
            error,
            errorInfo,
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log to external service (if needed)
        this.logErrorToService(error, errorInfo);
    }

    private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
        // Here you can integrate with error tracking services like Sentry
        // For now, we'll just log to console
        const errorReport = {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        };

        console.error('Error Report:', errorReport);
    };

    private handleRetry = () => {
        if (this.state.retryCount < this.maxRetries) {
            this.setState(prevState => ({
                hasError: false,
                error: undefined,
                errorInfo: undefined,
                retryCount: prevState.retryCount + 1,
            }));
        }
    };

    private handleGoHome = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
    };

    private handleReload = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                    <div className="sm:mx-auto sm:w-full sm:max-w-md">
                        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                </div>
                                
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        เกิดข้อผิดพลาด
                                    </h2>
                                    <p className="text-gray-600 text-sm">
                                        เกิดข้อผิดพลาดที่ไม่คาดคิดขึ้น กรุณาลองใหม่อีกครั้ง
                                    </p>
                                </div>

                                {process.env.NODE_ENV === 'development' && this.state.error && (
                                    <details className="w-full mt-4">
                                        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
                                            <Bug className="w-4 h-4" />
                                            รายละเอียดข้อผิดพลาด (Development Mode)
                                        </summary>
                                        <div className="mt-2 p-3 bg-red-50 rounded text-xs text-red-800 font-mono overflow-auto max-h-40">
                                            <strong>Error:</strong> {this.state.error.message}
                                            <br />
                                            <strong>Stack:</strong>
                                            <pre className="whitespace-pre-wrap mt-1">
                                                {this.state.error.stack}
                                            </pre>
                                        </div>
                                    </details>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
                                    {this.state.retryCount < this.maxRetries && (
                                        <button
                                            onClick={this.handleRetry}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            ลองใหม่ ({this.maxRetries - this.state.retryCount} ครั้ง)
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={this.handleGoHome}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <Home className="w-4 h-4" />
                                        กลับหน้าหลัก
                                    </button>
                                </div>

                                {this.state.retryCount >= this.maxRetries && (
                                    <button
                                        onClick={this.handleReload}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        โหลดหน้าใหม่
                                    </button>
                                )}

                                <p className="text-xs text-gray-500 text-center mt-4">
                                    หากปัญหายังคงเกิดขึ้นอย่างต่อเนื่อง กรุณาติดต่อผู้ดูแลระบบ
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<Props, 'children'>
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
    
    return WrappedComponent;
}

// Hook for programmatic error reporting
export function useErrorHandler() {
    const reportError = React.useCallback((error: Error, context?: string) => {
        console.error(`Error in ${context || 'component'}:`, error);
        
        // You can extend this to report to external services
        // For example, Sentry, LogRocket, etc.
    }, []);

    return { reportError };
}

// Simple error fallback components
export const SimpleErrorFallback: React.FC<{ 
    message?: string;
    onRetry?: () => void;
}> = ({ 
    message = 'เกิดข้อผิดพลาดในการแสดงผล', 
    onRetry 
}) => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                ลองใหม่
            </button>
        )}
    </div>
);

export default ErrorBoundary;