"use client";

import { useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import { ChatList } from "./chat-list";
import { ChatBox } from "./chat-box";
import { cn } from "@/lib/utils";

const SIDEBAR_WIDTH = 256;
const OVERLAY_HEIGHT = 500;
const OVERLAY_BOTTOM_OFFSET = 88;

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
        "fixed right-0 z-50 transition-transform duration-300 ease-out pointer-events-none",
        isOpen ? "translate-y-0" : "translate-y-[calc(100%+120px)]"
      )}
      style={{
        left: SIDEBAR_WIDTH,
        bottom: OVERLAY_BOTTOM_OFFSET,
      }}
      onClick={onClose} // Click backdrop to close
    >
      {/* 
         pl-8 (32px) зліва, pr-12 (48px) справа.
         Різниця 16px компенсує ширину скролбара сторінки.
      */}
      <div className="w-full pl-8 pr-12 pointer-events-auto">
        
        <div className="max-w-6xl mx-auto">
          <div
            className="bg-background rounded-2xl border border-border flex flex-col overflow-hidden shadow-xl"
            style={{ height: OVERLAY_HEIGHT }}
            onClick={(e) => e.stopPropagation()} // Don't close when clicking inside panel
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
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
            <div className="flex flex-1 min-h-0"> 
              {/* Список чатів */}
              <div className="w-[300px] border-r overflow-y-auto overflow-x-hidden bg-muted/10">
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
              <div className="flex flex-1 flex-col overflow-hidden bg-background">
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
                  <div className="flex flex-1 items-center justify-center text-muted-foreground bg-muted/5">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="mb-1 text-lg font-medium">No chat selected</p>
                      <p className="text-sm opacity-70">Select a chat from the list to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}