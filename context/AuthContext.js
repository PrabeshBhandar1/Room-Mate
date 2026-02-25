'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        user: null,
        profile: null,
        loading: true
    });
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        // Listen for auth changes - this also handles the initial session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            console.log(`AuthContext [${event}]: user=${session?.user?.id}`);

            const currentUser = session?.user ?? null;

            if (currentUser) {
                // Fetch profile for any event that might have changed the session
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();

                setAuthState({
                    user: currentUser,
                    profile: profile || null,
                    loading: false
                });
            } else {
                setAuthState({
                    user: null,
                    profile: null,
                    loading: false
                });
            }
            console.log(`AuthContext [${event}]: state updated, loading=false`);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Listen for profile changes in real-time
    useEffect(() => {
        if (!authState.user) return;

        const profileSubscription = supabase
            .channel(`public:users:id=eq.${authState.user.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'users',
                filter: `id=eq.${authState.user.id}`
            }, (payload) => {
                setAuthState(prev => ({ ...prev, profile: payload.new }));
            })
            .subscribe();

        return () => {
            profileSubscription.unsubscribe();
        };
    }, [authState.user?.id]);

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
                setAuthState(prev => ({ ...prev, profile: data }));
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        }
    };

    const signUp = async (email, password, role, displayName, phone) => {
        try {
            // 1. Sign up with Supabase Auth including metadata
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/confirm`,
                    data: {
                        display_name: displayName,
                        role: role,
                        phone: phone
                    }
                }
            });

            if (error) {
                if (
                    error.message?.toLowerCase().includes('user already registered') ||
                    error.message?.toLowerCase().includes('already been registered')
                ) {
                    return { data: null, error: { message: 'An account with this email already exists.' } };
                }
                throw error;
            }

            if (
                data?.user &&
                Array.isArray(data.user.identities) &&
                data.user.identities.length === 0
            ) {
                return { data: null, error: { message: 'An account with this email already exists.' } };
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

        // Profile will be auto-fetched by the onAuthStateChange listener
        return result;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            router.push('/auth/login');
        }
        return { error };
    };

    const updateProfile = async (updates) => {
        try {
            if (!authState.user) throw new Error('No user logged in');

            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', authState.user.id)
                .select()
                .single();

            if (error) throw error;
            setAuthState(prev => ({ ...prev, profile: data }));
            return { data, error: null };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { data: null, error };
        }
    };

    return (
        <AuthContext.Provider value={{
            user: authState.user,
            profile: authState.profile,
            loading: authState.loading,
            signUp,
            signIn,
            signOut,
            updateProfile,
            refreshProfile: fetchProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
