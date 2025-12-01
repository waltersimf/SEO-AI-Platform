'use client';

import { useState, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatSidebar } from '@/contexts/chat-sidebar-context';
import { cn } from '@/lib/utils';

interface SmartFABProps {
  className?: string;
}

export function SmartFAB({ className }: SmartFABProps) {
  const { state, openSidebar, selectChat } = useChatSidebar();
  const [isHovered, setIsHovered] = useState(false);

  // Get unique senders from unread messages (max 3)
  const uniqueSenders = useMemo(() => {
    const seen = new Set<string>();
    return state.unreadMessages
      .filter(msg => {
        if (seen.has(msg.senderId)) return false;
        seen.add(msg.senderId);
        return true;
      })
      .slice(0, 3);
  }, [state.unreadMessages]);

  // Get the latest unread message for preview
  const latestMessage = useMemo(() => {
    return state.unreadMessages[state.unreadMessages.length - 1];
  }, [state.unreadMessages]);

  const hasUnread = state.totalUnreadCount > 0;

  // Don't render if sidebar is open
  if (state.isOpen) {
    return null;
  }

  const handleClick = () => {
    openSidebar();
  };

  const handlePreviewClick = () => {
    if (latestMessage) {
      openSidebar();
      selectChat(latestMessage.chatId, latestMessage.senderName);
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate color from name (consistent per user)
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
    <div className={cn('fixed bottom-6 right-6 z-30', className)}>
      {/* Hover Preview (only when there are unread messages) */}
      {hasUnread && isHovered && latestMessage && (
        <div
          onClick={handlePreviewClick}
          className="absolute bottom-full right-0 mb-3 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 cursor-pointer transform transition-all duration-200 hover:shadow-2xl"
        >
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
            Latest Message
          </p>
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0',
                getColorClass(latestMessage.senderName)
              )}
            >
              {latestMessage.senderAvatar || getInitials(latestMessage.senderName)}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {latestMessage.senderName}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {latestMessage.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'flex items-center justify-center shadow-lg transition-all duration-300 ease-out',
          'hover:shadow-xl active:scale-95',
          hasUnread
            ? 'bg-blue-500 hover:bg-blue-600 rounded-full px-4 py-3 gap-3'
            : 'bg-blue-500 hover:bg-blue-600 rounded-full w-14 h-14 hover:scale-105'
        )}
      >
        {hasUnread ? (
          <>
            {/* Facepile - overlapping avatars */}
            <div className="flex items-center">
              {uniqueSenders.map((sender, index) => (
                <div
                  key={sender.senderId}
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm',
                    getColorClass(sender.senderName)
                  )}
                  style={{
                    marginLeft: index === 0 ? 0 : '-8px',
                    zIndex: uniqueSenders.length - index
                  }}
                >
                  {getInitials(sender.senderName).charAt(0)}
                </div>
              ))}
            </div>
            {/* Text */}
            <span className="text-white font-semibold text-sm whitespace-nowrap">
              {state.totalUnreadCount} New Message{state.totalUnreadCount !== 1 ? 's' : ''}
            </span>
          </>
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
