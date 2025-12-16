'use client';

import { withAuth } from '@/lib/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

function AdminDashboard() {
    const { user, profile, signOut } = useAuth();
    const [stats, setStats] = useState({
        totalListings: 0,
        pendingListings: 0,
        totalUsers: 0,
        activeOwners: 0
    });
    const [pendingListings, setPendingListings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [approveModal, setApproveModal] = useState({ isOpen: false, loading: false, listingId: null });
    const [rejectModal, setRejectModal] = useState({ isOpen: false, loading: false, listingId: null });
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch Stats
            const [
                { count: totalListings },
                { count: pendingCount },
                { count: totalUsers },
                { count: activeOwners }
            ] = await Promise.all([
                supabase.from('listings').select('*', { count: 'exact', head: true }),
                supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'owner')
            ]);

            setStats({
                totalListings: totalListings || 0,
                pendingListings: pendingCount || 0,
                totalUsers: totalUsers || 0,
                activeOwners: activeOwners || 0
            });

            // Fetch Pending Listings (without join)
            const { data: pendingData, error: pendingError } = await supabase
                .from('listings')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (pendingError) throw pendingError;

            // Fetch owner details for each listing separately
            if (pendingData && pendingData.length > 0) {
                const listingsWithOwners = await Promise.all(
                    pendingData.map(async (listing) => {
                        if (listing.owner_id) {
                            const { data: ownerData } = await supabase
                                .rpc('get_user_info', { user_id: listing.owner_id });

                            return {
                                ...listing,
                                owner: ownerData && ownerData.length > 0 ? ownerData[0] : null
                            };
                        }
                        return listing;
                    })
                );
                setPendingListings(listingsWithOwners);
            } else {
                setPendingListings([]);
            }

        } catch (error) {
            console.error('Error fetching admin dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleApproveClick = (listingId) => {
        setApproveModal({ isOpen: true, loading: false, listingId });
    };

    const handleConfirmApprove = async () => {
        const { listingId } = approveModal;
        if (!listingId) return;

        try {
            setApproveModal(prev => ({ ...prev, loading: true }));
            const { error } = await supabase
                .from('listings')
                .update({ status: 'approved' })
                .eq('id', listingId);

            if (error) throw error;

            // Update UI
            setPendingListings(prev => prev.filter(l => l.id !== listingId));
            setStats(prev => ({
                ...prev,
                pendingListings: prev.pendingListings - 1
            }));

            setApproveModal({ isOpen: false, loading: false, listingId: null });

        } catch (error) {
            console.error('Error approving listing:', error);
            alert('Failed to approve listing');
            setApproveModal({ isOpen: false, loading: false, listingId: null });
        }
    };

    const handleRejectClick = (listingId) => {
        setRejectionReason('');
        setRejectModal({ isOpen: true, loading: false, listingId });
    };

    const handleConfirmReject = async () => {
        const { listingId } = rejectModal;
        if (!listingId) return;

        try {
            setRejectModal(prev => ({ ...prev, loading: true }));
            const { error } = await supabase
                .from('listings')
                .update({
                    status: 'rejected',
                    rejection_reason: rejectionReason || null
                })
                .eq('id', listingId);

            if (error) throw error;

            // Update UI
            setPendingListings(prev => prev.filter(l => l.id !== listingId));
            setStats(prev => ({
                ...prev,
                pendingListings: prev.pendingListings - 1
            }));

            setRejectModal({ isOpen: false, loading: false, listingId: null });

        } catch (error) {
            console.error('Error rejecting listing:', error);
            alert('Failed to reject listing');
            setRejectModal({ isOpen: false, loading: false, listingId: null });
        }
    };


    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-lg">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
                            R
                        </div>
                        <span className="text-xl font-bold tracking-tight">RoomMate Admin</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            Welcome, {profile?.display_name || 'Admin'}
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
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Manage listings, users, and platform settings</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Listings</h3>
                            <p className="text-3xl font-bold">{stats.totalListings}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Pending Review</h3>
                            <p className="text-3xl font-bold text-yellow-500">{stats.pendingListings}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Users</h3>
                            <p className="text-3xl font-bold">{stats.totalUsers}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Owners</h3>
                            <p className="text-3xl font-bold text-green-500">{stats.activeOwners}</p>
                        </div>
                    </div>

                    {/* Pending Listings Section */}
                    <div className="bg-card border border-border rounded-xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Pending Listings</h2>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-muted-foreground">Loading dashboard data...</p>
                            </div>
                        ) : pendingListings.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                No pending listings at the moment. New submissions will appear here for review.
                            </p>
                        ) : (
                            <div className="space-y-6">
                                {pendingListings.map((listing) => (
                                    <div
                                        key={listing.id}
                                        className="border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Listing Image (if any) */}
                                            {/* We could fetch photos here, but for now let's just show details */}

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-xl font-bold">{listing.title}</h3>
                                                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-xs font-medium">
                                                        Pending
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Price:</span>
                                                        <span className="font-medium ml-2">NPR {listing.price_per_month}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Location:</span>
                                                        <span className="font-medium ml-2">{listing.area_name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Type:</span>
                                                        <span className="font-medium ml-2">{listing.listing_type}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Owner:</span>
                                                        <span className="font-medium ml-2">
                                                            {listing.owner?.display_name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                                                    {listing.description}
                                                </p>

                                                <div className="flex items-center gap-3">
                                                    <Link
                                                        href={`/admin/listing/${listing.id}`}
                                                        className="h-10 px-6 border border-input rounded-lg hover:bg-muted transition-colors flex items-center justify-center font-medium"
                                                    >
                                                        View Details
                                                    </Link>
                                                    <button
                                                        onClick={() => handleApproveClick(listing.id)}
                                                        disabled={approveModal.loading || rejectModal.loading}
                                                        className="h-10 px-6 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectClick(listing.id)}
                                                        disabled={approveModal.loading || rejectModal.loading}
                                                        className="h-10 px-6 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Approve Confirmation Modal */}
            <ConfirmationModal
                isOpen={approveModal.isOpen}
                onClose={() => setApproveModal({ isOpen: false, loading: false, listingId: null })}
                onConfirm={handleConfirmApprove}
                title="Approve Listing"
                message="Are you sure you want to approve this listing? It will become visible to the public."
                confirmText="Approve"
                isLoading={approveModal.loading}
            />

            {/* Reject Modal with Reason Input */}
            {rejectModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold mb-2">Reject Listing</h2>
                        <p className="text-muted-foreground mb-6">
                            Please provide a reason for rejecting this listing (optional).
                        </p>

                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., Incomplete information, poor quality photos..."
                            className="w-full h-32 px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none mb-6"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setRejectModal({ isOpen: false, loading: false, listingId: null })}
                                disabled={rejectModal.loading}
                                className="flex-1 h-11 px-6 border border-input rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReject}
                                disabled={rejectModal.loading}
                                className="flex-1 h-11 px-6 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {rejectModal.loading ? 'Rejecting...' : 'Reject Listing'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default withAuth(AdminDashboard, { allowedRoles: ['admin'] });
