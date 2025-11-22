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
      className={`fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-out ${
        isVisible
          ? "bottom-24 opacity-100"
          : "bottom-16 opacity-0 pointer-events-none"
      }`}
    >
      <div
        onClick={handleClick}
        className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-full shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200 max-w-md"
      >
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-sm font-bold truncate">{senderName}</p>
          <p className="text-xs text-muted-foreground truncate">{message}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
