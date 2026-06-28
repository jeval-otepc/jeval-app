'use client';

import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Single source of truth for logging out. Clears the auth session, then routes
 * back to /login — and still redirects even if the network call fails, so the
 * user is never left stuck on a protected page.
 *
 * Replaces the identical handleLogout copies that lived in every page/nav.
 */
export function useLogout(): () => Promise<void> {
    const router = useRouter();
    const { logout } = useAuth();

    return async () => {
        try {
            await AuthService.logout();
            if (logout) {
                await logout();
            }
            router.push('/login');
        } catch (err) {
            console.error('Logout failed:', err);
            router.push('/login');
        }
    };
}
