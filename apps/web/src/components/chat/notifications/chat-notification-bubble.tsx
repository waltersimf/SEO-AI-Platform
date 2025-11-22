"use client";

import { X, User } from "lucide-react";
import { useState, useEffect } from "react";

interface ChatNotificationBubbleProps {
  chatId: string;
  senderName: string;
  message: string;
  onClick: (chatId: string) => void;
  onDismiss: () => void;
}

const SIDEBAR_WIDTH = 256;

export function ChatNotificationBubble({
  chatId,
  senderName,
  message,
  onClick,
  onDismiss,
}: ChatNotificationBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    onClick(chatId);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation to complete
  };

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
      style={{
        left: '280px',
        bottom: '80px',
      }}
    >
      <div
        onClick={handleClick}
        className="inline-flex items-center gap-3 px-4 py-3 bg-muted hover:bg-muted/90 rounded-xl cursor-pointer transition-colors shadow-sm border border-border/50 max-w-md"
      >
        {/* Avatar */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{senderName}</p>
          <p className="text-xs text-muted-foreground truncate">{message}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-9 h-9 rounded-md hover:bg-background flex items-center justify-center transition-colors"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
