'use client';

import { Mail, Maximize2, Send, MessageCircle } from "lucide-react";

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
  className?: string;
}

export function ChatInputBar({
  isOpen,
  onToggle,
  unreadCount = 0,
  unreadChats = [],
  className = ""
}: ChatInputBarProps) {

  // Derived state
  const unreadContacts = unreadChats.filter(c => c.unreadCount > 0);
  const totalUnreadCount = unreadContacts.reduce((acc, c) => acc + c.unreadCount, 0);
  const hasMultipleUnreadSenders = unreadContacts.length > 1;
  const hasAnyUnread = unreadContacts.length > 0;

  // Format sender list: "AI Assistant, George Miller, +1 more"
  const formatSenderList = () => {
    const names = unreadContacts.map(c => c.name.split(' ')[0]);
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return names.join(', ');
    const firstTwo = names.slice(0, 2).join(', ');
    const remaining = names.length - 2;
    return `${firstTwo}, +${remaining} more`;
  };

  // View Components
  const MultipleUnreadView = () => (
    <div className="p-4">
      {/* Stacked cards effect */}
      <div className="relative">
        {/* Background stacked cards */}
        <div className="absolute -top-1 left-2 right-2 h-2 bg-blue-100 rounded-t-lg opacity-60" />
        <div className="absolute -top-0.5 left-1 right-1 h-1 bg-blue-50 rounded-t-lg opacity-40" />

        {/* Main content card */}
        <div className="relative bg-blue-50 rounded-xl p-4 flex items-center gap-4">
          {/* Inbox icon with badge */}
          <div className="relative">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-white" />
            </div>
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
              </span>
            )}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900">
              {totalUnreadCount} New Message{totalUnreadCount !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-gray-600">
              <span className="text-gray-500">From: </span>
              <span className="font-medium">{formatSenderList()}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const SingleContactView = () => {
    const contact = unreadContacts[0];
    if (!contact) return null;

    return (
      <div className="p-4">
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {contact.name.charAt(0).toUpperCase()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900">{contact.name}</p>
            <p className="text-sm text-gray-500 truncate">
              {contact.lastMessage || 'New message'}
            </p>
          </div>

          {/* Unread badge */}
          {contact.unreadCount > 0 && (
            <span className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
            </span>
          )}
        </div>
      </div>
    );
  };

  const EmptyStateView = () => (
    <div className="p-4">
      <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <MessageCircle className="h-6 w-6 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-gray-500">No active conversations</p>
          <p className="text-sm text-gray-400">Start a new chat</p>
        </div>
      </div>
    </div>
  );

  // Bottom section with input or button
  const BottomSection = () => (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-2">
        {hasMultipleUnreadSenders ? (
          // Button mode for multiple unread
          <button
            onClick={onToggle}
            className="flex-1 flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-full text-gray-500 hover:bg-gray-50 transition-colors text-left"
          >
            <span className="text-sm">Open inbox to reply...</span>
          </button>
        ) : (
          // Input mode for single/no unread
          <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-full">
            <input
              type="text"
              placeholder="Quick reply..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              onClick={onToggle}
              readOnly
            />
            <button
              onClick={onToggle}
              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        )}

        {/* Icon button - mail or maximize */}
        <button
          onClick={onToggle}
          className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          {hasMultipleUnreadSenders ? (
            <Mail className="h-5 w-5 text-gray-500" />
          ) : (
            <Maximize2 className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 px-8 pb-8 pt-6 pointer-events-none flex justify-center z-40">
      <div
        className={`max-w-5xl w-full pointer-events-auto transition-all duration-300 transform ${
          isOpen ? 'translate-y-48 opacity-0' : 'translate-y-0 opacity-100'
        } ${className}`}
      >
        {/* Card container */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Google Search Console</h3>
          </div>

          {/* Content - 3 view states */}
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
