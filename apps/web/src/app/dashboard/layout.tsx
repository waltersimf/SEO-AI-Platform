'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { io } from 'socket.io-client';
import { Sidebar } from '@/components/sidebar';
import { API_URL, SOCKET_URL } from '@/config/api';
import { SocketProvider } from '@/contexts/socket-context';
import { ChatSidebarProvider, useChatSidebar } from '@/contexts/chat-sidebar-context';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { SmartFAB } from '@/components/chat/SmartFAB';
import { ChatToastNotification } from '@/components/chat/ChatToastNotification';
import { apiFetch } from '@/lib/api';

// Inner component that uses the chat sidebar context
function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [socketStatus, setSocketStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  const { addUnreadMessage, setTotalUnreadCount, setUnreadMessages, state } = useChatSidebar();

  // Helper to get chat display name
  const getChatName = (chat: any): string => {
    if (chat.name) return chat.name;
    if (chat.type === 'direct' && chat.members) {
      const otherMember = chat.members.find((m: any) => m.userId !== user?.id);
      return otherMember?.user?.name || 'Direct Chat';
    }
    return 'Unnamed Chat';
  };

  // Only show chat on main dashboard and chat pages
  const showChat = pathname === '/dashboard' || pathname.startsWith('/dashboard/chat');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        organizationId: payload.organizationId,
      });
    } catch (error) {
      console.error('Invalid token:', error);
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    if (!user?.organizationId) return;

    const handleOnline = () => setSocketStatus('connected');
    const handleOffline = () => setSocketStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      setSocketStatus('connected');
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          socket.emit('join_organization', payload.organizationId);
        } catch (error) {
          console.error('Failed to join organization:', error);
        }
      }
    });

    socket.on('disconnect', () => setSocketStatus('disconnected'));
    socket.io.on('reconnect_attempt', () => setSocketStatus('reconnecting'));

    socket.on('new_message', (message: any) => {
      // Add to unread messages if not from current user
      if (message.authorId !== user.id) {
        // Only add if sidebar is closed or this isn't the active chat
        if (!state.isOpen || state.activeChatId !== message.chatId) {
          addUnreadMessage({
            chatId: message.chatId,
            senderId: message.authorId,
            senderName: message.author?.name || 'Unknown',
            senderAvatar: message.author?.avatar,
            message: message.content,
            timestamp: new Date(),
          });
        }
      }
      fetchUnreadCount();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.disconnect();
    };
  }, [user, state.isOpen, state.activeChatId, addUnreadMessage]);

  const fetchUnreadCount = async () => {
    try {
      const chats = await apiFetch(`${API_URL}/api/chat/list`);
      const total = chats.reduce((sum: number, chat: any) => sum + (chat.unreadCount || 0), 0);
      setTotalUnreadCount(total);

      // Build unreadMessages array from chats with unread messages
      const unreadMsgs: Array<{
        chatId: string;
        senderId: string;
        senderName: string;
        senderAvatar?: string;
        message: string;
        timestamp: Date;
      }> = [];

      chats.forEach((chat: any) => {
        if (chat.unreadCount > 0 && chat.messages && chat.messages.length > 0) {
          const lastMessage = chat.messages[0]; // Most recent message
          if (lastMessage && lastMessage.author) {
            // Get sender info - for direct chats, get the other user
            let senderName = lastMessage.author.name || 'Unknown';
            let senderId = lastMessage.author.id || lastMessage.authorId;

            // For direct chats, use the other member's name as chat identifier
            if (chat.type === 'direct') {
              const otherMember = chat.members?.find((m: any) => m.userId !== user?.id);
              if (otherMember?.user) {
                senderName = otherMember.user.name;
                senderId = otherMember.user.id;
              }
            }

            unreadMsgs.push({
              chatId: chat.id,
              senderId: senderId,
              senderName: senderName,
              senderAvatar: lastMessage.author.avatar,
              message: lastMessage.content || '',
              timestamp: new Date(lastMessage.createdAt),
            });
          }
        }
      });

      setUnreadMessages(unreadMsgs);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <SocketProvider socketStatus={socketStatus}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">{children}</main>

        {/* New Chat Sidebar System */}
        {user && showChat && (
          <>
            <ChatSidebar
              currentUserId={user.id}
              currentUserName={user.name}
              organizationId={user.organizationId}
            />
            <SmartFAB />
            <ChatToastNotification />
          </>
        )}
      </div>
    </SocketProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatSidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </ChatSidebarProvider>
  );
}
