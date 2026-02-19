'use client';

import { useState, useEffect } from 'react';
import { withAuth } from '@/lib/withAuth';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

import Navbar from '@/components/Navbar';

function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, profile } = useAuth();
    const listingId = params.id;

    const [listing, setListing] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [owner, setOwner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState(0);

    // Modal state for deletion
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        loading: false
    });

    useEffect(() => {
        if (listingId) {
            fetchListingDetails();
        }
    }, [listingId]);

    const fetchListingDetails = async () => {
        try {
            setLoading(true);

            // Fetch listing
            const { data: listingData, error: listingError } = await supabase
                .from('listings')
                .select('*')
                .eq('id', listingId)
                .eq('status', 'approved')
                .single();

            if (listingError) throw listingError;
            setListing(listingData);

            // Fetch owner info
            if (listingData?.owner_id) {
                const { data: ownerData } = await supabase
                    .rpc('get_user_info', { user_id: listingData.owner_id });

                if (ownerData && ownerData.length > 0) {
                    setOwner(ownerData[0]);
                }
            }

            // Fetch photos
            const { data: photosData, error: photosError } = await supabase
                .from('listing_photos')
                .select('*')
                .eq('listing_id', listingId)
                .order('order_num', { ascending: true });

            if (photosError) throw photosError;

            const photosWithUrls = photosData.map(photo => ({
                ...photo,
                url: supabase.storage.from('listing-photos').getPublicUrl(photo.storage_path).data.publicUrl
            }));

            setPhotos(photosWithUrls);

        } catch (error) {
            toast.error('Failed to load listing details');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = () => {
        setDeleteModal({
            isOpen: true,
            loading: false
        });
    };

    const handleConfirmDelete = async () => {
        if (!listingId) return;

        setDeleteModal(prev => ({ ...prev, loading: true }));

        try {
            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', listingId);

            if (error) throw error;

            toast.success('Listing deleted successfully');
            router.push('/search');
        } catch (error) {
            toast.error('Failed to delete listing');
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading listing...</p>
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl font-bold mb-2">Listing not found</p>
                    <Link href="/search" className="text-primary hover:underline">
                        Back to Search
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    {/* Title and Price */}
                    <div className="mb-6">
                        <h1 className="text-4xl font-bold mb-2">{listing.title}</h1>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <span>📍 {listing.area_name}</span>
                            <span>•</span>
                            <span className="capitalize">{listing.listing_type}</span>
                        </div>
                    </div>

                    {/* Photo Gallery */}
                    {photos.length > 0 && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden mb-8">
                            <div className="relative w-full h-96 bg-muted">
                                <Image
                                    src={photos[selectedPhoto]?.url || '/placeholder.jpg'}
                                    alt={`Photo ${selectedPhoto + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Details */}
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
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-medium">{listing.area_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Address</p>
                                        <p className="font-medium">{listing.address_line || 'N/A'}</p>
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
                                    <div className="mt-6">
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

                            {/* Admin Actions */}
                            {profile?.role === 'admin' && (
                                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                                    <h3 className="font-bold text-red-600 mb-3">Admin Actions</h3>
                                    <button
                                        onClick={handleDeleteClick}
                                        disabled={deleteModal.loading}
                                        className="w-full h-11 px-6 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        Delete Listing Permanent
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Price Card */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="mb-6">
                                    <p className="text-sm text-muted-foreground mb-1">Price</p>
                                    <p className="text-3xl font-bold text-primary">
                                        NPR {listing.price_per_month}
                                        <span className="text-sm text-muted-foreground">/month</span>
                                    </p>
                                </div>

                                {owner && (
                                    <div className="border-t border-border pt-6">
                                        <h3 className="font-bold mb-3">Contact Owner</h3>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Name</p>
                                                <p className="font-medium">{owner.display_name || 'N/A'}</p>
                                            </div>
                                            {owner.phone && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Phone</p>
                                                    <a href={`tel:${owner.phone}`} className="font-medium text-primary hover:underline">
                                                        {owner.phone}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <Link
                                href="/search"
                                className="block w-full h-12 px-6 border border-input rounded-xl font-medium hover:bg-muted transition-colors text-center leading-[3rem]"
                            >
                                ← Back to Search
                            </Link>
                        </div>
                    </div>
                </div>

                <ConfirmationModal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                    onConfirm={handleConfirmDelete}
                    title="Delete Listing Permanently"
                    message="Are you sure you want to delete this listing? This action is permanent and cannot be undone."
                    confirmText="Delete Listing"
                    confirmVariant="danger"
                    isLoading={deleteModal.loading}
                />
            </main>
        </div>
    );
}

export default withAuth(ListingDetailPage);
