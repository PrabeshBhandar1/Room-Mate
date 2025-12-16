'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';


function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [selectedArea, setSelectedArea] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [resetKey, setResetKey] = useState(0);

    const areas = [
        'Baneshwor', 'Koteshwor', 'Maitidevi', 'Putalisadak', 'Lalitpur',
        'Bhaktapur', 'Thamel', 'Lazimpat', 'Boudha', 'Kalanki',
        'Balaju', 'Chabahil', 'Jorpati', 'Maharajgunj', 'New Baneshwor',
        'Patan', 'Pulchowk', 'Sanepa', 'Satdobato', 'Swayambhu'
    ];

    useEffect(() => {
        fetchListings();
    }, [selectedArea, minPrice, maxPrice, sortBy, resetKey]);

    const fetchListings = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('listings')
                .select('*, listing_photos(*)')
                .eq('status', 'approved');

            // Apply filters
            if (selectedArea) {
                query = query.eq('area_name', selectedArea);
            }
            if (minPrice) {
                query = query.gte('price_per_month', parseFloat(minPrice));
            }
            if (maxPrice) {
                query = query.lte('price_per_month', parseFloat(maxPrice));
            }

            // Apply sorting
            if (sortBy === 'price_low') {
                query = query.order('price_per_month', { ascending: true });
            } else if (sortBy === 'price_high') {
                query = query.order('price_per_month', { ascending: false });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            const { data, error } = await query;

            if (error) throw error;

            // Process photos and create public URLs
            const listingsWithPhotos = data.map(listing => {
                let photoUrl = null;
                if (listing.listing_photos && listing.listing_photos.length > 0) {
                    // Sort by order_num to get the main photo
                    const sortedPhotos = listing.listing_photos.sort((a, b) => a.order_num - b.order_num);
                    photoUrl = supabase.storage.from('listing-photos').getPublicUrl(sortedPhotos[0].storage_path).data.publicUrl;
                }
                return { ...listing, photoUrl };
            });

            // Client-side search filter for query text
            let filteredData = listingsWithPhotos || [];
            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                filteredData = filteredData.filter(listing =>
                    listing.title?.toLowerCase().includes(lowerQuery) ||
                    listing.description?.toLowerCase().includes(lowerQuery) ||
                    listing.area_name?.toLowerCase().includes(lowerQuery) ||
                    listing.address_line?.toLowerCase().includes(lowerQuery)
                );
            }

            setListings(filteredData);
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchListings();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedArea('');
        setMinPrice('');
        setMaxPrice('');
        setSortBy('newest');
        setResetKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-lg">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
                            R
                        </div>
                        <span className="text-xl font-bold tracking-tight">RoomMate</span>
                    </Link>
                    <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                        ← Back to Home
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Search Listings</h1>
                    <p className="text-muted-foreground">Find your perfect room or flat in Kathmandu Valley</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">Filters</h2>
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Clear All
                                </button>
                            </div>

                            {/* Search Input */}
                            <form onSubmit={handleSearch} className="mb-6">
                                <label className="block text-sm font-medium mb-2">Search</label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Keywords..."
                                    className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                <button
                                    type="submit"
                                    className="w-full mt-2 h-10 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                                >
                                    Search
                                </button>
                            </form>

                            {/* Area Filter */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Area</label>
                                <select
                                    value={selectedArea}
                                    onChange={(e) => setSelectedArea(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                >
                                    <option value="">All Areas</option>
                                    {areas.map(area => (
                                        <option key={area} value={area}>{area}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Price Range (NPR)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        placeholder="Min"
                                        className="h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                    <input
                                        type="number"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        placeholder="Max"
                                        className="h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="price_low">Price: Low to High</option>
                                    <option value="price_high">Price: High to Low</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="lg:col-span-3">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-muted-foreground">
                                {loading ? 'Loading...' : `${listings.length} listings found`}
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-xl font-bold mb-2">No listings found</p>
                                <p className="text-muted-foreground mb-6">Try adjusting your filters</p>
                                <button
                                    onClick={clearFilters}
                                    className="h-10 px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {listings.map((listing) => (
                                    <Link
                                        key={listing.id}
                                        href={`/listing/${listing.id}`}
                                        className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
                                    >
                                        <div className="h-48 bg-muted relative">
                                            {listing.photoUrl ? (
                                                <img
                                                    src={listing.photoUrl}
                                                    alt={listing.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    📷 Photo
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-xl font-bold">{listing.title}</h3>
                                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full capitalize">
                                                    {listing.listing_type}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                                {listing.description}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-2xl font-bold text-primary">
                                                    NPR {listing.price_per_month}
                                                    <span className="text-sm text-muted-foreground">/month</span>
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    📍 {listing.area_name}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading search...</div>}>
            <SearchPageContent />
        </Suspense>
    );
}
