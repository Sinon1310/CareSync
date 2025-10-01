// Messaging Service for CareSync
import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'alert' | 'appointment' | 'medication';
  is_read: boolean;
  is_urgent: boolean;
  created_at: string;
  read_at?: string;
  sender?: {
    email: string;
    user_metadata?: any;
  };
  receiver?: {
    email: string;
    user_metadata?: any;
  };
}

export interface MessageConversation {
  user_id: string;
  user_email: string;
  user_name: string;
  user_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online?: boolean;
}

class MessagingService {
  // Get all conversations for current user
  async getConversations(): Promise<MessageConversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found in messaging service');
        return [];
      }

      // Get all messages for this user
      const { data: conversations, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Messages table not set up yet or query error:', error.message);
        return [];
      }

      // Get unique user IDs
      const userIds = new Set<string>();
      conversations?.forEach((msg: any) => {
        if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
        if (msg.receiver_id !== user.id) userIds.add(msg.receiver_id);
      });

      if (userIds.size === 0) {
        console.log('No conversations found');
        return [];
      }

      // Get user details (simplified approach)
      const userMap = new Map();
      
      // For now, create simple user data from IDs
      for (const userId of userIds) {
        userMap.set(userId, {
          id: userId,
          email: `user-${userId.slice(0, 8)}@example.com`,
          user_metadata: { role: 'patient' }
        });
      }

      // Group by conversation partner
      const conversationMap = new Map<string, MessageConversation>();

      conversations?.forEach((msg: any) => {
        const isFromCurrentUser = msg.sender_id === user.id;
        const partnerId = isFromCurrentUser ? msg.receiver_id : msg.sender_id;
        const partner = userMap.get(partnerId);

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            user_id: partnerId,
            user_email: partner?.email || 'Unknown',
            user_name: partner?.user_metadata?.name || partner?.email?.split('@')[0] || 'Unknown',
            user_role: partner?.user_metadata?.role || 'patient',
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: 0,
          });
        }

        // Count unread messages from this partner
        if (!isFromCurrentUser && !msg.is_read) {
          conversationMap.get(partnerId)!.unread_count++;
        }
      });

      return Array.from(conversationMap.values());
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Get messages between current user and another user
  async getMessagesWith(userId: string): Promise<Message[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark messages from the other user as read
      await this.markMessagesAsRead(userId);

      return (messages || []) as Message[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a new message
  async sendMessage(
    receiverId: string,
    content: string,
    messageType: 'text' | 'alert' | 'appointment' | 'medication' = 'text',
    isUrgent: boolean = false
  ): Promise<Message> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          message_type: messageType,
          is_urgent: isUrgent,
        })
        .select('*')
        .single();

      if (error) throw error;

      return message as Message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(senderId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Subscribe to new messages
  subscribeToMessages(callback: (message: Message) => void) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  }

  // Send urgent alert to patient
  async sendUrgentAlert(patientId: string, message: string): Promise<Message> {
    return this.sendMessage(patientId, message, 'alert', true);
  }

  // Send medication reminder
  async sendMedicationReminder(patientId: string, medicationName: string): Promise<Message> {
    const message = `⏰ Reminder: It's time to take your ${medicationName}. Please log it in your dashboard after taking it.`;
    return this.sendMessage(patientId, message, 'medication', false);
  }

  // Send appointment notification
  async sendAppointmentNotification(patientId: string, appointmentDetails: string): Promise<Message> {
    const message = `📅 Appointment Update: ${appointmentDetails}`;
    return this.sendMessage(patientId, message, 'appointment', false);
  }
}

export const messagingService = new MessagingService();
