'use client';

import { ChevronUp, ChevronDown, MessageCircle, Inbox } from "lucide-react";

interface ChatInputBarProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
  unreadChats?: Array<{id: string, name: string, unreadCount: number}>;
}

const SIDEBAR_WIDTH = 256;

export function ChatInputBar({
  isOpen,
  onToggle,
  unreadCount = 0,
  unreadChats = []
}: ChatInputBarProps) {
  
  // Check if multiple unread senders
  const hasMultipleUnread = unreadChats.length > 1;
  
  // Format sender list "AI, George, +1 more"
  const formatSenderList = () => {
    if (unreadChats.length === 0) return '';
    if (unreadChats.length === 1) return unreadChats[0].name;
    if (unreadChats.length === 2) {
      return `${unreadChats[0].name}, ${unreadChats[1].name}`;
    }
    
    // 3+ senders: "AI, George, +X more"
    const firstTwo = unreadChats.slice(0, 2).map(c => c.name).join(', ');
    const remaining = unreadChats.length - 2;
    return `${firstTwo}, +${remaining} more`;
  };

  return (
    <div
      className="fixed bottom-0 right-0 z-40 bg-transparent pointer-events-none"
      style={{ left: SIDEBAR_WIDTH }}
    >
      <div className="w-full pl-8 pr-12 py-4 pointer-events-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* IF multiple unread - show inbox summary */}
          {hasMultipleUnread ? (
            <div
              onClick={onToggle}
              className="flex items-center gap-3 px-4 py-3 bg-muted hover:bg-muted/90 rounded-lg cursor-pointer transition-colors shadow-sm border border-border/50"
            >
              {/* Inbox icon with badge */}
              <div className="relative">
                <Inbox className="h-5 w-5 text-blue-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              </div>
              
              {/* Text content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  📬 {unreadCount} New Message{unreadCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  <span className="font-medium">From: </span>
                  <span className="font-semibold text-gray-800">{formatSenderList()}</span>
                </p>
              </div>

              {/* Expand button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="flex items-center justify-center w-9 h-9 rounded-md text-primary bg-background hover:bg-muted transition-colors"
                title="Open inbox"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
            </div>
          ) : (
            /* ELSE - show normal input */
            <div
              className="relative flex items-center gap-3 px-4 py-2.5 bg-muted hover:bg-muted/90 rounded-lg cursor-pointer transition-colors shadow-sm border border-border/50"
              onClick={() => !isOpen && onToggle()}
            >
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              
              <input
                type="text"
                placeholder="Type message..."
                className="flex-1 bg-transparent outline-none text-sm pointer-events-none text-muted-foreground"
                readOnly
              />

              {/* Unread badge */}
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 h-6 rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}

              {/* Toggle button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="flex items-center justify-center w-9 h-9 rounded-md text-primary bg-background hover:bg-muted transition-colors"
                title={isOpen ? "Close chat" : "Open chat"}
              >
                {isOpen ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}