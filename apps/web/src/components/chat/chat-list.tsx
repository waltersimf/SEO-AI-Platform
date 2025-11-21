"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, MessageCircle, User, Users } from "lucide-react";
import { io } from "socket.io-client";

interface Chat {
  id: string;
  name: string | null;
  type?: string;
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
  currentUserId?: string;
}

export function ChatList({ activeChatId, onChatSelect, onCreateChat, onRefresh, currentUserId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Use ref to track current activeChatId to avoid stale closure in socket listener
  const activeChatIdRef = useRef(activeChatId);

  // Update ref whenever activeChatId changes
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
    console.log('🔄 ChatList: activeChatIdRef updated to:', activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    loadChats();

    const socket = io("http://localhost:4000");

    // Debug: Log when socket connects
    socket.on('connect', () => {
      console.log('🔌 ChatList: Socket connected, ID:', socket.id);

      // Join organization room to receive new_message events
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🏢 ChatList: Joining organization room:', payload.organizationId);
          socket.emit('join_organization', payload.organizationId);
        } catch (error) {
          console.error('❌ ChatList: Failed to parse token for organization join:', error);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 ChatList: Socket disconnected');
    });

    // Listen for new messages to update unread counts in real-time
    socket.on("new_message", (message: any) => {
      console.log('📨 ChatList: New message received:', {
        messageId: message.id,
        chatId: message.chatId,
        content: message.content?.substring(0, 50),
        activeChatId: activeChatIdRef.current,
      });

      // If message is for a different chat than the active one, increment unread count locally
      if (message.chatId !== activeChatIdRef.current) {
        console.log('➕ ChatList: Incrementing unread count for chatId:', message.chatId);
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat.id === message.chatId) {
              const newUnreadCount = (chat.unreadCount ?? 0) + 1;
              console.log(`📊 ChatList: Chat "${chat.name}" unread count: ${chat.unreadCount ?? 0} → ${newUnreadCount}`);
              return { ...chat, unreadCount: newUnreadCount };
            }
            return chat;
          });
          return updatedChats;
        });
      } else {
        console.log('⏭️ ChatList: Message is for active chat, skipping unread increment');
      }
    });

    socket.on("refresh_chat_list", () => {
      console.log('🔔 ChatList: Received refresh_chat_list event');
      loadChats(); // Refresh to update unread counts
    });

    // Listen for online users updates
    const handleOnlineUsersChanged = (event: any) => {
      setOnlineUsers(event.detail?.userIds || []);
    };

    window.addEventListener('online_users_changed', handleOnlineUsersChanged);

    return () => {
      console.log('🧹 ChatList: Cleaning up socket connection');
      socket.disconnect();
      window.removeEventListener('online_users_changed', handleOnlineUsersChanged);
    };
  }, []); // Remove activeChatId from dependencies - use ref instead!

  // Expose loadChats to parent via onRefresh callback
  useEffect(() => {
    if (onRefresh) {
      // Store loadChats function for parent to call
      (window as any).refreshChatList = loadChats;
    }
  }, [onRefresh]);

  // Reset unread count locally when a chat becomes active
  useEffect(() => {
    if (activeChatId) {
      console.log('🎯 ChatList: Active chat changed to:', activeChatId);
      setChats(prevChats =>
        prevChats.map(chat => {
          if (chat.id === activeChatId && (chat.unreadCount ?? 0) > 0) {
            console.log(`🔄 ChatList: Resetting unread count for chat "${chat.name}" from ${chat.unreadCount} to 0`);
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        })
      );
    }
  }, [activeChatId]);

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

  // Helper: Get chat display name
  const getChatDisplayName = (chat: Chat): string => {
    if (chat.type === 'direct') {
      // For direct chats, find the other user (not current user)
      const otherUser = chat.members.find(m => m.user.id !== currentUserId);
      return otherUser?.user.name || 'Unknown User';
    }
    // For group chats, use the chat name
    return chat.name || 'Unnamed Chat';
  };

  // Helper: Get other user ID for direct chat
  const getOtherUserId = (chat: Chat): string | null => {
    if (chat.type === 'direct') {
      const otherUser = chat.members.find(m => m.user.id !== currentUserId);
      return otherUser?.user.id || null;
    }
    return null;
  };

  // Helper: Check if user is online
  const isUserOnline = (userId: string | null): boolean => {
    if (!userId) return false;
    return onlineUsers.includes(userId);
  };

  // Separate chats into direct and group
  const directChats = chats.filter(chat => chat.type === 'direct');
  const groupChats = chats.filter(chat => chat.type !== 'direct');

  if (loading) {
    return (
      <div className="w-80 border-r bg-muted/10 p-4">
        <div className="text-sm text-muted-foreground">Loading chats...</div>
      </div>
    );
  }

  // Render individual chat item
  const renderChatItem = (chat: Chat) => {
    const lastMessage = chat.messages[0];
    const isActive = chat.id === activeChatId;
    const displayName = getChatDisplayName(chat);
    const isDirect = chat.type === 'direct';
    const otherUserId = getOtherUserId(chat);
    const online = isUserOnline(otherUserId);

    return (
      <button
        key={chat.id}
        onClick={() => onChatSelect(chat.id)}
        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${isActive ? "bg-muted border-l-4 border-primary" : ""
          }`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            {isDirect ? (
              <User className="h-5 w-5 text-primary" />
            ) : (
              <Users className="h-5 w-5 text-primary" />
            )}
            {/* Online status indicator for direct chats */}
            {isDirect && online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>

          {/* Chat Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className={`text-sm truncate ${(chat.unreadCount ?? 0) > 0 ? "font-bold" : "font-semibold"
                  }`}>
                  {displayName}
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

            {/* Members count (group chats only) or online status (direct chats) */}
            {isDirect ? (
              <p className="text-xs text-muted-foreground mt-1">
                {online ? (
                  <span className="text-green-600 font-medium">🟢 Online</span>
                ) : (
                  <span>Offline</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                {chat.members.length} member{chat.members.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="w-80 border-r bg-muted/10 flex flex-col">
      {/* Header with Create Button */}
      <div className="p-4 border-b">
        <button
          onClick={onCreateChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">New Group Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No chats yet. Start a conversation!
          </div>
        ) : (
          <>
            {/* Direct Messages Section */}
            {directChats.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-muted/30">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Direct Messages
                  </h3>
                </div>
                <div className="divide-y">
                  {directChats.map(renderChatItem)}
                </div>
              </div>
            )}

            {/* Group Chats Section */}
            {groupChats.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-muted/30">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Group Chats
                  </h3>
                </div>
                <div className="divide-y">
                  {groupChats.map(renderChatItem)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}