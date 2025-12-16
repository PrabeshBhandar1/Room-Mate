'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmail() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-lg border border-border text-center">
                {/* Icon */}
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-8 h-8 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                </div>

                {/* Content */}
                <h1 className="text-3xl font-bold text-foreground mb-4">
                    Check Your Email
                </h1>

                {email && (
                    <p className="text-muted-foreground mb-6">
                        We've sent a verification link to <br />
                        <span className="font-medium text-foreground">{email}</span>
                    </p>
                )}

                <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left space-y-2">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Next steps:</span>
                    </p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Open your email inbox</li>
                        <li>Click the verification link we sent you</li>
                        <li>Return here and sign in</li>
                    </ol>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/auth/login"
                        className="block w-full h-12 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center"
                    >
                        Go to Sign In
                    </Link>

                    <p className="text-sm text-muted-foreground">
                        Didn't receive the email?{' '}
                        <button className="text-primary hover:underline font-medium">
                            Resend verification
                        </button>
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                        Make sure to check your spam folder if you don't see the email in your inbox.
                    </p>
                </div>
            </div>
        </div>
    );
}
