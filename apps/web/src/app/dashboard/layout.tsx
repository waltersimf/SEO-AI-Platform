'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [user, setUser] = useState<any>(null);
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
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Decode JWT to get user info
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

  // Socket listener for new messages
  useEffect(() => {
    if (!user?.organizationId) return;

    const handleOnline = () => {
      console.log('🌐 Browser ONLINE');
      setSocketStatus('connected');
    };

    const handleOffline = () => {
      console.log('📡 Browser OFFLINE');
      setSocketStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('🔌 Dashboard: Socket connected');
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

    socket.on('disconnect', () => {
      console.log('🔌 Dashboard: Socket disconnected');
      setSocketStatus('disconnected');
    });

    socket.io.on('reconnect_attempt', () => {
      console.log('🔄 Dashboard: Socket reconnecting...');
      setSocketStatus('reconnecting');
    });

    socket.on('new_message', (message: any) => {
      console.log('📨 Dashboard: New message received', message);

      if (!isChatOpen && message.authorId !== user.id) {
        setNotificationBubble({
          chatId: message.chatId,
          senderName: message.author?.name || 'Unknown',
          message: message.content,
        });
      }
      
      // Refresh unread count
      fetchUnreadCount();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.disconnect();
    };
  }, [user, isChatOpen]);

  // Helper function to get chat name
  const getChatName = (chat: any): string => {
    console.log('🏷️ getChatName for chat:', chat.id, 'type:', chat.type, 'name:', chat.name);
    
    if (chat.name) {
      return chat.name;
    }
    
    if (chat.type === 'direct' && chat.members) {
      const otherMember = chat.members.find((m: any) => m.userId !== user?.id);
      console.log('👤 Other member:', otherMember);
      return otherMember?.user?.name || 'Direct Chat';
    }
    
    return 'Unnamed Chat';
  };

  // Fetch total unread count AND list of unread chats
  const fetchUnreadCount = async () => {
    console.log('🚀 fetchUnreadCount called!');
    
    try {
      const chats = await apiFetch(`${API_URL}/api/chat/list`);
      
      console.log('🔍 All chats from API:', chats);
      
      // Total count
      const total = chats.reduce((sum: number, chat: any) => sum + (chat.unreadCount || 0), 0);
      setTotalUnreadCount(total);
      
      console.log('📊 Total unread count:', total);
      
      // Extract chats with unread messages
      const unread = chats
        .filter((chat: any) => {
          console.log('🔎 Checking chat:', chat.id, 'unreadCount:', chat.unreadCount);
          return chat.unreadCount > 0;
        })
        .map((chat: any) => {
          const name = getChatName(chat);
          console.log('📝 Mapped unread chat:', { id: chat.id, name, unreadCount: chat.unreadCount });
          return {
            id: chat.id,
            name: name,
            unreadCount: chat.unreadCount
          };
        });
      
      console.log('📬 Final unreadChats array:', unread);
      console.log('📬 unreadChats.length:', unread.length);
      
      setUnreadChats(unread);
      
    } catch (error) {
      console.error('❌ Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    console.log('👤 User changed:', user?.id);
    
    if (user) {
      console.log('✅ User exists, calling fetchUnreadCount...');
      fetchUnreadCount();
      
      const interval = setInterval(() => {
        console.log('⏰ Interval: refreshing unread count...');
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // DEBUG: Log when unreadChats changes
  useEffect(() => {
    console.log('🔄 unreadChats state updated:', unreadChats);
    console.log('🔄 hasMultipleUnread:', unreadChats.length > 1);
  }, [unreadChats]);

  const handleChatSelect = async (chatId: string) => {
    setActiveChatId(chatId);
    setIsChatOpen(true);
    setNotificationBubble(null);

    try {
      await apiFetch(`${API_URL}/api/chat/${chatId}/read`, {
        method: 'POST',
      });

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
    if (deletedChatId === activeChatId) {
      setActiveChatId(null);
      console.log('🗑️ Active chat deleted, clearing selection');
    }
  };

  const handleBubbleClick = (chatId: string) => {
    handleChatSelect(chatId);
  };

  const handleBubbleDismiss = () => {
    setNotificationBubble(null);
  };

  return (
    <SocketProvider socketStatus={socketStatus}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">{children}</main>

      {/* Chat Input Bar - Fixed Bottom */}
      {user && (
        <ChatInputBar
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          unreadCount={totalUnreadCount}
          unreadChats={unreadChats}
        />
      )}

      {/* Chat Overlay - Slide Up/Down */}
      {user && (
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

      {/* Sticky Chat Notification Bubble */}
      {notificationBubble && (
        <ChatNotificationBubble
          chatId={notificationBubble.chatId}
          senderName={notificationBubble.senderName}
          message={notificationBubble.message}
          onClick={handleBubbleClick}
          onDismiss={handleBubbleDismiss}
        />
      )}

      {/* Create Chat Dialog */}
      {user && (
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