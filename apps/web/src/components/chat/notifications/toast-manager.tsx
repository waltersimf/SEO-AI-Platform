"use client";

import { useState, useCallback } from "react";
import { ToastNotification } from "./toast-notification";

interface Toast {
  id: string;
  chatId: string;
  chatName: string;
  message: string;
  authorName: string;
}

interface ToastManagerProps {
  onToastClick: (chatId: string) => void;
}

export function ToastManager({ onToastClick }: ToastManagerProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add new toast (max 3 toasts)
  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => {
      // Check if toast for this message already exists
      if (prev.find((t) => t.id === toast.id)) {
        return prev;
      }

      // Keep only last 3 toasts
      const newToasts = [toast, ...prev].slice(0, 3);
      return newToasts;
    });
  }, []);

  // Remove toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle toast click
  const handleToastClick = useCallback(
    (chatId: string, toastId: string) => {
      onToastClick(chatId);
      removeToast(toastId);
    },
    [onToastClick, removeToast]
  );

  // Expose addToast function globally for socket listeners
  if (typeof window !== "undefined") {
    (window as any).addChatToast = addToast;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastNotification
            id={toast.id}
            chatId={toast.chatId}
            chatName={toast.chatName}
            message={toast.message}
            authorName={toast.authorName}
            onClose={() => removeToast(toast.id)}
            onClick={() => handleToastClick(toast.chatId, toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
