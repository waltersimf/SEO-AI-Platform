'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useChatSidebar, UnreadMessage } from '@/contexts/chat-sidebar-context';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  message: UnreadMessage;
  isVisible: boolean;
}

const TOAST_DURATION = 5000; // 5 seconds

export function ChatToastNotification() {
  const { state, openSidebar, selectChat } = useChatSidebar();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Watch for new unread messages
  useEffect(() => {
    if (state.unreadMessages.length > lastMessageCount && !state.isOpen) {
      // New message arrived
      const newMessage = state.unreadMessages[state.unreadMessages.length - 1];
      const toastId = `${newMessage.chatId}-${Date.now()}`;

      // Add new toast
      setToasts(prev => [
        ...prev.slice(-2), // Keep only last 2 toasts
        { id: toastId, message: newMessage, isVisible: true },
      ]);

      // Auto-dismiss after duration
      setTimeout(() => {
        setToasts(prev =>
          prev.map(t => (t.id === toastId ? { ...t, isVisible: false } : t))
        );
        // Remove from DOM after fade animation
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 300);
      }, TOAST_DURATION);
    }

    setLastMessageCount(state.unreadMessages.length);
  }, [state.unreadMessages.length, state.isOpen, lastMessageCount]);

  const dismissToast = (toastId: string) => {
    setToasts(prev =>
      prev.map(t => (t.id === toastId ? { ...t, isVisible: false } : t))
    );
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 300);
  };

  const handleToastClick = (toast: Toast) => {
    openSidebar();
    selectChat(toast.message.chatId, toast.message.senderName);
    dismissToast(toast.id);
  };

  // Don't render if sidebar is open
  if (state.isOpen || toasts.length === 0) {
    return null;
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate color from name
  const getColorClass = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => handleToastClick(toast)}
          className={cn(
            'relative w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 cursor-pointer',
            'transform transition-all duration-300 ease-out',
            'hover:shadow-2xl hover:border-blue-300',
            toast.isVisible
              ? 'translate-x-0 opacity-100'
              : 'translate-x-full opacity-0'
          )}
        >
          {/* Close button */}
          <button
            onClick={e => {
              e.stopPropagation();
              dismissToast(toast.id);
            }}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            {/* Avatar */}
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                getColorClass(toast.message.senderName)
              )}
            >
              {getInitials(toast.message.senderName)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {toast.message.senderName}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                {toast.message.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
