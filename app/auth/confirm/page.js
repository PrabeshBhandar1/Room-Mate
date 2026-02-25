'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

function ConfirmContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState('verifying'); // 'verifying' | 'error'
    const [errorMessage, setErrorMessage] = useState('');
    const hasRun = useRef(false); // Prevent effect from running more than once

    useEffect(() => {
        // Guard: only run once to avoid loops caused by signOut changing the session/URL
        if (hasRun.current) return;
        hasRun.current = true;

        const handleConfirmation = async () => {
            const token_hash = searchParams.get('token_hash');
            const type = searchParams.get('type');

            if (!token_hash || !type) {
                // No token in URL — Supabase may have already auto-confirmed via redirect.
                // Check if there's an active session.
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    // User is confirmed & signed in — sign out cleanly, then go to login
                    await supabase.auth.signOut();
                    router.replace('/auth/login');
                } else {
                    setErrorMessage('Invalid or missing verification link. Please try signing up again.');
                    setStatus('error');
                }
                return;
            }

            try {
                const { error } = await supabase.auth.verifyOtp({
                    token_hash,
                    type,
                });

                if (error) {
                    if (error.message?.includes('expired')) {
                        setErrorMessage('This verification link has expired. Please sign up again.');
                    } else {
                        setErrorMessage(error.message || 'Verification failed. Please try again.');
                    }
                    setStatus('error');
                } else {
                    // Verified — sign out cleanly then redirect directly to login with success flag
                    await supabase.auth.signOut();
                    router.replace('/auth/login?verified=true');
                }
            } catch (err) {
                setErrorMessage('Something went wrong. Please try again.');
                setStatus('error');
            }
        };

        handleConfirmation();
    }, []); // Empty dependency array — run once on mount only

    // Verifying state
    if (status === 'verifying') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
                <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-lg border border-border text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
                    <p className="text-muted-foreground">Please wait a moment.</p>
                </div>
            </div>
        );
    }

    // Error state
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-lg border border-border text-center">
                {/* Error Icon */}
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-foreground mb-3">
                    Verification Failed
                </h1>
                <p className="text-muted-foreground mb-8">
                    {errorMessage}
                </p>

                <div className="space-y-3">
                    <Link
                        href="/auth/signup"
                        className="block w-full h-12 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center"
                    >
                        Try Signing Up Again
                    </Link>
                    <Link
                        href="/auth/login"
                        className="block w-full h-12 border border-input rounded-xl font-medium hover:bg-muted transition-colors flex items-center justify-center"
                    >
                        Go to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ConfirmContent />
        </Suspense>
    );
}
