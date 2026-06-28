'use client';

import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { Footer } from './Footer';

interface PageLayoutProps {
    children: ReactNode;
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

export function PageLayout({
    children,
    title,
    showBackButton = false,
    backButtonText = 'กลับสู่แดชบอร์ด',
    backButtonHref = '/dashboard',
    showStatusCheck = false,
    middlewareStatus = null
}: PageLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation
                title={title}
                showBackButton={showBackButton}
                backButtonText={backButtonText}
                backButtonHref={backButtonHref}
                showStatusCheck={showStatusCheck}
                middlewareStatus={middlewareStatus}
            />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
            
            <Footer />
        </div>
    );
}