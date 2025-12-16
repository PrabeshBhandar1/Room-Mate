'use client';

import { withAuth } from '@/lib/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

function AdminListingDetail() {
    const { user, signOut } = useAuth();
    const params = useParams();
    const router = useRouter();
    const listingId = params.id;

    const [listing, setListing] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState(0);

    // Modal states
    const [approveModal, setApproveModal] = useState({ isOpen: false, loading: false });
    const [rejectModal, setRejectModal] = useState({ isOpen: false, loading: false });
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (listingId) {
            fetchListingDetails();
        }
    }, [listingId]);

    const fetchListingDetails = async () => {
        try {
            setLoading(true);

            // Fetch listing details (without join)
            const { data: listingData, error: listingError } = await supabase
                .from('listings')
                .select('*')
                .eq('id', listingId)
                .single();

            if (listingError) throw listingError;

            // Fetch owner details separately using RPC function
            if (listingData?.owner_id) {
                const { data: ownerData, error: ownerError } = await supabase
                    .rpc('get_user_info', { user_id: listingData.owner_id });

                if (!ownerError && ownerData && ownerData.length > 0) {
                    // Attach owner data to listing
                    listingData.owner = ownerData[0];
                }
            }

            setListing(listingData);

            // Fetch photos
            const { data: photosData, error: photosError } = await supabase
                .from('listing_photos')
                .select('*')
                .eq('listing_id', listingId)
                .order('order_num', { ascending: true });

            if (photosError) throw photosError;

            // Get public URLs for photos
            const photosWithUrls = photosData.map(photo => ({
                ...photo,
                url: supabase.storage.from('listing-photos').getPublicUrl(photo.storage_path).data.publicUrl
            }));

            setPhotos(photosWithUrls);

        } catch (error) {
            console.error('Error fetching listing details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveClick = () => {
        setApproveModal({ isOpen: true, loading: false });
    };

    const handleConfirmApprove = async () => {
        try {
            setApproveModal(prev => ({ ...prev, loading: true }));
            const { error } = await supabase
                .from('listings')
                .update({ status: 'approved' })
                .eq('id', listingId);

            if (error) throw error;

            router.push('/admin/dashboard?success=listing_approved');

        } catch (error) {
            console.error('Error approving listing:', error);
            alert('Failed to approve listing');
            setApproveModal({ isOpen: false, loading: false });
        }
    };

    const handleRejectClick = () => {
        setRejectionReason('');
        setRejectModal({ isOpen: true, loading: false });
    };

    const handleConfirmReject = async () => {
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

            router.push('/admin/dashboard?success=listing_rejected');

        } catch (error) {
            console.error('Error rejecting listing:', error);
            alert('Failed to reject listing');
            setRejectModal({ isOpen: false, loading: false });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading listing details...</p>
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl font-bold mb-2">Listing not found</p>
                    <Link href="/admin/dashboard" className="text-primary hover:underline">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-lg">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
                            R
                        </div>
                        <span className="text-xl font-bold tracking-tight">RoomMate Admin</span>
                    </Link>
                    <button
                        onClick={signOut}
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    {/* Back Button */}
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    >
                        ← Back to Dashboard
                    </Link>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-4xl font-bold">{listing.title}</h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${listing.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            listing.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>
                            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                    </div>

                    {/* Photo Gallery */}
                    {photos.length > 0 && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden mb-8">
                            {/* Main Photo */}
                            <div className="relative w-full h-96 bg-muted">
                                <Image
                                    src={photos[selectedPhoto]?.url || '/placeholder.jpg'}
                                    alt={`Photo ${selectedPhoto + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            {/* Thumbnail Strip */}
                            {photos.length > 1 && (
                                <div className="flex gap-2 p-4 overflow-x-auto">
                                    {photos.map((photo, index) => (
                                        <button
                                            key={photo.id}
                                            onClick={() => setSelectedPhoto(index)}
                                            className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedPhoto === index ? 'border-primary' : 'border-transparent'
                                                }`}
                                        >
                                            <Image
                                                src={photo.url}
                                                alt={`Thumbnail ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Listing Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="md:col-span-2 space-y-6">
                            {/* Description */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h2 className="text-xl font-bold mb-3">Description</h2>
                                <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
                            </div>

                            {/* Property Details */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h2 className="text-xl font-bold mb-4">Property Details</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Type</p>
                                        <p className="font-medium capitalize">{listing.listing_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Price</p>
                                        <p className="font-medium">NPR {listing.price_per_month}/month</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-medium">{listing.area_name}</p>
                                    </div>
                                    {listing.listing_type === 'flat' && (
                                        <>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Bedrooms</p>
                                                <p className="font-medium">{listing.num_bedrooms || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Kitchens</p>
                                                <p className="font-medium">{listing.num_kitchens || 'N/A'}</p>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bathrooms</p>
                                        <p className="font-medium">{listing.num_bathrooms || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Address</p>
                                        <p className="font-medium">{listing.address_line || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Water Availability</p>
                                        <p className="font-medium capitalize">{listing.water_availability?.replace('_', ' ') || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Parking</p>
                                        <p className="font-medium capitalize">{listing.parking?.replace(/_/g, ' ') || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Allowed For</p>
                                        <p className="font-medium capitalize">{listing.allowed_for?.replace(/_/g, ' ') || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Owner Occupied</p>
                                        <p className="font-medium">{listing.is_owner_occupied ? 'Yes' : 'No'}</p>
                                    </div>
                                </div>

                                {/* Amenities */}
                                {listing.amenities && listing.amenities.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm text-muted-foreground mb-2">Amenities</p>
                                        <div className="flex flex-wrap gap-2">
                                            {listing.amenities.map((amenity, index) => (
                                                <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                                    {amenity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Owner Info */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h2 className="text-xl font-bold mb-4">Owner Information</h2>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Name</p>
                                        <p className="font-medium">{listing.owner?.display_name || 'Unknown'}</p>
                                    </div>
                                    {listing.owner?.phone && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Phone</p>
                                            <p className="font-medium">{listing.owner.phone}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {listing.status === 'pending' && (
                                <div className="bg-card border border-border rounded-xl p-6">
                                    <h2 className="text-xl font-bold mb-4">Actions</h2>
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleApproveClick}
                                            disabled={approveModal.loading || rejectModal.loading}
                                            className="w-full h-11 px-6 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            Approve Listing
                                        </button>
                                        <button
                                            onClick={handleRejectClick}
                                            disabled={approveModal.loading || rejectModal.loading}
                                            className="w-full h-11 px-6 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                        >
                                            Reject Listing
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Rejection Reason */}
                            {listing.status === 'rejected' && listing.rejection_reason && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                                    <h2 className="text-lg font-bold text-red-500 mb-2">Rejection Reason</h2>
                                    <p className="text-sm text-red-500">{listing.rejection_reason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Approve Confirmation Modal */}
            <ConfirmationModal
                isOpen={approveModal.isOpen}
                onClose={() => setApproveModal({ isOpen: false, loading: false })}
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
                                onClick={() => setRejectModal({ isOpen: false, loading: false })}
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

export default withAuth(AdminListingDetail, { allowedRoles: ['admin'] });

