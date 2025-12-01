'use client';

import { useEffect, useState, useRef } from 'react';
import { Search, SlidersHorizontal, Plus, User, Users, Bot } from 'lucide-react';
import { io } from 'socket.io-client';
import { useChatSidebar } from '@/contexts/chat-sidebar-context';
import { API_URL, SOCKET_URL } from '@/config/api';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

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
  avatar?: string;
  isAI?: boolean;
  isOnline?: boolean;
}

interface SidebarChatListProps {
  currentUserId?: string;
  onCreateChat: () => void;
  refreshTrigger?: number;
  compact?: boolean;
}

export function SidebarChatList({
  currentUserId,
  onCreateChat,
  refreshTrigger,
  compact = false,
}: SidebarChatListProps) {
  const { state, selectChat, setTotalUnreadCount } = useChatSidebar();
  const [chats, setChats] = useState<Chat[]>([]);
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const activeChatIdRef = useRef(state.activeChatId);

  useEffect(() => {
    activeChatIdRef.current = state.activeChatId;
  }, [state.activeChatId]);

  useEffect(() => {
    loadChats();
    loadOrganizationUsers();

    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          socket.emit('join_organization', payload.organizationId);
        } catch (error) {
          console.error('Failed to parse token:', error);
        }
      }
    });

    socket.on('new_message', (message: any) => {
      if (message.chatId !== activeChatIdRef.current) {
        setChats(prevChats =>
          prevChats.map(chat => {
            if (chat.id === message.chatId) {
              return { ...chat, unreadCount: (chat.unreadCount ?? 0) + 1 };
            }
            return chat;
          })
        );
      }
    });

    socket.on('refresh_chat_list', () => {
      loadChats();
    });

    const handleOnlineUsersChanged = (event: any) => {
      setOnlineUsers(event.detail?.userIds || []);
    };

    window.addEventListener('online_users_changed', handleOnlineUsersChanged);

    return () => {
      socket.disconnect();
      window.removeEventListener('online_users_changed', handleOnlineUsersChanged);
    };
  }, []);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadChats();
      loadOrganizationUsers();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    if (state.activeChatId) {
      setChats(prevChats =>
        prevChats.map(chat => {
          if (chat.id === state.activeChatId && (chat.unreadCount ?? 0) > 0) {
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        })
      );
    }
  }, [state.activeChatId]);

  // Update total unread count
  useEffect(() => {
    const total = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    setTotalUnreadCount(total);
  }, [chats, setTotalUnreadCount]);

  const loadChats = async () => {
    try {
      const data = await apiFetch(`${API_URL}/api/chat/list`);
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationUsers = async () => {
    try {
      const data = await apiFetch(`${API_URL}/api/users/organization`);
      const otherUsers = data.filter((user: OrganizationUser) => user.id !== currentUserId);
      setOrganizationUsers(otherUsers);
    } catch (error) {
      console.error('Failed to load organization users:', error);
    }
  };

  const createOrGetDirectChat = async (userId: string, userName: string) => {
    try {
      const data = await apiFetch(`${API_URL}/api/chat/direct/${userId}`, {
        method: 'POST',
      });
      await loadChats();
      const user = organizationUsers.find(u => u.id === userId);
      const isOnline = isUserOnline(userId);
      selectChat(data.chatId, userName, isOnline);
    } catch (error) {
      console.error('Failed to create/get direct chat:', error);
    }
  };

  const getChatDisplayName = (chat: Chat): string => {
    if (chat.type === 'direct') {
      const otherUser = chat.members.find(m => m.user.id !== currentUserId);
      return otherUser?.user.name || 'Unknown User';
    }
    return chat.name || 'Unnamed Chat';
  };

  const getOtherUserId = (chat: Chat): string | null => {
    if (chat.type === 'direct') {
      const otherUser = chat.members.find(m => m.user.id !== currentUserId);
      return otherUser?.user.id || null;
    }
    return null;
  };

  const isUserAI = (userId: string | null): boolean => {
    if (!userId) return false;
    const user = organizationUsers.find(u => u.id === userId);
    return user?.isAI === true || user?.name === 'AI Assistant';
  };

  const isUserOnline = (userId: string | null): boolean => {
    if (!userId) return false;
    if (isUserAI(userId)) return true;
    return onlineUsers.includes(userId);
  };

  const getDirectChatForUser = (userId: string): Chat | undefined => {
    return chats
      .filter(chat => chat.type === 'direct')
      .find(chat => {
        const otherUser = chat.members.find(m => m.user.id !== currentUserId);
        return otherUser?.user.id === userId;
      });
  };

  // Find the AI user
  const aiUser = organizationUsers.find(u => u.isAI || u.name === 'AI Assistant');

  // Filter and sort chats
  const filteredChats = chats.filter(chat => {
    const name = getChatDisplayName(chat).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // Separate AI chat from regular chats for "Pinned" section
  const aiDirectChat = aiUser ? getDirectChatForUser(aiUser.id) : null;

  const regularChats = filteredChats
    .filter(chat => {
      if (!aiDirectChat) return true;
      return chat.id !== aiDirectChat.id;
    })
    .sort((a, b) => {
      const aLastMessage = a.messages[0];
      const bLastMessage = b.messages[0];
      if (!aLastMessage && !bLastMessage) return 0;
      if (!aLastMessage) return 1;
      if (!bLastMessage) return -1;
      return new Date(bLastMessage.createdAt).getTime() - new Date(aLastMessage.createdAt).getTime();
    });

  // Users without direct chats (excluding AI)
  const usersWithoutChats = organizationUsers
    .filter(user => !user.isAI && user.name !== 'AI Assistant' && !getDirectChatForUser(user.id))
    .filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleChatClick = (chat: Chat) => {
    const name = getChatDisplayName(chat);
    const otherUserId = getOtherUserId(chat);
    const isOnline = isUserOnline(otherUserId);
    selectChat(chat.id, name, isOnline);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getColorClass = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Вчора';
    } else {
      return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-gray-500">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Пошук..."
            className="w-full pl-9 pr-9 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-2">
        <button
          onClick={onCreateChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Новий чат
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {/* Pinned Section - AI Teammate */}
        {(aiUser || aiDirectChat) && (
          <div className="px-3 pt-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-2">
              Закріплені
            </p>
            <button
              onClick={() => {
                if (aiDirectChat) {
                  handleChatClick(aiDirectChat);
                } else if (aiUser) {
                  createOrGetDirectChat(aiUser.id, aiUser.name);
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                state.activeChatId === aiDirectChat?.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-100'
              )}
            >
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">AI Помічник</p>
                  <span className="text-xs text-gray-400">Зараз</span>
                </div>
                <p className="text-xs text-gray-500 truncate">Готовий допомогти...</p>
              </div>
            </button>
          </div>
        )}

        {/* Recent Section */}
        {(regularChats.length > 0 || usersWithoutChats.length > 0) && (
          <div className="px-3 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-2">
              Останні
            </p>

            {/* Chats with messages */}
            {regularChats.map(chat => {
              const lastMessage = chat.messages[0];
              const displayName = getChatDisplayName(chat);
              const isDirect = chat.type === 'direct';
              const otherUserId = getOtherUserId(chat);
              const online = isUserOnline(otherUserId);
              const isActive = state.activeChatId === chat.id;

              return (
                <button
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left mb-1',
                    isActive
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  )}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium',
                        isDirect ? getColorClass(displayName) : 'bg-gray-400'
                      )}
                    >
                      {isDirect ? (
                        getInitials(displayName)
                      ) : (
                        <Users className="w-5 h-5" />
                      )}
                    </div>
                    {isDirect && online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p
                        className={cn(
                          'text-sm truncate',
                          (chat.unreadCount ?? 0) > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                        )}
                      >
                        {displayName}
                      </p>
                      <div className="flex items-center gap-2">
                        {lastMessage && (
                          <span className="text-xs text-gray-400">
                            {formatTime(lastMessage.createdAt)}
                          </span>
                        )}
                        {(chat.unreadCount ?? 0) > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {lastMessage
                        ? `${lastMessage.author?.name || 'Невідомий'}: ${lastMessage.content}`
                        : 'Ще немає повідомлень'}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Users without chats */}
            {usersWithoutChats.map(user => {
              const online = isUserOnline(user.id);

              return (
                <button
                  key={user.id}
                  onClick={() => createOrGetDirectChat(user.id, user.name)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left mb-1"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium',
                        getColorClass(user.name)
                      )}
                    >
                      {getInitials(user.name)}
                    </div>
                    {online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500">
                      {online ? 'Онлайн' : 'Офлайн'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {regularChats.length === 0 && usersWithoutChats.length === 0 && !aiUser && (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-sm text-gray-500 text-center">
              Ще немає розмов.
              <br />
              Почніть новий чат!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
