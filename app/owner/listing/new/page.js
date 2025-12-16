'use client';

import { withAuth } from '@/lib/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function NewListing() {
    const { user, profile } = useAuth();
    const router = useRouter();

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price_per_month: '',
        address_line: '',
        area_name: '',
        listing_type: 'room',
        water_availability: 'continuous',
        parking: 'none',
        allowed_for: 'any',
        is_owner_occupied: false,
        amenities: [],
        // Flat-specific fields
        num_bedrooms: 1,
        num_kitchens: 1,
        num_bathrooms: 1,
    });

    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const areas = [
        'Baneshwor', 'Koteshwor', 'Maitidevi', 'Putalisadak', 'Lalitpur',
        'Bhaktapur', 'Thamel', 'Lazimpat', 'Boudha', 'Kalanki',
        'Balaju', 'Chabahil', 'Jorpati', 'Maharajgunj', 'New Baneshwor',
        'Patan', 'Pulchowk', 'Sanepa', 'Satdobato', 'Swayambhu'
    ];

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + photos.length > 8) {
            setError('Maximum 8 photos allowed');
            return;
        }
        setPhotos(prev => [...prev, ...files]);
        setError(null);
    };

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const toggleAmenity = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setUploading(true);

        try {
            // Validate photos
            if (photos.length === 0) {
                throw new Error('Please upload at least 1 photo');
            }

            // 1. Create listing
            const { data: listing, error: listingError } = await supabase
                .from('listings')
                .insert([{
                    owner_id: user.id,
                    ...formData,
                    price_per_month: parseFloat(formData.price_per_month),
                }])
                .select()
                .single();

            if (listingError) throw listingError;

            // 2. Upload photos
            const photoPromises = photos.map(async (photo, index) => {
                const fileExt = photo.name.split('.').pop();
                const fileName = `${listing.id}/${Date.now()}_${index}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('listing-photos')
                    .upload(fileName, photo);

                if (uploadError) throw uploadError;

                // 3. Create photo record
                const { error: photoError } = await supabase
                    .from('listing_photos')
                    .insert([{
                        listing_id: listing.id,
                        storage_path: fileName,
                        order_num: index
                    }]);

                if (photoError) throw photoError;
            });

            await Promise.all(photoPromises);

            // Success! Redirect to dashboard
            router.push('/owner/dashboard?success=listing_created');
        } catch (err) {
            console.error('Error creating listing:', err);
            setError(err.message || 'Failed to create listing');
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-lg">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/owner/dashboard" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
                            R
                        </div>
                        <span className="text-xl font-bold tracking-tight">RoomMate</span>
                    </Link>
                    <Link href="/owner/dashboard" className="text-sm text-muted-foreground hover:text-primary">
                        ← Back to Dashboard
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2">Create New Listing</h1>
                        <p className="text-muted-foreground">Fill in the details about your property</p>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Information */}
                        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                            <h2 className="text-xl font-bold">Basic Information</h2>

                            <div>
                                <label className="block text-sm font-medium mb-2">Listing Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Spacious Room in Baneshwor"
                                    className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description *</label>
                                <textarea
                                    name="description"
                                    required
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    placeholder="Describe your property, amenities, nearby facilities..."
                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Listing Type *</label>
                                    <select
                                        name="listing_type"
                                        value={formData.listing_type}
                                        onChange={handleInputChange}
                                        className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    >
                                        <option value="room">Room</option>
                                        <option value="flat">Full Flat</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Price per Month (NPR) *</label>
                                    <input
                                        type="number"
                                        name="price_per_month"
                                        required
                                        min="0"
                                        value={formData.price_per_month}
                                        onChange={handleInputChange}
                                        placeholder="10000"
                                        className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            {/* Conditional: Flat-specific fields */}
                            {formData.listing_type === 'flat' && (
                                <div className="border-t border-border pt-4 mt-2">
                                    <h3 className="text-sm font-medium mb-3 text-muted-foreground">Flat Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Number of Bedrooms *</label>
                                            <input
                                                type="number"
                                                name="num_bedrooms"
                                                required={formData.listing_type === 'flat'}
                                                min="1"
                                                max="10"
                                                value={formData.num_bedrooms}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Number of Kitchens *</label>
                                            <input
                                                type="number"
                                                name="num_kitchens"
                                                required={formData.listing_type === 'flat'}
                                                min="1"
                                                max="5"
                                                value={formData.num_kitchens}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Number of Bathrooms *</label>
                                            <input
                                                type="number"
                                                name="num_bathrooms"
                                                required={formData.listing_type === 'flat'}
                                                min="1"
                                                max="10"
                                                value={formData.num_bathrooms}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Location */}
                        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                            <h2 className="text-xl font-bold">Location</h2>

                            <div>
                                <label className="block text-sm font-medium mb-2">Address *</label>
                                <input
                                    type="text"
                                    name="address_line"
                                    required
                                    value={formData.address_line}
                                    onChange={handleInputChange}
                                    placeholder="Street address, landmark"
                                    className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Area *</label>
                                <select
                                    name="area_name"
                                    required
                                    value={formData.area_name}
                                    onChange={handleInputChange}
                                    className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                >
                                    <option value="">Select area</option>
                                    {areas.map(area => (
                                        <option key={area} value={area}>{area}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                            <h2 className="text-xl font-bold">Amenities & Features</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Water Availability *</label>
                                    <select
                                        name="water_availability"
                                        value={formData.water_availability}
                                        onChange={handleInputChange}
                                        className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    >
                                        <option value="continuous">24/7 Continuous</option>
                                        <option value="timed">Timed</option>
                                        <option value="no">No Water</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Parking *</label>
                                    <select
                                        name="parking"
                                        value={formData.parking}
                                        onChange={handleInputChange}
                                        className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    >
                                        <option value="none">No Parking</option>
                                        <option value="bike_only">Bike Only</option>
                                        <option value="car_only">Car Only</option>
                                        <option value="bike_and_car">Bike & Car</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Allowed For *</label>
                                <select
                                    name="allowed_for"
                                    value={formData.allowed_for}
                                    onChange={handleInputChange}
                                    className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                >
                                    <option value="any">Anyone</option>
                                    <option value="students">Students Only</option>
                                    <option value="girls_only">Girls Only</option>
                                    <option value="boys_only">Boys Only</option>
                                    <option value="couples">Couples</option>
                                </select>
                            </div>

                            {/* Multi-select Amenities */}
                            <div>
                                <label className="block text-sm font-medium mb-3">Additional Amenities</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { value: 'wifi', label: 'WiFi', icon: '📶' },
                                        { value: 'garden', label: 'Garden', icon: '🌳' },
                                        { value: 'heating', label: 'Heating', icon: '🔥' },
                                        { value: 'air_conditioning', label: 'Air Conditioning', icon: '❄️' },
                                        { value: 'security', label: 'Security', icon: '🔒' },
                                        { value: 'kitchen', label: 'Kitchen', icon: '🍳' },
                                    ].map(({ value, label, icon }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => toggleAmenity(value)}
                                            className={`h-12 rounded-lg border font-medium transition-all flex items-center justify-center gap-2 ${formData.amenities.includes(value)
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-input hover:border-primary/50 hover:bg-muted'
                                                }`}
                                        >
                                            <span>{icon}</span>
                                            <span className="text-sm">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_owner_occupied"
                                    name="is_owner_occupied"
                                    checked={formData.is_owner_occupied}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 rounded border-input"
                                />
                                <label htmlFor="is_owner_occupied" className="text-sm font-medium">
                                    Owner occupied (I live in this property)
                                </label>
                            </div>
                        </div>

                        {/* Photos */}
                        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                            <h2 className="text-xl font-bold">Photos</h2>
                            <p className="text-sm text-muted-foreground">Upload 1-8 photos of your property</p>

                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                    id="photo-upload"
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className="block w-full h-32 border-2 border-dashed border-input rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                >
                                    <div className="text-center">
                                        <svg className="w-12 h-12 mx-auto text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <p className="text-sm text-muted-foreground">Click to upload photos</p>
                                        <p className="text-xs text-muted-foreground mt-1">{photos.length}/8 photos selected</p>
                                    </div>
                                </label>
                            </div>

                            {photos.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {photos.map((photo, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={URL.createObjectURL(photo)}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="absolute top-1 right-1 bg-destructive text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex gap-4">
                            <Link
                                href="/owner/dashboard"
                                className="flex-1 h-12 border border-input rounded-xl flex items-center justify-center font-medium hover:bg-muted transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="flex-1 h-12 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Creating Listing...' : 'Create Listing'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default withAuth(NewListing, { allowedRoles: ['owner'] });

