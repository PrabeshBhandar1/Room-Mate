'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

import Navbar from '@/components/Navbar';

export default function ProfilePage() {
    const { user, profile, updateProfile, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setPhone(profile.phone || '');
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [profile]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await updateProfile({
            display_name: displayName,
            phone: phone,
            avatar_url: avatarUrl,
        });

        if (error) {
            toast.error(error.message || 'Failed to update profile');
        } else {
            toast.success('Profile updated successfully!');
        }
        setLoading(false);
    };

    const handleAvatarUpload = async (e) => {
        try {
            setUploading(true);
            const file = e.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload the file to Supabase storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            // Auto-save the avatar URL to the profile
            await updateProfile({ avatar_url: publicUrl });
            toast.success('Avatar updated successfully!');
        } catch (error) {
            toast.error('Error uploading avatar');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
                <p className="text-muted-foreground mb-6">You need to be logged in to manage your profile.</p>
                <Link href="/auth/login" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium">
                    Sign In
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />

            <main className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2">Profile Settings</h1>
                        <p className="text-muted-foreground">Manage your personal information and profile picture</p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                        {/* Avatar Section */}
                        <div className="p-8 border-b border-border bg-muted/30">
                            <div className="flex flex-col items-center sm:flex-row sm:items-center gap-6">
                                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted">
                                    {avatarUrl ? (
                                        <Image
                                            src={avatarUrl}
                                            alt="Avatar"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground">
                                            {displayName?.charAt(0) || user.email?.charAt(0)}
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-xl font-bold text-center sm:text-left">Profile Photo</h3>
                                    <p className="text-sm text-muted-foreground text-center sm:text-left mb-2">
                                        Upload a professional photo to build trust with others.
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                                        >
                                            {uploading ? 'Uploading...' : 'Change Photo'}
                                        </button>
                                        {avatarUrl && (
                                            <button
                                                onClick={() => {
                                                    setAvatarUrl('');
                                                    updateProfile({ avatar_url: null });
                                                }}
                                                className="h-10 px-4 rounded-lg border border-input hover:bg-muted text-sm font-medium transition-all"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Section */}
                        <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/80">Full Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/80">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="e.g., 98XXXXXXXX"
                                        className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-semibold text-foreground/80">Email Address</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full h-11 px-4 rounded-xl border border-input bg-muted text-muted-foreground opacity-70 cursor-not-allowed"
                                />
                                <p className="text-xs text-muted-foreground italic">Email cannot be changed through profile settings.</p>
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-border">
                                <div className="text-sm text-muted-foreground">
                                    Account Role: <span className="font-bold text-primary capitalize">{profile?.role || 'User'}</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    {loading ? 'Saving Changes...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
