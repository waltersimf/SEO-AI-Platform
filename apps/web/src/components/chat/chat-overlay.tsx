"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ChatList } from "./chat-list";
import { ChatBox } from "./chat-box";
import { cn } from "@/lib/utils";

const SIDEBAR_WIDTH = 256;
const OVERLAY_BOTTOM_OFFSET = 100; // висота input bar
const OVERLAY_HEIGHT = 500;

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
    <>
      {/* Backdrop тільки над контентом, не над sidebar і не над input bar */}
      <div
        className={cn(
          "fixed bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{
          left: SIDEBAR_WIDTH,
          right: 0,
          top: 0,
          bottom: OVERLAY_BOTTOM_OFFSET,
          zIndex: 40,
        }}
        onClick={onClose}
      />

      {/* ROOT overlay — така ж область, як у ChatInputBar */}
      <div
        className={cn(
          "fixed bottom-[100px] right-0 z-50 transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-[calc(100%+120px)]"
        )}
        style={{
          left: SIDEBAR_WIDTH,
        }}
      >
        {/* 🔥 ТА САМА ОБГОРТКА, ЩО В ChatInputBar */}
        <div className="max-w-[1600px] mx-auto px-8">
          {/* Біла панель чату */}
          <div className="bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: OVERLAY_HEIGHT }}>
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
        {/* /max-w-[1600px] mx-auto px-8 */}
      </div>
    </>
  );
}