"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ChatList } from "./chat-list";
import { ChatBox } from "./chat-box";
import { cn } from "@/lib/utils";

const SIDEBAR_WIDTH = 256;

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
  // Handle Escape key to close overlay
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          left: "256px",
          right: 0,
          top: 0,
          bottom: "100px",
          zIndex: 30
        }}
        onClick={onClose}
      />

      {/* Overlay */}
      <div
        className={`fixed bg-background rounded-2xl shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-[calc(100%+120px)]"
        }`}
        style={{
          left: "256px",
          right: 0,
          bottom: "100px",
          height: "500px",
          zIndex: 50
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Messages</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(100%-64px)]">
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
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeChatId && currentUserId && currentUserName && organizationId ? (
              <ChatBox
                chatId={activeChatId}
                userId={currentUserId}
                userName={currentUserName}
                organizationId={organizationId}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg mb-2">No chat selected</p>
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