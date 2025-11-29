"use client";

import { useEffect } from "react";
import { X, MessageSquare } from "lucide-react";
import { ChatList } from "./chat-list";
import { ChatBox } from "./chat-box";
import { cn } from "@/lib/utils";

const WINDOW_HEIGHT = 600;

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
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* BACKDROP: Невидимий шар (z-30) на весь екран.
        Він перекриває контент сайту, але лежить ПІД ChatInputBar (який має z-40) 
        і ПІД самим вікном чату (z-50).
      */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-transparent"
          onClick={onClose}
        />
      )}

      {/* WINDOW CONTAINER */}
      <div
        className={cn(
          "fixed left-64 right-0 bottom-[90px] z-50 px-6 pointer-events-none transition-all duration-300 ease-out",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        )}
      >
        <div className={cn("w-full", isOpen && "pointer-events-auto")}>
          <div 
            className="bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col w-full overflow-hidden"
            style={{ height: WINDOW_HEIGHT }}
            // Зупиняємо спливання кліку, щоб клік по самому вікну не закривав його
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-2">
                 <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <MessageSquare size={20} />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-gray-900">Messages</h2>
                    <p className="text-xs text-gray-500">Real-time collaboration</p>
                 </div>
              </div>
              
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex flex-1 overflow-hidden bg-white"> 
              
              {/* Sidebar List */}
              <div className="w-80 border-r border-gray-100 bg-gray-50/50 flex flex-col shrink-0">
                 <ChatList
                    activeChatId={activeChatId || undefined}
                    onChatSelect={onChatSelect}
                    onCreateChat={onCreateChat}
                    currentUserId={currentUserId}
                    onChatDeleted={onChatDeleted}
                    compact={false} 
                    refreshTrigger={refreshTrigger}
                  />
              </div>

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                {activeChatId && currentUserId && currentUserName && organizationId ? (
                  <ChatBox
                    chatId={activeChatId}
                    userId={currentUserId}
                    userName={currentUserName}
                    organizationId={organizationId}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/30">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <span className="text-4xl">👋</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">Welcome to Chat</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-xs text-center">
                      Select a conversation from the sidebar or start a new group chat.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}