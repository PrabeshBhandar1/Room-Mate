'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { signIn, user, profile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Show success toast if coming from email verification
        if (searchParams.get('verified') === 'true') {
            toast.success('Email verified successfully! Please sign in.');
            // Remove the query param to avoid multiple toasts
            router.replace('/auth/login', { scroll: false });
        }
    }, [searchParams, router]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null);
        setLoading(true);

        try {
            const { error } = await signIn(email, password);

            if (error) {
                setLoginError(error.message || 'Failed to sign in');
                toast.error(error.message || 'Failed to sign in');
                setLoading(false);
            } else {
                toast.success('Signed in successfully!');
            }
        } catch (err) {
            setLoginError('An unexpected error occurred');
            toast.error('An unexpected error occurred');
            setLoading(false);
        }
    };


    useEffect(() => {
        if (user && profile) {
            const target = profile.role === 'owner' ? '/owner/dashboard' :
                profile.role === 'admin' ? '/admin/dashboard' : '/';
            console.log(`Login: Auth complete (user=${user.id}), redirecting to ${target}`);
            const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
            if (currentPath !== target.replace(/\/$/, '')) {
                router.push(target);
            }
        }
    }, [user, profile, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-lg border border-border">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
                    <p className="text-muted-foreground mt-2">Sign in to continue</p>
                </div>

                {loginError && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-6">
                        {loginError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                        Create Account
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
