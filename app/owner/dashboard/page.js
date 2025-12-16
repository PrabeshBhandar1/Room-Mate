'use client';

import { withAuth } from '@/lib/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

function OwnerDashboard() {
    const { user, profile, signOut } = useAuth();
    const searchParams = useSearchParams();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

    // Modal state
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        listingId: null,
        loading: false
    });

    useEffect(() => {
        fetchListings();
    }, [user]);

    const fetchListings = async () => {
        try {
            if (!user) return;

            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setListings(data || []);

            // Calculate stats
            const total = data?.length || 0;
            const pending = data?.filter(l => l.status === 'pending').length || 0;
            const approved = data?.filter(l => l.status === 'approved').length || 0;
            const rejected = data?.filter(l => l.status === 'rejected').length || 0;

            setStats({ total, pending, approved, rejected });
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (listingId) => {
        setDeleteModal({
            isOpen: true,
            listingId,
            loading: false
        });
    };

    const handleConfirmDelete = async () => {
        const { listingId } = deleteModal;
        if (!listingId) return;

        setDeleteModal(prev => ({ ...prev, loading: true }));

        try {
            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', listingId);

            if (error) throw error;

            // Remove from local state
            setListings(prev => prev.filter(l => l.id !== listingId));

            // Update stats
            const deletedListing = listings.find(l => l.id === listingId);
            if (deletedListing) {
                setStats(prev => ({
                    ...prev,
                    total: prev.total - 1,
                    [deletedListing.status]: prev[deletedListing.status] - 1
                }));
            }

            setDeleteModal({ isOpen: false, listingId: null, loading: false });
        } catch (error) {
            console.error('Error deleting listing:', error);
            alert('Failed to delete listing');
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            approved: 'bg-green-500/10 text-green-500 border-green-500/20',
            rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
            archived: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
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
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground hidden md:inline">
                            {profile?.display_name || 'Owner'}
                        </span>
                        <button
                            onClick={signOut}
                            className="text-sm font-medium hover:text-primary transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Success Message */}
                    {searchParams.get('success') === 'listing_created' && (
                        <div className="bg-green-500/10 text-green-500 border border-green-500/20 p-4 rounded-lg mb-6">
                            ✓ Listing created successfully! It's now pending admin approval.
                        </div>
                    )}

                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Owner Dashboard</h1>
                            <p className="text-muted-foreground">Manage your property listings</p>
                        </div>
                        <Link
                            href="/owner/listing/new"
                            className="h-12 px-6 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 inline-flex items-center justify-center"
                        >
                            + Create New Listing
                        </Link>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Listings</h3>
                            <p className="text-3xl font-bold">{stats.total}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Pending Approval</h3>
                            <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Listings</h3>
                            <p className="text-3xl font-bold text-green-500">{stats.approved}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Rejected</h3>
                            <p className="text-3xl font-bold text-red-500">{stats.rejected}</p>
                        </div>
                    </div>

                    {/* Listings */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-2xl font-bold mb-6">Your Listings</h2>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-muted-foreground">Loading listings...</p>
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground mb-4">You haven't created any listings yet.</p>
                                <Link
                                    href="/owner/listing/new"
                                    className="inline-flex h-10 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all items-center justify-center"
                                >
                                    Create Your First Listing
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {listings.map((listing) => (
                                    <div
                                        key={listing.id}
                                        className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold">{listing.title}</h3>
                                                    {getStatusBadge(listing.status)}
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                    {listing.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="text-primary font-bold">NPR {listing.price_per_month}/month</span>
                                                    <span className="text-muted-foreground">• {listing.area_name}</span>
                                                    <span className="text-muted-foreground">• {listing.listing_type}</span>
                                                </div>
                                                {listing.status === 'rejected' && listing.rejection_reason && (
                                                    <div className="mt-2 text-sm text-red-500">
                                                        Reason: {listing.rejection_reason}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                {listing.status !== 'rejected' && (
                                                    <Link
                                                        href={`/owner/listing/${listing.id}/edit`}
                                                        className="h-9 px-4 text-sm border border-input rounded-lg hover:bg-muted transition-colors flex items-center"
                                                    >
                                                        Edit
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteClick(listing.id)}
                                                    className="h-9 px-4 text-sm text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title="Delete Listing"
                message="Are you sure you want to delete this listing? This action cannot be undone and will remove all associated photos and data."
                confirmText="Delete Listing"
                isLoading={deleteModal.loading}
            />
        </div>
    );
}

export default withAuth(OwnerDashboard, { allowedRoles: ['owner'] });
