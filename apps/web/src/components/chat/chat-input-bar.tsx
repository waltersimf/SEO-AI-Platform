"use client";

import { ChevronUp, ChevronDown, MessageCircle } from "lucide-react";

interface ChatInputBarProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
}

export function ChatInputBar({ isOpen, onToggle, unreadCount = 0 }: ChatInputBarProps) {
  return (
    <div
            className="fixed bottom-0 right-0 z-40"
      style={{ left: "256px" }}
    >
      <div 
      id="chat-input-bar"
      className="max-w-[1600px] mx-auto px-8 py-4">
        {/* Single container with button inside */}
        <div
          className="relative flex items-center gap-3 px-4 py-2.5 bg-muted hover:bg-muted/90 rounded-lg cursor-pointer transition-colors"
          onClick={() => !isOpen && onToggle()}
        >
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Type message..."
            className="flex-1 bg-transparent outline-none text-sm pointer-events-none"
            readOnly
          />

          {/* Unread badge (if any) */}
          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* Toggle button - INSIDE input field */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            title={isOpen ? "Close chat" : "Open chat"}
          >
            {isOpen ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
