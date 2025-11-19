"use client";

import { useEffect, useState } from "react";
import { Plus, MessageCircle } from "lucide-react";
import { io } from "socket.io-client";

interface Chat {
  id: string;
  name: string;
  unreadCount?: number;
  members: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  messages: {
    content: string;
    createdAt: string;
    author: {
      name: string;
    };
  }[];
}

interface ChatListProps {
  activeChatId?: string;
  onChatSelect: (chatId: string) => void;
  onCreateChat: () => void;
  onRefresh?: () => void;
}

export function ChatList({ activeChatId, onChatSelect, onCreateChat, onRefresh }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();

    // Listen for new messages to update unread counts
    const socket = io("http://localhost:4000");

    socket.on("new_message", () => {
      loadChats(); // Reload to get updated unread counts
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Expose loadChats to parent via onRefresh callback
  useEffect(() => {
    if (onRefresh) {
      // Store loadChats function for parent to call
      (window as any).refreshChatList = loadChats;
    }
  }, [onRefresh]);

  const loadChats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/chat/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-80 border-r bg-muted/10 p-4">
        <div className="text-sm text-muted-foreground">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-muted/10 flex flex-col">
      {/* Header with Create Button */}
      <div className="p-4 border-b">
        <button
          onClick={onCreateChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No chats yet. Create your first chat!
          </div>
        ) : (
          <div className="divide-y">
            {chats.map((chat) => {
              const lastMessage = chat.messages[0];
              const isActive = chat.id === activeChatId;

              return (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                    isActive ? "bg-muted border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className={`text-sm truncate ${
                            (chat.unreadCount ?? 0) > 0 ? "font-bold" : "font-semibold"
                          }`}>
                            {chat.name}
                          </h3>
                          {(chat.unreadCount ?? 0) > 0 && (
                            <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                        {lastMessage && (
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            {new Date(lastMessage.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        )}
                      </div>

                      {/* Last Message Preview */}
                      {lastMessage && lastMessage.author ? (
                        <p className="text-xs text-muted-foreground truncate">
                          {lastMessage.author.name}: {lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No messages yet
                        </p>
                      )}

                      {/* Members count */}
                      <p className="text-xs text-muted-foreground mt-1">
                        {chat.members.length} member{chat.members.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}