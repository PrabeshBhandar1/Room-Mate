'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function Navbar() {
    const { user, profile, signOut } = useAuth();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur-lg">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/images/RoomMate1.png"
                        alt="RoomMate Logo"
                        width={70}
                        height={70}
                        priority
                        className="object-contain"
                    />
                </Link>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="/search" className="hover:text-primary transition-colors">Search</Link>
                    {user && (
                        <Link href="/profile" className="hover:text-primary transition-colors">Profile</Link>
                    )}
                    {user && profile?.role === 'owner' && (
                        <Link href="/owner/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                    )}
                    {user && profile?.role === 'admin' && (
                        <Link href="/admin/dashboard" className="hover:text-primary transition-colors">Admin</Link>
                    )}
                    <Link href="/about" className="hover:text-primary transition-colors">About</Link>
                </nav>

                {/* User Actions / Auth */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/profile" className="flex items-center gap-2 group">
                                {/* Avatar */}
                                <div className="relative h-8 w-8 rounded-full overflow-hidden border border-border bg-muted group-hover:border-primary transition-all">
                                    {profile?.avatar_url ? (
                                        <Image
                                            src={profile.avatar_url}
                                            alt="Avatar"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:text-primary">
                                            {profile?.display_name?.charAt(0) || user.email?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                {/* Name */}
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors hidden md:inline">
                                    {profile?.display_name || 'User'}
                                </span>
                            </Link>

                            <button
                                onClick={signOut}
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
                                Sign In
                            </Link>
                            <Link
                                href="/auth/signup"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
