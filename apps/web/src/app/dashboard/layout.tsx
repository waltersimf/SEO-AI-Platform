'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { Sidebar } from '@/components/sidebar';
import { CreateChatDialog } from '@/components/chat/create-chat-dialog';
import { ChatInputBar } from '@/components/chat/chat-input-bar';
import { ChatOverlay } from '@/components/chat/chat-overlay';
import { ToastManager } from '@/components/chat/notifications/toast-manager';

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

  // Socket listener for new messages (show toast if overlay closed)
  useEffect(() => {
    if (!user?.organizationId) return;

    const socket = io('http://localhost:4000');

    socket.on('connect', () => {
      console.log('🔌 Dashboard: Socket connected');
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

    socket.on('new_message', (message: any) => {
      console.log('📨 Dashboard: New message received', message);

      // Show toast only if overlay is closed and message is not from current user
      if (!isChatOpen && message.authorId !== user.id) {
        const addToast = (window as any).addChatToast;
        if (addToast) {
          addToast({
            id: message.id,
            chatId: message.chatId,
            chatName: message.chat?.name || 'Direct Message',
            message: message.content,
            authorName: message.author?.name || 'Unknown',
          });
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, isChatOpen]);

  // Fetch total unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:4000/api/chat/list', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const chats = await response.json();
          const total = chats.reduce((sum: number, chat: any) => sum + (chat.unreadCount || 0), 0);
          setTotalUnreadCount(total);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    if (user) {
      fetchUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleChatSelect = async (chatId: string) => {
    setActiveChatId(chatId);
    setIsChatOpen(true); // Open overlay when chat selected

    // Mark chat as read on the backend
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`http://localhost:4000/api/chat/${chatId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local unread count
      setTotalUnreadCount((prev) => Math.max(0, prev - 1));

      // No need to refresh - ChatList handles unread count reset locally

    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const handleChatCreated = async (chatId: string) => {
    handleChatSelect(chatId); // This will open overlay and select chat
  };

  const handleChatDeleted = (deletedChatId: string) => {
    // If the deleted chat was active, clear the active chat
    if (deletedChatId === activeChatId) {
      setActiveChatId(null);
      console.log('🗑️ Active chat deleted, clearing selection');
    }
  };

  const handleToastClick = (chatId: string) => {
    // Open overlay and select chat
    setActiveChatId(chatId);
    setIsChatOpen(true);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>

      {/* Chat Input Bar - Fixed Bottom */}
      {user && (
        <ChatInputBar
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          unreadCount={totalUnreadCount}
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
        />
      )}

      {/* Toast Notifications - Top Right */}
      {user && <ToastManager onToastClick={handleToastClick} />}

      {/* Create Chat Dialog */}
      {user && (
        <CreateChatDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onChatCreated={handleChatCreated}
        />
      )}
    </div>
  );
}
