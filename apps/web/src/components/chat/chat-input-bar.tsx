"use client";

import { ChevronUp, ChevronDown, MessageCircle } from "lucide-react";

interface ChatInputBarProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
}

const SIDEBAR_WIDTH = 256;

export function ChatInputBar({
  isOpen,
  onToggle,
  unreadCount = 0,
}: ChatInputBarProps) {
  return (
    <div
      className="fixed bottom-0 right-0 z-40"
      style={{ left: SIDEBAR_WIDTH }}
    >
      <div
      id="chat-input-bar"
      className="max-w-6xl mx-auto px-8 py-4">
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

            <input
              type="text"
              placeholder="Type message..."
              className="flex-1 bg-transparent outline-none text-sm pointer-events-none text-muted-foreground"
              readOnly
            />

          {/* бейдж непрочитаних (якщо є) */}
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 h-6 rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}

          {/* кнопка згортання/розгортання */}
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
      </div>
    </div>
  );
}
