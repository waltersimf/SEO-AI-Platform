'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { io } from 'socket.io-client';
import { Sidebar } from '@/components/sidebar';
import { CreateChatDialog } from '@/components/chat/create-chat-dialog';
import { ChatInputBar } from '@/components/chat/chat-input-bar';
import { ChatOverlay } from '@/components/chat/chat-overlay';
import { ChatNotificationBubble } from '@/components/chat/notifications/chat-notification-bubble';
import { API_URL, SOCKET_URL } from '@/config/api';
import { SocketProvider } from '@/contexts/socket-context';
import { apiFetch } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  // Only show chat on main dashboard and chat pages
  const showChat = pathname === '/dashboard' || pathname.startsWith('/dashboard/chat');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState<Array<{id: string, name: string, unreadCount: number}>>([]);
  const [chatListRefreshTrigger, setChatListRefreshTrigger] = useState(0);
  const [notificationBubble, setNotificationBubble] = useState<{
    chatId: string;
    senderName: string;
    message: string;
  } | null>(null);
  const [socketStatus, setSocketStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

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
      if (!isChatOpen && message.authorId !== user.id) {
        setNotificationBubble({
          chatId: message.chatId,
          senderName: message.author?.name || 'Unknown',
          message: message.content,
        });
      }
      fetchUnreadCount();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.disconnect();
    };
  }, [user, isChatOpen]);

  const getChatName = (chat: any): string => {
    if (chat.name) return chat.name;
    if (chat.type === 'direct' && chat.members) {
      const otherMember = chat.members.find((m: any) => m.userId !== user?.id);
      return otherMember?.user?.name || 'Direct Chat';
    }
    return 'Unnamed Chat';
  };

  const fetchUnreadCount = async () => {
    try {
      const chats = await apiFetch(`${API_URL}/api/chat/list`);
      const total = chats.reduce((sum: number, chat: any) => sum + (chat.unreadCount || 0), 0);
      setTotalUnreadCount(total);
      
      const unread = chats
        .filter((chat: any) => chat.unreadCount > 0)
        .map((chat: any) => ({
          id: chat.id,
          name: getChatName(chat),
          unreadCount: chat.unreadCount
        }));
      setUnreadChats(unread);
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

  const handleChatSelect = async (chatId: string) => {
    setActiveChatId(chatId);
    setIsChatOpen(true);
    setNotificationBubble(null);

    try {
      await apiFetch(`${API_URL}/api/chat/${chatId}/read`, { method: 'POST' });
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const handleChatCreated = async (chatId: string) => {
    setChatListRefreshTrigger(prev => prev + 1);
    handleChatSelect(chatId);
  };

  const handleChatDeleted = (deletedChatId: string) => {
    if (deletedChatId === activeChatId) setActiveChatId(null);
  };

  const handleBubbleClick = (chatId: string) => handleChatSelect(chatId);
  const handleBubbleDismiss = () => setNotificationBubble(null);

  return (
    <SocketProvider socketStatus={socketStatus}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">{children}</main>

        {user && showChat && (
          <ChatInputBar
            isOpen={isChatOpen}
            onToggle={() => setIsChatOpen(!isChatOpen)}
            unreadCount={totalUnreadCount}
            unreadChats={unreadChats}
          />
        )}

        {user && showChat && (
          <ChatOverlay
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            activeChatId={activeChatId}
            onChatSelect={handleChatSelect}
            onCreateChat={() => setIsCreateDialogOpen(true)}
            currentUserId={user.id}
            currentUserName={user.name}
            organizationId={user.organizationId}
            onChatDeleted={handleChatDeleted}
            refreshTrigger={chatListRefreshTrigger}
          />
        )}

        {showChat && notificationBubble && (
          <ChatNotificationBubble
            chatId={notificationBubble.chatId}
            senderName={notificationBubble.senderName}
            message={notificationBubble.message}
            onClick={handleBubbleClick}
            onDismiss={handleBubbleDismiss}
          />
        )}

        {user && showChat && (
          <CreateChatDialog
            isOpen={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            onChatCreated={handleChatCreated}
          />
        )}
      </div>
    </SocketProvider>
  );
}