"use client";

import { useEffect, useState } from "react";
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

type Bounds = {
  left: number;
  width: number;
};

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
  const [bounds, setBounds] = useState<Bounds | null>(null);

  // Зчитуємо розміри input bar
  useEffect(() => {
    function updateBounds() {
      const el = document.getElementById("chat-input-bar");
      if (!el) return;

      const rect = el.getBoundingClientRect();
      setBounds({
        left: rect.left,
        width: rect.width,
      });
    }

    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, []);

  // Закриття по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Лочимо скрол тіла, коли overlay відкритий
  useEffect(() => {
    if (!isOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "unset";
    };
  }, [isOpen]);

  // Фолбек, якщо bounds ще не встигли порахуватися
  const left = bounds?.left ?? SIDEBAR_WIDTH;
  const width = bounds?.width ?? window.innerWidth - SIDEBAR_WIDTH;

  return (
    <>
      {/* Backdrop тільки над контентом справа від sidebar */}
      <div
        className={cn(
          "fixed bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{
          left,
          width,
          top: 0,
          bottom: OVERLAY_BOTTOM_OFFSET,
          zIndex: 40,
        }}
        onClick={onClose}
      />

      {/* Саме вікно чату */}
      <div
        className={cn(
          "fixed bg-background rounded-2xl shadow-2xl transition-transform duration-300 ease-out overflow-hidden flex flex-col",
          isOpen ? "translate-y-0" : "translate-y-[calc(100%+120px)]"
        )}
        style={{
          left,
          width,
          bottom: OVERLAY_BOTTOM_OFFSET,
          height: OVERLAY_HEIGHT,
          zIndex: 50,
        }}
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
            />
          </div>

          {/* Вміст чату */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {activeChatId && currentUserId && currentUserName && organizationId ? (
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
    </>
  );
}
