'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Get initial session
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted) {
                    if (session?.user) {
                        setUser(session.user);
                        // Only fetch profile if we have a user
                        await fetchProfile(session.user.id);
                    }
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            // Update user state
            setUser(session?.user ?? null);

            if (session?.user) {
                // If we just signed in or switched users, fetch profile
                // We can optimize this by checking if profile.id matches session.user.id
                // But for now, let's just ensure we fetch it.
                // Note: We don't await this here to avoid blocking the UI updates if not strictly necessary,
                // but for role-based auth we might need it. 
                // However, since initializeAuth runs first, this is mostly for subsequent events.
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    await fetchProfile(session.user.id);
                }
            } else if (event === 'SIGNED_OUT') {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        }
    };

    const signUp = async (email, password, role, displayName, phone) => {
        try {
            // 1. Sign up with Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            if (data?.user) {
                // 2. Create user profile using RPC function (bypasses RLS)
                const { data: profileData, error: profileError } = await supabase
                    .rpc('create_user_profile', {
                        user_id: data.user.id,
                        user_role: role,
                        user_display_name: displayName,
                        user_phone: phone,
                    });

                if (profileError) {
                    console.error('Error creating user profile:', profileError);
                    throw profileError;
                }

                console.log('Profile created successfully:', profileData);
            }
            return { data, error: null };
        } catch (error) {
            console.error('Signup error:', error);
            return { data: null, error };
        }
    };

    const signIn = async (email, password) => {
        const result = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        // Fetch profile after successful login
        if (result.data?.user) {
            await fetchProfile(result.data.user.id);
        }

        return result;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            router.push('/auth/login');
        }
        return { error };
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
