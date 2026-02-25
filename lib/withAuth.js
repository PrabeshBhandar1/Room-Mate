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
 * @param {boolean} options.requireVerified - If true, owner must be verified (is_verified=true)
 */
export function withAuth(Component, options = {}) {
    return function ProtectedRoute(props) {
        const { user, profile, loading } = useAuth();
        const router = useRouter();
        const { allowedRoles = [], redirectTo = '/auth/login', requireVerified = false } = options;

        useEffect(() => {
            if (!loading) {
                const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
                console.log(`withAuth [${currentPath}]: user=${!!user}, profile=${!!profile}, role=${profile?.role}`);

                // Not authenticated
                if (!user) {
                    if (currentPath !== redirectTo.replace(/\/$/, '')) {
                        console.log(`withAuth [${currentPath}]: Not authenticated, redirecting to ${redirectTo}`);
                        router.push(redirectTo);
                    }
                    return;
                }

                // If user is authenticated but profile is still missing after loading
                // and we have role requirements, we might need to handle this.
                if (allowedRoles.length > 0 && !profile) {
                    console.warn(`withAuth [${currentPath}]: User authenticated but profile missing. Stopping render.`);
                    return;
                }

                // Check role-based access
                if (allowedRoles.length > 0 && profile) {
                    if (!allowedRoles.includes(profile.role)) {
                        const targetPath = profile.role === 'owner' ? '/owner/dashboard' :
                            profile.role === 'admin' ? '/admin/dashboard' : '/';

                        if (currentPath !== targetPath.replace(/\/$/, '')) {
                            console.log(`withAuth [${currentPath}]: Role [${profile.role}] mismatch, redirecting to ${targetPath}`);
                            router.push(targetPath);
                        }
                        return;
                    }
                }

                // Check verification requirement (owners only)
                if (requireVerified && profile && profile.role === 'owner' && !profile.is_verified) {
                    if (currentPath !== '/owner/verify') {
                        console.log(`withAuth [${currentPath}]: Owner not verified, redirecting to /owner/verify`);
                        router.push('/owner/verify');
                    }
                }
            }
        }, [user, profile, loading, router, allowedRoles, redirectTo, requireVerified]);

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

        // Don't render if not authenticated
        if (!user) return null;

        // Don't render if role is required but profile is not yet available
        if (allowedRoles.length > 0 && !profile) return null;

        // Don't render if wrong role
        if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) return null;

        // Don't render if verification is required and owner is not verified
        if (requireVerified && profile && profile.role === 'owner' && !profile.is_verified) return null;

        return <Component {...props} />;
    };
}
