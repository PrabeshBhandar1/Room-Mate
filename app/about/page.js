'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function AboutPage() {
    const { user, profile, signOut } = useAuth();

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/">
                        <Image src="/images/RoomMate1.png" alt="Logo" width={70} height={70} />
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        <Link href="/search" className="hover:text-primary transition-colors">Search</Link>
                        {user && profile?.role === 'owner' && (
                            <Link href="/owner/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                        )}
                        {user && profile?.role === 'admin' && (
                            <Link href="/admin/dashboard" className="hover:text-primary transition-colors">Admin</Link>
                        )}
                        <Link href="/about" className="text-primary font-semibold">About</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <span className="text-sm text-muted-foreground hidden md:inline">
                                    {profile?.display_name || user.email}
                                </span>
                                <button
                                    onClick={signOut}
                                    className="text-sm font-medium hover:text-primary transition-colors"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative px-4 py-20 text-center overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
                <div className="container mx-auto max-w-4xl">
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm mb-6">
                        <span>🇳🇵 About RoomMate</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                        Modernizing Rental <span className="text-primary">in Nepal</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        A secure, transparent, and user-friendly platform connecting tenants and property owners across Nepal.
                    </p>
                </div>
            </section>

            {/* Who We Are */}
            <section className="container mx-auto px-4 py-16 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Who We Are</h2>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            RoomMate is a modern rental platform built to simplify how people find and list rooms and flats in Nepal.
                            We connect tenants and property owners through a secure, structured, and easy-to-use digital platform.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-12 backdrop-blur-sm border border-white/10">
                        <div className="text-6xl mb-4">🏠</div>
                        <h3 className="text-2xl font-bold mb-2">Our Platform</h3>
                        <p className="text-muted-foreground">
                            Secure, verified, and organized rental marketplace designed for Nepal.
                        </p>
                    </div>
                </div>
            </section>

            {/* The Problem */}
            <section className="bg-muted/30 py-16">
                <div className="container mx-auto px-4 max-w-6xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">The Problem We're Solving</h2>
                    <p className="text-center text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                        Finding a room or flat in Nepal can be stressful and unreliable.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: '📱', title: 'Endless Scrolling', desc: 'Scattered social media posts make searching exhausting' },
                            { icon: '⚠️', title: 'Unverified Listings', desc: 'Outdated or fake listings waste your time' },
                            { icon: '🔍', title: 'No Filtering', desc: 'Limited options to find what you actually need' },
                            { icon: '💬', title: 'Insecure Communication', desc: 'No proper channel to contact owners' },
                            { icon: '🔒', title: 'Lack of Transparency', desc: 'Unclear details between tenants and owners' },
                            { icon: '😓', title: 'Stress & Confusion', desc: 'Disorganized process causes frustration' }
                        ].map((problem, idx) => (
                            <div key={idx} className="bg-background rounded-xl p-6 border border-border hover:shadow-lg transition-all">
                                <div className="text-4xl mb-3">{problem.icon}</div>
                                <h3 className="text-lg font-bold mb-2">{problem.title}</h3>
                                <p className="text-sm text-muted-foreground">{problem.desc}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-lg font-semibold mt-12 text-primary">
                        We believe renting should be organized, safe, and efficient.
                    </p>
                </div>
            </section>

            {/* Our Solution */}
            <section className="container mx-auto px-4 py-16 max-w-6xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Solution</h2>
                <p className="text-center text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                    RoomMate brings clarity and structure to the rental process by offering:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    {[
                        { icon: '✅', title: 'Verified Listings', desc: 'All listings reviewed by admins before going public' },
                        { icon: '👥', title: 'Separate Accounts', desc: 'Dedicated dashboards for Tenants and Owners' },
                        { icon: '💬', title: 'Real-time Messaging', desc: 'Secure chat between interested parties' },
                        { icon: '🔎', title: 'Advanced Filters', desc: 'Search by area, price, and property type' },
                        { icon: '📸', title: 'Detailed Listings', desc: 'Clear photos, specs, and amenities' },
                        { icon: '⚡', title: 'Time-Saving', desc: 'Organized process reduces confusion' }
                    ].map((solution, idx) => (
                        <div key={idx} className="flex gap-4 p-6 rounded-xl border border-border hover:bg-muted/50 transition-all">
                            <div className="text-3xl flex-shrink-0">{solution.icon}</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">{solution.title}</h3>
                                <p className="text-muted-foreground">{solution.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 border border-border">
                            <div className="text-5xl mb-4">🎯</div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Mission</h2>
                            <p className="text-muted-foreground text-lg">
                                To modernize the rental experience in Nepal by building a secure, transparent, and user-friendly platform
                                that empowers both tenants and property owners.
                            </p>
                        </div>
                        <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 border border-border">
                            <div className="text-5xl mb-4">🚀</div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Vision</h2>
                            <p className="text-muted-foreground text-lg">
                                To become Nepal's most trusted rental marketplace and expand into broader property solutions
                                that support smarter housing decisions.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Trust RoomMate */}
            <section className="container mx-auto px-4 py-16 max-w-6xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Why Trust RoomMate?</h2>
                <p className="text-center text-lg text-muted-foreground mb-12">
                    Trust and transparency are at the core of our platform.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { title: 'Admin Approval', desc: 'Every listing goes through a review process', icon: '✓' },
                        { title: 'Secure Messaging', desc: 'Users communicate through in-app chat', icon: '🔒' },
                        { title: 'Role-Based Access', desc: 'Protected user data with proper permissions', icon: '👤' },
                        { title: 'Status Tracking', desc: 'Clear listing status ensures authenticity', icon: '📊' },
                        { title: 'Long-Term Focus', desc: 'Reliability over short-term growth', icon: '🛡️' },
                        { title: 'User-First', desc: 'Designed with your needs in mind', icon: '❤️' }
                    ].map((trust, idx) => (
                        <div key={idx} className="text-center p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all">
                            <div className="text-4xl mb-3">{trust.icon}</div>
                            <h3 className="font-bold mb-2">{trust.title}</h3>
                            <p className="text-sm text-muted-foreground">{trust.desc}</p>
                        </div>
                    ))}
                </div>
                <p className="text-center text-lg font-semibold mt-12">
                    We are committed to building a platform that users can rely on.
                </p>
            </section>

            {/* For Tenants & Owners */}
            <section className="bg-muted/30 py-16">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* For Tenants */}
                        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 border border-primary/20">
                            <div className="text-5xl mb-4">🔍</div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-6">For Tenants</h2>
                            <p className="text-muted-foreground mb-6">RoomMate helps tenants:</p>
                            <ul className="space-y-3">
                                {[
                                    'Discover verified rental options',
                                    'Filter listings based on budget and location',
                                    'View detailed property information',
                                    'Directly message property owners in real time'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="text-primary text-xl">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-6 font-semibold text-primary">No middlemen. No unnecessary steps.</p>
                        </div>

                        {/* For Owners */}
                        <div className="rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 p-8 border border-secondary/20">
                            <div className="text-5xl mb-4">🏠</div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-6">For Property Owners</h2>
                            <p className="text-muted-foreground mb-6">RoomMate helps owners:</p>
                            <ul className="space-y-3">
                                {[
                                    'List rooms and flats easily',
                                    'Upload property photos',
                                    'Manage listings from a dedicated dashboard',
                                    'Connect directly with interested tenants',
                                    'Track listing status (Pending, Approved, Rejected)'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="text-secondary text-xl">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-6 font-semibold text-secondary">
                                We provide the tools to manage rental properties efficiently.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Values */}
            <section className="container mx-auto px-4 py-16 max-w-6xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Values</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    {['Transparency', 'Simplicity', 'Security', 'Innovation', 'User-first design'].map((value, idx) => (
                        <div key={idx} className="px-6 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/20 transition-all">
                            {value}
                        </div>
                    ))}
                </div>
            </section>

            {/* Looking Ahead */}
            <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <div className="text-6xl mb-6">🌟</div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Looking Ahead</h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        RoomMate is continuously improving. We are focused on refining user experience, enhancing performance,
                        and introducing features that make renting in Nepal even easier.
                    </p>
                </div>
            </section>

            {/* CTA - Join Us */}
            <section className="container mx-auto px-4 py-20 max-w-4xl text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Join Us</h2>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Whether you're searching for your next home or listing a property, RoomMate is here to help you connect —
                    <span className="text-primary font-semibold"> simply, safely, and confidently.</span>
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/search"
                        className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center justify-center"
                    >
                        Find Your Room
                    </Link>
                    <Link
                        href="/auth/signup"
                        className="h-12 px-8 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium transition-colors inline-flex items-center justify-center"
                    >
                        List Your Property
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} RoomMate Nepal. All rights reserved.</p>
            </footer>
        </main>
    );
}
