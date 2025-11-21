"use client";

import { ChevronUp, ChevronDown, MessageCircle } from "lucide-react";

interface ChatInputBarProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
}

export function ChatInputBar({ isOpen, onToggle, unreadCount = 0 }: ChatInputBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t shadow-lg">
      <div className="max-w-[1400px] mx-auto px-8 py-4">
        <div className="flex items-center gap-3">
          {/* Input Area */}
          <div
            onClick={() => !isOpen && onToggle()}
            className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-muted/50 hover:bg-muted/70 rounded-lg cursor-pointer transition-colors"
          >
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Type message..."
              className="flex-1 bg-transparent outline-none text-sm pointer-events-none"
              readOnly
            />
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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
