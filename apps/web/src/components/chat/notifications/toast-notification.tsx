"use client";

import { X, MessageCircle } from "lucide-react";

export interface ToastNotificationProps {
  id: string;
  chatId: string;
  chatName: string;
  message: string;
  authorName: string;
  onClose: () => void;
  onClick: () => void;
}

export function ToastNotification({
  id: _id,
  chatId: _chatId,
  chatName,
  message,
  authorName,
  onClose,
  onClick,
}: ToastNotificationProps) {
  return (
    <div
      className="flex items-start gap-3 p-4 bg-background border rounded-lg shadow-lg max-w-sm cursor-pointer hover:bg-muted/50 transition-colors animate-in slide-in-from-right duration-300"
      onClick={onClick}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
        <MessageCircle className="h-5 w-5 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{chatName}</p>
            <p className="text-xs text-muted-foreground truncate">{authorName}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
        title="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
