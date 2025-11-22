"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ChatList } from "./chat-list";
import { ChatBox } from "./chat-box";
import { cn } from "@/lib/utils";

const SIDEBAR_WIDTH = 256;
const OVERLAY_HEIGHT = 500;
const OVERLAY_BOTTOM_OFFSET = 88; // відстань до input bar, можна підкрутити

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onCreateChat: () => void;
  currentUserId?: string;
  currentUserName?: string;
  organizationId?: string;
  onChatDeleted?: (chatId: string) => void;
  refreshTrigger?: number;
}

export function ChatOverlay({
  isOpen,
  onClose,
  activeChatId,
  onChatSelect,
  onCreateChat,
  currentUserId,
  currentUserName,
  organizationId,
  onChatDeleted,
  refreshTrigger,
}: ChatOverlayProps) {
  // ESC для закриття
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Лочимо скрол, коли overlay відкритий
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "unset";
    };
  }, [isOpen]);

  return (
    <div
      className={cn(
        "fixed right-0 z-50 transition-transform duration-300 ease-out",
        isOpen ? "translate-y-0" : "translate-y-[calc(100%+120px)]"
      )}
      style={{
        left: SIDEBAR_WIDTH,      // так само як input bar
        bottom: OVERLAY_BOTTOM_OFFSET,
      }}
      onClick={onClose} // Click backdrop to close
    >
      {/* ТА САМА сітка, що й у ChatInputBar / Dashboard:
          спочатку горизонтальний padding, потім max-w-6xl mx-auto */}
      <div className="px-8">
        <div className="max-w-6xl mx-auto">
          <div
            className="bg-background rounded-2xl border border-border flex flex-col overflow-hidden"
            style={{ height: OVERLAY_HEIGHT }}
            onClick={(e) => e.stopPropagation()} // Don't close when clicking inside panel
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Messages</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-1">
              {/* Список чатів */}
              <div className="w-[300px] border-r overflow-y-auto overflow-x-hidden">
                <ChatList
                  activeChatId={activeChatId || undefined}
                  onChatSelect={onChatSelect}
                  onCreateChat={onCreateChat}
                  currentUserId={currentUserId}
                  onChatDeleted={onChatDeleted}
                  compact
                  refreshTrigger={refreshTrigger}
                />
              </div>

              {/* Вміст чату */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {activeChatId &&
                currentUserId &&
                currentUserName &&
                organizationId ? (
                  <ChatBox
                    chatId={activeChatId}
                    userId={currentUserId}
                    userName={currentUserName}
                    organizationId={organizationId}
                  />
                ) : (
                  <div className="flex flex-1 items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p className="mb-2 text-lg">No chat selected</p>
                      <p className="text-sm">Select a chat from the list</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
