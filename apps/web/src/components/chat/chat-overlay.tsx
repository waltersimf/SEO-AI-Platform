"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
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
    // ВИПРАВЛЕНА СІТКА (Overlay):
    // 1. inset-0 - займає весь екран (для backdrop)
    // 2. md:left-64 - зсув контенту вправо на ширину сайдбару
    // 3. justify-center - центрування контейнера
    <div 
      className={cn(
        "fixed inset-0 z-50 flex flex-col justify-end items-center md:pl-64 pointer-events-none transition-all duration-300 ease-in-out",
        isOpen ? "bg-black/20 backdrop-blur-sm pointer-events-auto" : "bg-transparent pointer-events-none"
      )}
      onClick={onClose}
    >
      {/* ВНУТРІШНІЙ КОНТЕЙНЕР:
        w-full max-w-5xl px-8: Це ідентичні параметри, що і в Input Bar.
        Це гарантує, що вікно чату буде мати ТУ Ж САМУ ширину і ТІ Ж САМІ відступи, що і контент сторінки.
      */}
      <div 
        className={cn(
          "w-full max-w-5xl px-8 transition-transform duration-300 ease-in-out pb-0", 
           isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div 
          className="bg-white rounded-t-xl shadow-2xl border border-gray-200 flex flex-col w-full overflow-hidden"
          style={{ height: WINDOW_HEIGHT }}
          onClick={(e) => e.stopPropagation()} 
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex flex-1 overflow-hidden bg-white"> 
            
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-gray-100 bg-gray-50 flex flex-col">
               <ChatList
                  activeChatId={activeChatId || undefined}
                  onChatSelect={onChatSelect}
                  onCreateChat={onCreateChat}
                  currentUserId={currentUserId}
                  onChatDeleted={onChatDeleted}
                  compact={true} 
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
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <span className="text-4xl mb-2">👋</span>
                  <p className="font-medium">Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}