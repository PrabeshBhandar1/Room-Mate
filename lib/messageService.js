import { supabase } from './supabaseClient';

/**
 * Fetch all conversations for the current user
 * Returns unique conversations with the latest message
 */
export async function getConversations(userId) {
    try {
        // Get all messages where user is sender or receiver
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!messages || messages.length === 0) {
            return [];
        }

        // Group by conversation (listing + other user)
        const conversationsMap = new Map();
        const userIds = new Set();
        const listingIds = new Set();

        messages.forEach(msg => {
            // Skip messages with invalid data
            if (!msg.listing_id || !msg.sender_id || !msg.receiver_id) {
                console.warn('Skipping message with invalid data:', msg);
                return;
            }

            const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            const key = `${msg.listing_id}-${otherUserId}`;

            if (!conversationsMap.has(key)) {
                conversationsMap.set(key, {
                    listingId: msg.listing_id,
                    listing: null,
                    otherUser: null,
                    otherUserId,
                    lastMessage: msg.content,
                    lastMessageTime: msg.created_at,
                    unreadCount: 0
                });
                userIds.add(otherUserId);
                listingIds.add(msg.listing_id);
            }

            // Count unread messages
            if (msg.receiver_id === userId && !msg.is_read) {
                conversationsMap.get(key).unreadCount++;
            }
        });


        // Fetch user details for all other users
        const userPromises = Array.from(userIds).map(async (uid) => {
            try {
                const { data } = await supabase.rpc('get_user_info', { user_id: uid });
                return { id: uid, data: data && data.length > 0 ? data[0] : null };
            } catch (error) {
                console.error(`Error fetching user ${uid}:`, error);
                return { id: uid, data: null };
            }
        });

        // Fetch listing details
        const { data: listings } = await supabase
            .from('listings')
            .select('id, title')
            .in('id', Array.from(listingIds));

        const usersData = await Promise.all(userPromises);
        const usersMap = new Map(usersData.map(u => [u.id, u.data]));
        const listingsMap = new Map((listings || []).map(l => [l.id, l]));

        // Populate conversations with user and listing data
        const conversations = Array.from(conversationsMap.values())
            .map(conv => ({
                ...conv,
                otherUser: usersMap.get(conv.otherUserId) || { display_name: 'User', id: conv.otherUserId },
                listing: listingsMap.get(conv.listingId) || { title: 'Listing', id: conv.listingId }
            }))
            .filter(conv => conv.listingId && conv.otherUserId) // Ensure valid conversations
            .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)); // Sort by most recent

        return conversations;
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }
}

/**
 * Fetch messages for a specific conversation
 */
export async function getMessages(listingId, otherUserId, currentUserId) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:sender_id(display_name), receiver:receiver_id(display_name)')
            .eq('listing_id', listingId)
            .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
}

/**
 * Send a new message
 */
export async function sendMessage(listingId, senderId, receiverId, content) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                listing_id: listingId,
                sender_id: senderId,
                receiver_id: receiverId,
                content,
                is_read: false
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(listingId, senderId, receiverId) {
    try {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('listing_id', listingId)
            .eq('sender_id', senderId)
            .eq('receiver_id', receiverId)
            .eq('is_read', false);

        if (error) throw error;
    } catch (error) {
        console.error('Error marking messages as read:', error);
        throw error;
    }
}

/**
 * Subscribe to new messages for a conversation
 */
export function subscribeToMessages(listingId, currentUserId, otherUserId, callback) {
    const channel = supabase
        .channel(`messages:${listingId}:${currentUserId}:${otherUserId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `listing_id=eq.${listingId}`
            },
            (payload) => {
                // Only trigger callback if message is part of this conversation
                const msg = payload.new;
                if (
                    (msg.sender_id === currentUserId && msg.receiver_id === otherUserId) ||
                    (msg.sender_id === otherUserId && msg.receiver_id === currentUserId)
                ) {
                    callback(payload.new);
                }
            }
        )
        .subscribe();

    return channel;
}
