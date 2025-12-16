'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

/**
 * Higher-order component to protect routes based on authentication and role
 * @param {React.Component} Component - The component to wrap
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.allowedRoles - Array of allowed roles (e.g., ['owner', 'admin'])
 * @param {string} options.redirectTo - Where to redirect if unauthorized (default: '/auth/login')
 */
export function withAuth(Component, options = {}) {
    return function ProtectedRoute(props) {
        const { user, profile, loading } = useAuth();
        const router = useRouter();
        const { allowedRoles = [], redirectTo = '/auth/login' } = options;

        useEffect(() => {
            if (!loading) {
                // Not authenticated
                if (!user) {
                    router.push(redirectTo);
                    return;
                }

                // Check role-based access
                if (allowedRoles.length > 0 && profile) {
                    if (!allowedRoles.includes(profile.role)) {
                        // Redirect to appropriate page based on role
                        if (profile.role === 'owner') {
                            router.push('/owner/dashboard');
                        } else if (profile.role === 'admin') {
                            router.push('/admin/dashboard');
                        } else {
                            router.push('/');
                        }
                    }
                }
            }
        }, [user, profile, loading, router]);

        // Show loading state while checking auth
        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
            );
        }

        // Don't render component until auth is verified
        if (!user || (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role))) {
            return null;
        }

        return <Component {...props} />;
    };
}
