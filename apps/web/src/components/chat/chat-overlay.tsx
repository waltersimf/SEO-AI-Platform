"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ChatList } from "./chat-list";
import { ChatBox } from "./chat-box";

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
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Overlay - Starts from bottom 0, translates up to 80px when open */}
      <div
        className={`fixed left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-[-80px]" : "translate-y-full"
        }`}
        style={{
          bottom: "0",
          height: "calc(100vh - 80px)",
          maxHeight: "700px"
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

        {/* Content - Split Layout */}
        <div className="flex h-[calc(100%-64px)]">
          {/* Chat List - Left Side (300px) */}
          <div className="w-[300px] border-r">
            <ChatList
              activeChatId={activeChatId || undefined}
              onChatSelect={onChatSelect}
              onCreateChat={onCreateChat}
              currentUserId={currentUserId}
              onChatDeleted={onChatDeleted}
              compact
            />
          </div>

          {/* Active Chat - Right Side */}
          <div className="flex-1 flex flex-col">
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
                  <p className="text-sm">Select a chat from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
