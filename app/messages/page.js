'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getConversations, getMessages, sendMessage, markMessagesAsRead, subscribeToMessages } from '@/lib/messageService';

function MessagesPageContent() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const messagesEndRef = useRef(null);

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const hasInitialized = useRef(false);

    // Get initial conversation from URL params
    const initialListingId = searchParams.get('listing');
    const initialOtherId = searchParams.get('with');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = useCallback(async () => {
        try {
            setLoading(true);
            const convs = await getConversations(user.id);
            setConversations(convs);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const loadMessages = useCallback(async (conversation) => {
        try {
            const msgs = await getMessages(
                conversation.listingId,
                conversation.otherUserId,
                user.id
            );
            setMessages(msgs);

            // Mark messages as read
            await markMessagesAsRead(
                conversation.listingId,
                conversation.otherUserId,
                user.id
            );
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }, [user?.id]);

    const initializeNewConversation = useCallback(async (listingId, ownerId) => {
        try {
            // Fetch listing details
            const { data: listingData, error: listingError } = await supabase
                .from('listings')
                .select('id, title')
                .eq('id', listingId)
                .single();

            if (listingError) {
                console.error('Error fetching listing:', listingError);
                return;
            }

            // Fetch owner details - try RPC first, fallback to direct query
            let owner = null;
            try {
                const { data: ownerData } = await supabase
                    .rpc('get_user_info', { user_id: ownerId });
                owner = ownerData && ownerData.length > 0 ? ownerData[0] : null;
            } catch (rpcError) {
                console.log('RPC not available, using direct query');
                // Fallback: direct query (will only work if user has permission)
                const { data: ownerData } = await supabase
                    .from('users')
                    .select('id, display_name, phone, role')
                    .eq('id', ownerId)
                    .single();
                owner = ownerData;
            }

            // Create a new conversation object
            const newConv = {
                listingId: listingId,
                listing: listingData,
                otherUser: owner || { display_name: 'Owner', id: ownerId },
                otherUserId: ownerId,
                lastMessage: '',
                lastMessageTime: null,
                unreadCount: 0
            };

            setSelectedConversation(newConv);
            setMessages([]);
        } catch (error) {
            console.error('Error initializing new conversation:', error);
        }
    }, []);

    const selectConversation = useCallback((conversation) => {
        setSelectedConversation(conversation);
        hasInitialized.current = true;
        router.push(`/messages?listing=${conversation.listingId}&with=${conversation.otherUserId}`);
    }, [router]);

    const handleSendMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            setSending(true);
            const sentMessage = await sendMessage(
                selectedConversation.listingId,
                user.id,
                selectedConversation.otherUserId,
                newMessage.trim()
            );

            // Add message to local state immediately
            setMessages(prev => [...prev, sentMessage]);
            setNewMessage('');

            // Update the conversation's last message locally and sort by most recent
            setConversations(prev => prev.map(conv =>
                conv.listingId === selectedConversation.listingId &&
                    conv.otherUserId === selectedConversation.otherUserId
                    ? { ...conv, lastMessage: newMessage.trim(), lastMessageTime: sentMessage.created_at }
                    : conv
            ).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)));
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    }, [newMessage, selectedConversation, user?.id]);

    useEffect(() => {
        if (user) {
            loadConversations();

            // Subscribe to all messages for this user to update conversation list in realtime
            const channel = supabase
                .channel(`user-messages:${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `receiver_id=eq.${user.id}`
                    },
                    (payload) => {
                        const newMsg = payload.new;
                        // Update conversation list with new message
                        setConversations(prev => {
                            const key = `${newMsg.listing_id}-${newMsg.sender_id}`;
                            const existingConv = prev.find(c =>
                                c.listingId === newMsg.listing_id && c.otherUserId === newMsg.sender_id
                            );

                            if (existingConv) {
                                // Update existing conversation and sort by most recent
                                return prev.map(conv =>
                                    conv.listingId === newMsg.listing_id && conv.otherUserId === newMsg.sender_id
                                        ? { ...conv, lastMessage: newMsg.content, lastMessageTime: newMsg.created_at, unreadCount: conv.unreadCount + 1 }
                                        : conv
                                ).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
                            } else {
                                // New conversation - reload to get full details
                                loadConversations();
                                return prev;
                            }
                        });
                    }
                )
                .subscribe();

            return () => {
                channel.unsubscribe();
            };
        }
    }, [user, loadConversations]);

    useEffect(() => {
        if (initialListingId && initialOtherId && !loading && !hasInitialized.current) {
            // Check if conversation exists
            const conv = conversations.find(
                c => c.listingId === initialListingId && c.otherUserId === initialOtherId
            );
            if (conv) {
                setSelectedConversation(conv);
                hasInitialized.current = true;
            } else if (user) {
                // New conversation - fetch listing and owner info
                initializeNewConversation(initialListingId, initialOtherId);
                hasInitialized.current = true;
            }
        }
    }, [initialListingId, initialOtherId, conversations, loading, user, initializeNewConversation]);

    useEffect(() => {
        if (selectedConversation && user) {
            loadMessages(selectedConversation);

            // Subscribe to realtime updates
            const channel = subscribeToMessages(
                selectedConversation.listingId,
                user.id,
                selectedConversation.otherUserId,
                (newMsg) => {
                    // Only add if message doesn't already exist (prevent duplicates)
                    setMessages(prev => {
                        const exists = prev.some(m => m.id === newMsg.id);
                        if (exists) return prev;
                        return [...prev, newMsg];
                    });
                    scrollToBottom();
                }
            );

            return () => {
                channel.unsubscribe();
            };
        }
    }, [selectedConversation?.listingId, selectedConversation?.otherUserId, user?.id, loadMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!user) return null;

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

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-8">Messages</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
                    {/* Conversations List */}
                    <div className="md:col-span-1 bg-card border border-border rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h2 className="font-bold">Conversations</h2>
                        </div>
                        <div className="overflow-y-auto h-full">
                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground space-y-4">
                                    <div className="text-4xl mb-2">💬</div>
                                    <p className="font-medium">No conversations yet</p>
                                    <p className="text-sm">To start a conversation:</p>
                                    <ol className="text-sm text-left max-w-xs mx-auto space-y-2">
                                        <li>1. Browse listings on the search page</li>
                                        <li>2. Click on a listing you're interested in</li>
                                        <li>3. Click "Message Owner" button</li>
                                    </ol>
                                    <Link
                                        href="/search"
                                        className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        Browse Listings
                                    </Link>
                                </div>
                            ) : (
                                conversations
                                    .filter((conv) => conv.listingId && conv.otherUserId) // Filter out invalid conversations
                                    .map((conv) => (
                                        <button
                                            key={`conv-${conv.listingId}-${conv.otherUserId}`}
                                            onClick={() => selectConversation(conv)}
                                            className={`w-full p-4 border-b border-border hover:bg-muted transition-colors text-left ${selectedConversation?.listingId === conv.listingId &&
                                                selectedConversation?.otherUserId === conv.otherUserId
                                                ? 'bg-muted'
                                                : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <p className="font-bold text-sm">{conv.otherUser?.display_name || 'User'}</p>
                                                {conv.unreadCount > 0 && (
                                                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                {conv.listing?.title || 'Listing'}
                                            </p>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {conv.lastMessage}
                                            </p>
                                        </button>
                                    ))
                            )}
                        </div>
                    </div>

                    {/* Messages View */}
                    <div className="md:col-span-2 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-border">
                                    <h2 className="font-bold">{selectedConversation.otherUser?.display_name || 'User'}</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Re: {selectedConversation.listing?.title || 'Listing'}
                                    </p>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.sender_id === user.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.content}</p>
                                                <p className="text-xs opacity-70 mt-1">
                                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            disabled={sending}
                                        />
                                        <button
                                            type="submit"
                                            disabled={sending || !newMessage.trim()}
                                            className="h-10 px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {sending ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                <p>Select a conversation to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div>Loading conversations...</div>}>
            <MessagesPageContent />
        </Suspense>
    );
}
