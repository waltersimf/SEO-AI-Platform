"use client";

import { MessageCircle, Inbox, Maximize2, Send } from "lucide-react";
import { useState } from "react";

interface Contact {
  id: string;
  name: string;
  unreadCount: number;
  lastMessage?: string;
  avatar?: string;
}

interface ChatInputBarProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
  unreadChats?: Contact[];
}

// Sidebar width constant - should match sidebar component
const SIDEBAR_WIDTH = 256;

export function ChatInputBar({
  isOpen,
  onToggle,
  unreadCount = 0,
  unreadChats = []
}: ChatInputBarProps) {
  const [inputValue, setInputValue] = useState("");

  // Derived state
  const unreadContacts = unreadChats.filter(c => c.unreadCount > 0);
  const totalUnreadCount = unreadContacts.reduce((acc, c) => acc + c.unreadCount, 0);
  const hasMultipleUnreadSenders = unreadContacts.length > 1;
  const hasAnyUnread = unreadContacts.length > 0;

  // Format sender list: "AI Assistant, George Miller, +1 more"
  const formatSenderList = () => {
    const names = unreadContacts.map(c => c.name.split(' ')[0]);
    if (names.length <= 2) return names.join(', ');
    const firstTwo = names.slice(0, 2).join(', ');
    const remaining = names.length - 2;
    return `${firstTwo}, +${remaining} more`;
  };

  // Get first name for single contact view
  const singleContact = !hasMultipleUnreadSenders && hasAnyUnread ? unreadContacts[0] : null;

  // Multiple Unread View Component
  const MultipleUnreadView = () => (
    <div className="p-4">
      <div className="flex items-center gap-3">
        {/* Stacked inbox icon effect */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Inbox className="h-6 w-6 text-blue-600" />
          </div>
          {/* Badge */}
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900">
            {totalUnreadCount} New Message{totalUnreadCount !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">From:</span>{' '}
            <span className="text-gray-700">{formatSenderList()}</span>
          </p>
        </div>
      </div>
    </div>
  );

  // Single Contact View Component
  const SingleContactView = () => {
    if (!singleContact) return null;

    // Get initials for avatar
    const initials = singleContact.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Determine avatar color based on name
    const isAI = singleContact.name.toLowerCase().includes('ai');
    const avatarBg = isAI ? 'bg-blue-500' : 'bg-purple-500';

    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full ${avatarBg} flex items-center justify-center text-white font-semibold`}>
            {initials}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-gray-900 truncate">
                {singleContact.name}
              </p>
              {singleContact.unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 h-5 rounded-full bg-blue-500 text-xs font-medium text-white">
                  {singleContact.unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {singleContact.lastMessage || 'New message'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Empty State View Component
  const EmptyStateView = () => (
    <div className="p-4">
      <div className="flex items-center gap-3">
        {/* Message icon */}
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <MessageCircle className="h-6 w-6 text-gray-400" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-gray-500">
            No active conversations
          </p>
          <p className="text-sm text-muted-foreground">
            Start a new chat to get going
          </p>
        </div>
      </div>
    </div>
  );

  // Bottom Section - Input or Inbox button
  const BottomSection = () => (
    <div className="border-t border-border/50 p-3 flex items-center gap-2">
      {hasMultipleUnreadSenders ? (
        // Open inbox button for multiple unread
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Inbox className="h-4 w-4" />
          <span>Open inbox to reply...</span>
        </button>
      ) : (
        // Quick reply input
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            placeholder="Quick reply..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onClick={onToggle}
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 cursor-pointer"
            readOnly
          />
          <button
            onClick={onToggle}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Maximize button - always visible */}
      <div className="border-l border-border/50 pl-2">
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Expand chat"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed bottom-0 right-0 px-8 pb-8 pt-6 pointer-events-none flex justify-center z-40"
      style={{ left: SIDEBAR_WIDTH }}
    >
      <div
        className={`w-full max-w-5xl transition-all duration-300 transform pointer-events-auto ${
          isOpen ? 'translate-y-48 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="rounded-lg border bg-card shadow-lg overflow-hidden">
          {/* Header - Google Search Console style */}
          <div className="px-4 py-3 border-b border-border/50">
            <h3 className="font-semibold text-gray-900">Google Search Console</h3>
          </div>

          {/* Main Content - View States */}
          {hasMultipleUnreadSenders ? (
            <MultipleUnreadView />
          ) : hasAnyUnread ? (
            <SingleContactView />
          ) : (
            <EmptyStateView />
          )}

          {/* Bottom Section */}
          <BottomSection />
        </div>
      </div>
    </div>
  );
}
