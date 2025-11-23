"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, MessageCircle, User, Users, Trash2 } from "lucide-react";
import { io } from "socket.io-client";
import { DeleteChatDialog } from "./delete-chat-dialog";
import { API_URL, SOCKET_URL } from "@/config/api";
import { apiFetch } from "@/lib/api";

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

interface OrganizationUser {
  id: string;
  name: string;
  email: string;
}

interface ChatListProps {
  activeChatId?: string;
  onChatSelect: (chatId: string) => void;
  onCreateChat: () => void;
  onRefresh?: () => void;
  currentUserId?: string;
  onChatDeleted?: (chatId: string) => void;
  compact?: boolean; // For smaller padding in overlay mode
  refreshTrigger?: number; // Increment this to trigger a refresh
}

export function ChatList({ activeChatId, onChatSelect, onCreateChat, onRefresh, currentUserId, onChatDeleted, compact = false, refreshTrigger }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);

  // Use ref to track current activeChatId to avoid stale closure in socket listener
  const activeChatIdRef = useRef(activeChatId);

  // Update ref whenever activeChatId changes
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
    console.log('🔄 ChatList: activeChatIdRef updated to:', activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    loadChats();
    loadOrganizationUsers();

    const socket = io(SOCKET_URL);

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

  // Refresh chats when refreshTrigger changes (e.g., after creating a new chat)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('🔄 ChatList: Refresh trigger changed, reloading chats');
      loadChats();
      loadOrganizationUsers();
    }
  }, [refreshTrigger]);

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
      const data = await apiFetch(`${API_URL}/api/chat/list`);
      setChats(data);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationUsers = async () => {
    try {
      const data = await apiFetch(`${API_URL}/api/users/organization`);
      // Filter out current user
      const otherUsers = data.filter((user: OrganizationUser) => user.id !== currentUserId);
      setOrganizationUsers(otherUsers);
    } catch (error) {
      console.error("Failed to load organization users:", error);
    }
  };

  const createOrGetDirectChat = async (userId: string) => {
    try {
      const data = await apiFetch(`${API_URL}/api/chat/direct/${userId}`, {
        method: "POST",
      });
      // Refresh chat list to include the new/existing chat
      await loadChats();
      // Select the chat
      onChatSelect(data.chatId);
    } catch (error) {
      console.error("Failed to create/get direct chat:", error);
    }
  };

  const handleDeleteClick = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent chat selection
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!chatToDelete) return;

    try {
      await apiFetch(`${API_URL}/api/chat/${chatToDelete.id}`, {
        method: "DELETE",
      });

      // Remove chat from local state
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatToDelete.id));

      // Notify parent if this was the active chat
      if (onChatDeleted && chatToDelete.id === activeChatId) {
        onChatDeleted(chatToDelete.id);
      }

      console.log('✅ Chat deleted successfully:', chatToDelete.id);
    } catch (error) {
      console.error("Failed to delete chat:", error);
      throw error; // Re-throw to let dialog handle error display
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

  // Separate direct and group chats
  const directChats = chats.filter(chat => chat.type === 'direct');
  const groupChats = chats.filter(chat => chat.type !== 'direct');

  // Helper: Get direct chat for a specific user
  const getDirectChatForUser = (userId: string): Chat | undefined => {
    return directChats.find(chat => {
      const otherUser = chat.members.find(m => m.user.id !== currentUserId);
      return otherUser?.user.id === userId;
    });
  };

  // Helper: Get unread count for a user's direct chat
  const getUnreadCountForUser = (userId: string): number => {
    const chat = getDirectChatForUser(userId);
    return chat?.unreadCount ?? 0;
  };

  // Create unified list: chats with messages first (by time), then users without chats (alphabetically)

  // 1. Get all chats (direct + group) sorted by last message time
  const chatsWithMessages = [...chats].sort((a, b) => {
    const aLastMessage = a.messages[0];
    const bLastMessage = b.messages[0];

    if (!aLastMessage && !bLastMessage) return 0;
    if (!aLastMessage) return 1;
    if (!bLastMessage) return -1;

    return new Date(bLastMessage.createdAt).getTime() - new Date(aLastMessage.createdAt).getTime();
  });

  // 2. Get users who don't have existing direct chats, sorted alphabetically
  const usersWithoutChats = organizationUsers
    .filter(user => !getDirectChatForUser(user.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  // 3. Create unified list items
  type ListItem =
    | { type: 'chat'; data: Chat }
    | { type: 'user'; data: OrganizationUser };

  const unifiedList: ListItem[] = [
    ...chatsWithMessages.map(chat => ({ type: 'chat' as const, data: chat })),
    ...usersWithoutChats.map(user => ({ type: 'user' as const, data: user })),
  ];

  if (loading) {
    return (
      <div className="w-80 border-r bg-muted/10 p-4">
        <div className="text-sm text-muted-foreground">Loading chats...</div>
      </div>
    );
  }

  // Render individual user item for Direct Messages section
  const renderUserItem = (user: OrganizationUser) => {
    const online = onlineUsers.includes(user.id);
    const unreadCount = getUnreadCountForUser(user.id);
    const existingChat = getDirectChatForUser(user.id);
    const isActive = existingChat?.id === activeChatId;

    return (
      <button
        key={user.id}
        onClick={() => createOrGetDirectChat(user.id)}
        className={`w-full text-left hover:bg-muted/50 transition-colors ${
          compact ? "p-3" : "p-4"
        } ${isActive ? "bg-muted border-l-4 border-primary" : ""}`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
            {/* Online status indicator */}
            {online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={`text-sm truncate ${unreadCount > 0 ? "font-bold" : "font-semibold"}`}>
                {user.name}
              </h3>
              {unreadCount > 0 && (
                <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {online ? (
                <span className="text-green-600 font-medium">🟢 Online</span>
              ) : (
                <span>Offline</span>
              )}
            </p>
          </div>
        </div>
      </button>
    );
  };

  // Render individual chat item
  const renderChatItem = (chat: Chat) => {
    const lastMessage = chat.messages[0];
    const isActive = chat.id === activeChatId;
    const displayName = getChatDisplayName(chat);
    const isDirect = chat.type === 'direct';
    const otherUserId = getOtherUserId(chat);
    const online = isUserOnline(otherUserId);

    return (
      <div
        key={chat.id}
        className={`relative group w-full ${
          isActive ? "bg-muted border-l-4 border-primary" : ""
        }`}
      >
        <button
          onClick={() => onChatSelect(chat.id)}
          className={`w-full text-left hover:bg-muted/50 transition-colors ${
            compact ? "p-3 pr-16" : "p-4 pr-18"
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

      {/* Delete Button - Shows on hover */}
      <button
        onClick={(e) => handleDeleteClick(chat, e)}
        className="absolute top-4 right-4 p-2 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Delete chat"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
    );
  };

  // 🔍 DEBUG LOGGING - Find duplicate users bug
  console.log('🔍 ChatList Debug:');
  console.log('- Chats:', chats.length, chats.map(c => ({ id: c.id, name: c.name || 'Direct', type: c.type })));
  console.log('- Organization users:', organizationUsers.length, organizationUsers.map(u => ({ id: u.id, name: u.name })));
  console.log('- Direct chats:', directChats.length);
  console.log('- Users without chats:', usersWithoutChats.length, usersWithoutChats.map(u => u.name));
  console.log('- Unified list:', unifiedList.length, unifiedList.map(item => ({
    type: item.type,
    name: item.type === 'chat' ? (item.data.name || 'Direct') : item.data.name
  })));

  // Check for duplicates in unified list
  const allNames = unifiedList.map(item =>
    item.type === 'chat'
      ? getChatDisplayName(item.data)
      : item.data.name
  );
  const uniqueNames = [...new Set(allNames)];
  if (allNames.length !== uniqueNames.length) {
    console.error('🔴 DUPLICATE NAMES FOUND:', allNames.filter((name, index) => allNames.indexOf(name) !== index));
  }

  return (
    <div className="w-80 border-r bg-muted/10 flex flex-col h-full">
      {/* Header with Create Button */}
      <div className={`border-b ${compact ? "p-3" : "p-4"}`}>
        <button
          onClick={onCreateChat}
          className={`w-full flex items-center justify-center gap-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ${
            compact ? "py-2 text-sm" : "py-2"
          }`}
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">New Group Chat</span>
        </button>
      </div>

      {/* Unified Chat List - No section headers */}
      <div className="flex-1 overflow-y-auto">
        {unifiedList.length === 0 ? (
          <div className={`text-center text-muted-foreground text-sm ${compact ? "p-3" : "p-4"}`}>
            No chats or users yet
          </div>
        ) : (
          <div className="divide-y">
            {unifiedList.map((item, index) => {
              if (item.type === 'chat') {
                return renderChatItem(item.data);
              } else {
                return renderUserItem(item.data);
              }
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteChatDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setChatToDelete(null);
        }}
        onDelete={handleDeleteConfirm}
        chatName={chatToDelete ? getChatDisplayName(chatToDelete) : null}
      />
    </div>
  );
}