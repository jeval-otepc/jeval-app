import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ApiService } from '@/lib/api';
import { AuthService } from '@/lib/auth';

interface PermissionGateState {
  isCheckingPermissions: boolean;
  hasPermission: boolean;
  permissionChecked: boolean;
}

export function usePermissionGate(): PermissionGateState {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  useEffect(() => {
    console.log('🔍 Permission gate useEffect triggered:', { 
      user: !!user, 
      loading, 
      permissionChecked 
    });
    
    if (loading) {
      console.log('⏸️ Still loading user data...');
      return;
    }
    
    if (!user) {
      console.log('❌ No user data available - redirecting to login');
      setHasPermission(false);
      setIsCheckingPermissions(false);
      setPermissionChecked(true);
      router.push('/login');
      return;
    }

    if (permissionChecked) {
      console.log('✅ Permission already checked');
      return;
    }

    console.log('🔍 Starting permission check...');
    console.log('👤 User from context:', user);
    
    setPermissionChecked(true);
    
    // Simple permission check based on user context first
    if (user.blocked) {
      console.log('❌ User is blocked (from context) - redirecting to login');
      setHasPermission(false);
      setIsCheckingPermissions(false);
      router.push('/login');
      return;
    }

    console.log('✅ User has permission (from context)');
    setHasPermission(true);
    setIsCheckingPermissions(false);

    // Test API endpoints in background (optional)
    const testApiEndpoints = async () => {
      const token = AuthService.getToken();
      console.log('🔍 API Endpoint Tests Started (background)');
      console.log('📝 Auth Token:', token ? 'Present' : 'Missing');

      const tests = [
        {
          name: 'GET /api/users/me',
          fn: () => ApiService.getCurrentUser(),
        },
        {
          name: 'GET /api/questions',
          fn: () => ApiService.getQuestions(),
        },
        {
          name: 'GET /api/forms',
          fn: () => ApiService.getForms(),
        },
      ];

      // Run tests in background without affecting UI
      tests.forEach(async (test) => {
        try {
          console.log(`🚀 Testing ${test.name}...`);
          const result = await test.fn();
          console.log(`✅ ${test.name} - Success`);
        } catch (error: any) {
          console.log(`❌ ${test.name} - Failed:`, error.message);
        }
      });
    };

    // Run API tests after a short delay to not block UI
    setTimeout(() => {
      testApiEndpoints();
    }, 100);

  }, [user, loading, permissionChecked]);

  return {
    isCheckingPermissions,
    hasPermission,
    permissionChecked
  };
}