'use client';

import { withAuth } from '@/lib/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';

function OwnerVerifyContent() {
    const { user, profile } = useAuth();

    const [existingRequest, setExistingRequest] = useState(null);
    const [loadingRequest, setLoadingRequest] = useState(true);

    // Form state
    const [fullName, setFullName] = useState('');
    const [documentType, setDocumentType] = useState('citizenship');
    const [documentFile, setDocumentFile] = useState(null);
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filePreview, setFilePreview] = useState(null);

    useEffect(() => {
        if (user) {
            fetchExistingRequest();
            // Pre-fill name from profile
            setFullName(profile?.display_name || '');
        }
    }, [user, profile]);

    const fetchExistingRequest = async () => {
        try {
            const { data, error } = await supabase
                .from('owner_verifications')
                .select('*')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (error) throw error;
            setExistingRequest(data);
        } catch (err) {
            // No existing request is fine
        } finally {
            setLoadingRequest(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 10 MB.');
            return;
        }
        setDocumentFile(file);
        setFilePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!documentFile) {
            toast.error('Please upload your identity document.');
            return;
        }
        setSubmitting(true);

        try {
            // 1. Upload document to Supabase Storage
            const fileExt = documentFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('verification-docs')
                .upload(fileName, documentFile);

            if (uploadError) throw uploadError;

            // 2. Insert verification request
            const { error: insertError } = await supabase
                .from('owner_verifications')
                .insert([{
                    owner_id: user.id,
                    full_name: fullName.trim(),
                    document_type: documentType,
                    document_url: fileName,
                    note: note.trim() || null,
                }]);

            if (insertError) throw insertError;

            toast.success('Verification request submitted! Admin will review it shortly.');
            await fetchExistingRequest();
        } catch (err) {
            toast.error(err.message || 'Failed to submit verification request.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingRequest) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center min-h-[80vh]">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    // If owner is already verified (shouldn't normally reach this page, but just in case)
    if (profile?.is_verified) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 py-16">
                    <div className="max-w-md mx-auto text-center">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold mb-3">You're Verified!</h1>
                        <p className="text-muted-foreground mb-8">Your account has been verified. You have full access to all owner features.</p>
                        <Link href="/owner/dashboard" className="inline-flex h-11 px-6 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all items-center justify-center">
                            Go to Dashboard
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    // If a request already exists, show its status
    if (existingRequest) {
        const statusConfig = {
            pending: {
                color: 'text-yellow-500',
                bg: 'bg-yellow-500/10',
                border: 'border-yellow-500/20',
                icon: (
                    <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                title: 'Request Under Review',
                message: 'Your verification request has been submitted. The admin will review your documents and respond shortly.',
            },
            approved: {
                color: 'text-green-500',
                bg: 'bg-green-500/10',
                border: 'border-green-500/20',
                icon: (
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                title: 'Verification Approved!',
                message: 'Your account has been verified. You can now create and manage listings.',
            },
            rejected: {
                color: 'text-red-500',
                bg: 'bg-red-500/10',
                border: 'border-red-500/20',
                icon: (
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                title: 'Verification Rejected',
                message: existingRequest.rejection_reason
                    ? `Your request was rejected. Reason: ${existingRequest.rejection_reason}`
                    : 'Your verification request was rejected. Please contact support or resubmit with a valid document.',
            },
        };

        const cfg = statusConfig[existingRequest.status];

        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 py-16">
                    <div className="max-w-md mx-auto">
                        <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-8 text-center`}>
                            <div className={`w-20 h-20 ${cfg.bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                                {cfg.icon}
                            </div>
                            <h1 className={`text-2xl font-bold mb-3 ${cfg.color}`}>{cfg.title}</h1>
                            <p className="text-muted-foreground mb-2">{cfg.message}</p>
                            <p className="text-xs text-muted-foreground mt-4">
                                Submitted: {new Date(existingRequest.submitted_at).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="mt-6 flex gap-4">
                            <Link href="/owner/dashboard" className="flex-1 h-11 border border-input rounded-xl flex items-center justify-center font-medium hover:bg-muted transition-colors text-sm">
                                ← Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // New verification request form
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-xl mx-auto">
                    <div className="mb-8">
                        <Link href="/owner/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-4">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold mb-2">Owner Verification</h1>
                        <p className="text-muted-foreground">
                            Submit your identity document for admin review. Once verified, you'll be able to create and manage listings.
                        </p>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8 flex gap-3">
                        <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-muted-foreground">
                            Your document will be reviewed only by administrators and kept private. Accepted documents: Citizenship Certificate, Passport, or Driving License.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-card border border-border rounded-xl p-6 space-y-5">

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Full Name (as on document) *</label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="e.g. Ram Prasad Sharma"
                                    className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>

                            {/* Document Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Document Type *</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'citizenship', label: '🪪 Citizenship' },
                                        { value: 'passport', label: '📘 Passport' },
                                        { value: 'license', label: '🚗 License' },
                                    ].map(({ value, label }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setDocumentType(value)}
                                            className={`h-12 rounded-lg border font-medium text-sm transition-all ${documentType === value
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-input hover:border-primary/50 hover:bg-muted'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Document Upload */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Document Photo / Scan *</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="doc-upload"
                                />
                                <label
                                    htmlFor="doc-upload"
                                    className="block w-full border-2 border-dashed border-input rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                >
                                    {filePreview ? (
                                        <img src={filePreview} alt="Document preview" className="max-h-48 object-contain rounded-lg" />
                                    ) : (
                                        <>
                                            <svg className="w-12 h-12 text-muted-foreground mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-sm text-muted-foreground">Click to upload image or PDF</p>
                                            <p className="text-xs text-muted-foreground mt-1">Max file size: 10 MB</p>
                                        </>
                                    )}
                                </label>
                                {documentFile && (
                                    <p className="text-xs text-muted-foreground mt-2">Selected: {documentFile.name}</p>
                                )}
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Note to Admin <span className="text-muted-foreground font-normal">(optional)</span></label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="Any additional information for the admin..."
                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit Verification Request'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default withAuth(OwnerVerifyContent, { allowedRoles: ['owner'] });
