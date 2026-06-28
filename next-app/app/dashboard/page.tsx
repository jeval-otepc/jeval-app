'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { usePermissionGate } from '@/hooks/usePermissionGate';
import { useMiddlewareStatus } from '@/hooks/useMiddlewareStatus';
import { useLogout } from '@/hooks/useLogout';
import { EvalForm } from '@/components/EvalForm';
import { PageLayout, LoadingSpinner } from '@/components/Layout';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const { isCheckingPermissions, hasPermission } = usePermissionGate();
    const middlewareStatus = useMiddlewareStatus();
    const handleLogout = useLogout();
    const [showEvalForm, setShowEvalForm] = useState(false);

    // Auto-show evaluation form when user has permissions
    useEffect(() => {
        if (
            user &&
            !loading &&
            !isCheckingPermissions &&
            hasPermission &&
            !showEvalForm
        ) {
            setShowEvalForm(true);
        }
    }, [user, loading, isCheckingPermissions, hasPermission, showEvalForm]);

    // Loading state
    if (loading || isCheckingPermissions) {
        return (
            <LoadingSpinner
                message={loading ? 'กำลังโหลด...' : 'กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...'}
                showMiddleware={true}
            />
        );
    }

    // Check if user doesn't have permission
    if (!hasPermission) {
        handleLogout();
        return null;
    }

    // Check if user is blocked (backup check)
    if (user?.blocked) {
        handleLogout();
        return null;
    }

    return (
        <PageLayout
            title="หน้าหลัก"
            showStatusCheck={true}
            middlewareStatus={middlewareStatus}
        >
            {showEvalForm && <EvalForm />}
        </PageLayout>
    );
}