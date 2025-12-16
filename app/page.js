'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentListings();
  }, []);

  const fetchRecentListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setRecentListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <Image src="/images/RoomMate1.png" alt="Logo" width={70} height={70} />
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/search" className="hover:text-primary transition-colors">Search</Link>
            {user && (
              <Link href="/messages" className="hover:text-primary transition-colors">Messages</Link>
            )}
            {user && profile?.role === 'owner' && (
              <Link href="/owner/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            )}
            {user && profile?.role === 'admin' && (
              <Link href="/admin/dashboard" className="hover:text-primary transition-colors">Admin</Link>
            )}
            <Link href="#" className="hover:text-primary transition-colors">About</Link>
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
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-3xl space-y-6">
          {/* Role-specific badge */}
          {user && profile && (
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
              <span>
                {profile.role === 'owner' && '🏠 Welcome back, Property Owner!'}
                {profile.role === 'admin' && '⚡ Admin Dashboard Access'}
                {profile.role === 'tenant' && '🔍 Find Your Perfect Room'}
              </span>
            </div>
          )}

          {!user && (
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
              <span>🇳🇵 #1 Room Rental Platform in Nepal</span>
            </div>
          )}

          {/* Role-specific heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
            {user && profile?.role === 'owner' ? (
              <>Manage your <span className="text-primary">properties</span> with ease.</>
            ) : user && profile?.role === 'admin' ? (
              <>Platform <span className="text-primary">administration</span> & <span className="text-secondary">control</span>.</>
            ) : (
              <>Find your perfect <span className="text-primary">room</span> & <span className="text-secondary">space</span>.</>
            )}
          </h1>

          {/* Role-specific description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            {user && profile?.role === 'owner' ? (
              'List your properties, manage bookings, and connect with verified tenants across Kathmandu Valley.'
            ) : user && profile?.role === 'admin' ? (
              'Manage listings, moderate content, and oversee platform operations.'
            ) : (
              'Discover verified rooms, flats, and roommates in Kathmandu, Lalitpur, and Bhaktapur. Simple, secure, and hassle-free.'
            )}
          </p>

          {/* Search Bar - Only for non-owners/admins */}
          {(!user || profile?.role === 'tenant') && (
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by area, price, or type..."
                  className="flex-1 h-14 px-6 rounded-xl border border-input bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="submit"
                  className="h-14 px-8 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-xl shadow-primary/25"
                >
                  Search
                </button>
              </div>
            </form>
          )}

          {/* Role-specific CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {user && profile?.role === 'owner' ? (
              <>
                <Link
                  href="/owner/dashboard"
                  className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center justify-center"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/owner/listing/new"
                  className="h-12 px-8 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium transition-colors inline-flex items-center justify-center"
                >
                  + Create New Listing
                </Link>
              </>
            ) : user && profile?.role === 'admin' ? (
              <>
                <Link
                  href="/admin/dashboard"
                  className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center justify-center"
                >
                  Admin Dashboard
                </Link>
                <Link
                  href="/search"
                  className="h-12 px-8 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium transition-colors inline-flex items-center justify-center"
                >
                  View Listings
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/search"
                  className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center justify-center"
                >
                  Browse Listings
                </Link>
                {!user && (
                  <Link
                    href="/auth/signup"
                    className="h-12 px-8 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium transition-colors inline-flex items-center justify-center"
                  >
                    List Your Property
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats / Trust */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 text-center">
          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-foreground">1k+</h3>
            <p className="text-sm text-muted-foreground">Active Listings</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-foreground">500+</h3>
            <p className="text-sm text-muted-foreground">Happy Tenants</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-foreground">100%</h3>
            <p className="text-sm text-muted-foreground">Verified Owners</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-foreground">24/7</h3>
            <p className="text-sm text-muted-foreground">Support</p>
          </div>
        </div>
      </section>

      {/* Recent Listings Section */}
      {recentListings.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Recent Listings</h2>
            <p className="text-muted-foreground">Discover the latest approved properties</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="h-48 bg-muted flex items-center justify-center text-muted-foreground">
                  📷 Photo
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{listing.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      NPR {listing.price_per_month}
                      <span className="text-sm text-muted-foreground">/month</span>
                    </span>
                    <span className="text-sm text-muted-foreground capitalize">
                      {listing.area_name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/search"
              className="inline-flex h-12 px-8 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium transition-colors items-center justify-center"
            >
              View All Listings →
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} RoomMate Nepal. All rights reserved.</p>
      </footer>
    </main>
  );
}
