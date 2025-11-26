'use client';

import { Inbox, Maximize2, Send } from "lucide-react";
import { useState } from "react";

interface Contact {
  id: string;
  name: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  isAi?: boolean;
}

interface ChatInputBarProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
  unreadChats?: Array<{id: string, name: string, unreadCount: number, lastMessage?: string, isAi?: boolean}>;
}

const SIDEBAR_WIDTH = 256;

// Default AI Assistant contact for empty state
const AI_ASSISTANT_CONTACT: Contact = {
  id: 'ai-assistant',
  name: 'AI Assistant',
  unreadCount: 0,
  lastMessage: '',
  isAi: true
};

export function ChatInputBar({
  isOpen,
  onToggle,
  unreadCount = 0,
  unreadChats = []
}: ChatInputBarProps) {
  const [quickReplyText, setQuickReplyText] = useState('');

  // Derived state
  const unreadContacts = unreadChats.filter(c => c.unreadCount > 0);
  const hasMultipleUnread = unreadContacts.length > 1;
  const hasUnread = unreadCount > 0;

  // Primary contact: first unread contact, or AI Assistant for empty state
  const primaryContact: Contact = unreadContacts.length > 0
    ? { ...unreadContacts[0], isAi: unreadContacts[0].name === 'AI Assistant' }
    : AI_ASSISTANT_CONTACT;

  // View state flags
  const isSummaryView = hasMultipleUnread;
  const isSingleUnreadView = hasUnread && !hasMultipleUnread;
  const isEmptyState = !hasUnread;

  // Format sender list for summary view
  const formatSenderList = () => {
    if (unreadContacts.length === 0) return '';
    if (unreadContacts.length === 1) return unreadContacts[0].name;
    if (unreadContacts.length === 2) {
      return `${unreadContacts[0].name}, ${unreadContacts[1].name}`;
    }
    const firstTwo = unreadContacts.slice(0, 2).map(c => c.name).join(', ');
    const remaining = unreadContacts.length - 2;
    return `${firstTwo}, +${remaining} more`;
  };

  // Get current time formatted
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleBarClick = () => {
    onToggle();
  };

  // Determine input placeholder based on state
  const getInputPlaceholder = () => {
    if (isEmptyState || primaryContact.isAi) {
      return "Message AI Assistant...";
    }
    return "Quick reply...";
  };

  // --- Summary View (Multiple Unread) ---
  const SummaryView = () => (
    <div className="p-4 border-b border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors">
      {/* Stacked inbox icon */}
      <div className="relative">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
          <Inbox className="h-6 w-6 text-white" />
        </div>
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <span className="font-bold text-gray-900">{unreadCount} New Message{unreadCount !== 1 ? 's' : ''}</span>
        <p className="text-sm text-gray-600 truncate">From: {formatSenderList()}</p>
      </div>
    </div>
  );

  // --- Single Contact View (One Unread or AI Assistant) ---
  const SingleContactView = ({ contact }: { contact: Contact }) => {
    const isAi = contact.isAi || contact.name === 'AI Assistant';
    const displayMessage = isAi && !contact.lastMessage
      ? "Ready to help via chat..."
      : contact.lastMessage || "New message received...";

    return (
      <div className="p-4 border-b border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm bg-blue-500">
            {isAi ? (
              <span className="text-2xl">🤖</span>
            ) : (
              <span className="text-white font-semibold text-lg">
                {contact.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Online indicator for AI */}
          {isAi && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
          )}
          {/* Unread badge for non-AI */}
          {!isAi && contact.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{contact.name}</span>
            {/* Bot badge */}
            {isAi && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded border border-blue-100">
                Bot
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{displayMessage}</p>
        </div>

        {/* Time */}
        <div className="text-xs text-gray-400 flex-shrink-0">
          {contact.lastMessageTime || getCurrentTime()}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed bottom-0 right-0 z-40 bg-transparent pointer-events-none"
      style={{ left: SIDEBAR_WIDTH }}
    >
      <div className="w-full pl-8 pr-12 py-4 pointer-events-auto">
        <div
          className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
          onClick={handleBarClick}
        >

          {/* --- Upper Section --- */}
          {isSummaryView && <SummaryView />}
          {isSingleUnreadView && <SingleContactView contact={primaryContact} />}
          {isEmptyState && <SingleContactView contact={AI_ASSISTANT_CONTACT} />}

          {/* --- Bottom Section (Quick Reply / Action Button) --- */}
          <form
            onSubmit={(e) => { e.preventDefault(); }}
            className={`px-4 py-3 bg-gray-50 flex items-center gap-3 ${isSummaryView ? 'cursor-pointer' : ''}`}
            onClick={isSummaryView ? onToggle : (e) => e.stopPropagation()}
          >

             <div className="relative flex-1">
               {isSummaryView ? (
                  <button
                    type="button"
                    className="w-full text-left bg-blue-50 border border-blue-100 text-blue-700 font-medium text-sm rounded-lg pl-3 pr-4 py-2.5 hover:bg-blue-100 transition-all shadow-sm flex items-center justify-between pointer-events-none"
                  >
                    <span>Open inbox to reply...</span>
                    <Inbox size={16} />
                  </button>
               ) : (
                  <input
                    value={quickReplyText}
                    onChange={(e) => setQuickReplyText(e.target.value)}
                    placeholder={getInputPlaceholder()}
                    className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
               )}
             </div>

             {/* Send button (only show when not in summary view) */}
             {!isSummaryView && quickReplyText.trim() && (
               <button
                 type="submit"
                 className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
               >
                 <Send size={18} />
               </button>
             )}

             <div className="h-6 w-px bg-gray-200 mx-1"></div>

             <button
               type="button"
               onClick={(e) => {
                 e.stopPropagation();
                 onToggle();
               }}
               className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
               title={isOpen ? "Close chat" : "Open chat"}
             >
               <Maximize2 size={18} />
             </button>
          </form>

        </div>
      </div>
    </div>
  );
}
