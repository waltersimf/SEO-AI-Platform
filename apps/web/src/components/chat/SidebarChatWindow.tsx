'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Send, Pencil, Trash2, X, Check, Copy, Reply } from 'lucide-react';
import { initSocket, getSocket } from './socket';
import { TypingIndicator } from './typing-indicator';
import { TaskPreviewCard } from './task-preview-card';
import { AutoPlanPreviewCard } from './auto-plan-preview-card';
import { API_URL } from '@/config/api';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { usePermissions } from '@/hooks/usePermissions';

// Quick emoji reactions
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

// Context menu state interface
interface ContextMenuState {
  messageId: string;
  x: number;
  y: number;
  isOwnMessage: boolean;
  isDeleted: boolean;
  messageContent: string;
}

interface TaskPreviewData {
  type: 'task_preview';
  task: {
    title: string;
    description?: string;
    assigneeId?: string;
    assigneeName?: string;
    projectId?: string;
    projectName?: string;
    dueDate?: string;
    scheduledTime?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    estimatedTime?: number;
    recurrenceRule?: 'daily' | 'weekly' | 'monthly';
    organizationId: string;
  };
  status: 'pending' | 'created';
}

interface AutoPlanPreviewData {
  type: 'auto_plan_preview';
  plan: Array<{
    taskId: string;
    taskTitle: string;
    suggestedDate: string;
    estimatedTime: number;
    priority: string;
    dueDate: string | null;
  }>;
  weeks: Array<{
    weekStart: string;
    weekEnd: string;
    label: string;
  }>;
  summaryByDate: Record<string, number>;
  planStart: string;
  planEnd: string;
  totalTasksPlanned: number;
  totalTasksInBacklog: number;
  unscheduledTasks: Array<{
    taskId: string;
    taskTitle: string;
    estimatedTime: number;
    reason: string;
  }>;
  status: 'pending' | 'applied';
}

interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    name: string;
  };
}

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    isAI?: boolean;
  };
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  reactions?: MessageReaction[];
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    deletedAt?: string;
    author: {
      id: string;
      name: string;
    };
  };
  aiContext?: {
    taskPreview?: TaskPreviewData;
    autoPlanPreview?: AutoPlanPreviewData;
  };
}

interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAI?: boolean;
}

interface SidebarChatWindowProps {
  chatId: string;
  userId: string;
  userName: string;
  organizationId: string;
  recipientName?: string;
}

export function SidebarChatWindow({
  chatId,
  userId,
  userName,
  organizationId,
  recipientName,
}: SidebarChatWindowProps) {
  const { canEdit } = usePermissions();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState<{ userId: string; userName: string } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [mentionDropdownVisible, setMentionDropdownVisible] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [createdTaskIds, setCreatedTaskIds] = useState<Set<string>>(new Set());
  const [appliedPlanIds, setAppliedPlanIds] = useState<Set<string>>(new Set());
  const [dismissedPreviews, setDismissedPreviews] = useState<Set<string>>(new Set());

  // Edit, delete, and reaction states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showEmojiSubmenu, setShowEmojiSubmenu] = useState(false);
  const [emojiSubmenuPosition, setEmojiSubmenuPosition] = useState<'right' | 'left'>('right');

  // Reply state
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    content: string;
    authorName: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true);
  const previousMessageCount = useRef(0);

  // Handle task creation from preview
  const handleTaskCreated = (messageId: string, info: {
    taskId: string;
    title: string;
    assigneeName?: string;
    taskCount?: number;
    isGroupTask?: boolean;
  }) => {
    setCreatedTaskIds(prev => new Set(prev).add(messageId));
    const socket = socketRef.current;
    if (socket) {
      socket.emit('confirm_task_created', {
        chatId,
        messageId,
        taskId: info.taskId,
        taskTitle: info.title,
        assigneeName: info.assigneeName,
        taskCount: info.taskCount,
        isGroupTask: info.isGroupTask,
      });
    }
  };

  const handleDismissPreview = (messageId: string) => {
    setDismissedPreviews(prev => new Set(prev).add(messageId));
  };

  const handlePlanApplied = (messageId: string, info: { tasksApplied: number }) => {
    setAppliedPlanIds(prev => new Set(prev).add(messageId));
    const socket = socketRef.current;
    if (socket) {
      socket.emit('confirm_auto_plan_applied', {
        chatId,
        messageId,
        tasksApplied: info.tasksApplied,
      });
    }
  };

  const hasTaskPreview = (message: Message): boolean => {
    const taskPreview = message.aiContext?.taskPreview;
    const isCreatedInDB = taskPreview?.status === 'created';
    const isCreatedLocally = createdTaskIds.has(message.id);
    return !!(
      taskPreview?.type === 'task_preview' &&
      taskPreview?.task &&
      !isCreatedInDB &&
      !isCreatedLocally &&
      !dismissedPreviews.has(message.id)
    );
  };

  const hasAutoPlanPreview = (message: Message): boolean => {
    const autoPlanPreview = message.aiContext?.autoPlanPreview;
    const isAppliedInDB = autoPlanPreview?.status === 'applied';
    const isAppliedLocally = appliedPlanIds.has(message.id);
    return !!(
      autoPlanPreview?.type === 'auto_plan_preview' &&
      autoPlanPreview?.plan &&
      !isAppliedInDB &&
      !isAppliedLocally &&
      !dismissedPreviews.has(message.id)
    );
  };

  // Initialize socket
  useEffect(() => {
    socketRef.current = initSocket(userId, organizationId);
  }, [userId, organizationId]);

  // Load organization users
  useEffect(() => {
    const loadOrganizationUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/users/organization`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const users = await response.json();
          setOrganizationUsers(users.filter((u: OrganizationUser) => u.id !== userId));
        }
      } catch (error) {
        console.error('Failed to load organization users:', error);
      }
    };
    loadOrganizationUsers();
  }, [userId]);

  // Listen for online users
  useEffect(() => {
    const handleOnlineUsersChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ userIds: string[] }>;
      setOnlineUsers(customEvent.detail.userIds);
    };
    window.addEventListener('online_users_changed', handleOnlineUsersChange);
    return () => window.removeEventListener('online_users_changed', handleOnlineUsersChange);
  }, []);

  // Load messages and socket events
  useEffect(() => {
    isInitialLoad.current = true;
    previousMessageCount.current = 0;

    const loadMessageHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/chat/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const history = await response.json();
          const processedHistory = history.map((msg: Message) => ({
            ...msg,
            author: {
              ...msg.author,
              isAI: msg.author.isAI || msg.author.name === 'AI Assistant',
            },
          }));
          setMessages(processedHistory);
        }
      } catch (error) {
        console.error('Failed to load message history:', error);
      }
    };

    loadMessageHistory();

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join_room', { chatId, userId, userName });

    socket.on('receive_message', (message: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on('user_typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.userId !== userId) {
        if (data.isTyping) {
          setIsTyping({ userId: data.userId, userName: data.userName });
          if (hideTypingTimeoutRef.current) clearTimeout(hideTypingTimeoutRef.current);
          hideTypingTimeoutRef.current = setTimeout(() => setIsTyping(null), 3000);
        } else {
          setIsTyping(null);
          if (hideTypingTimeoutRef.current) clearTimeout(hideTypingTimeoutRef.current);
        }
      }
    });

    // Listen for reaction added
    socket.on('reaction_added', (data: { messageId: string; reaction: MessageReaction }) => {
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === data.messageId) {
            const existingReaction = msg.reactions?.find(
              r => r.emoji === data.reaction.emoji && r.userId === data.reaction.userId
            );
            if (existingReaction) return msg;
            return {
              ...msg,
              reactions: [...(msg.reactions || []), data.reaction],
            };
          }
          return msg;
        })
      );
    });

    // Listen for reaction removed
    socket.on('reaction_removed', (data: { messageId: string; userId: string; emoji: string }) => {
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              reactions: (msg.reactions || []).filter(
                r => !(r.emoji === data.emoji && r.userId === data.userId)
              ),
            };
          }
          return msg;
        })
      );
    });

    // Listen for message edited
    socket.on('message_edited', (data: { messageId: string; content: string; editedAt: string }) => {
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              content: data.content,
              editedAt: data.editedAt,
            };
          }
          return msg;
        })
      );
    });

    // Listen for message deleted
    socket.on('message_deleted', (data: { messageId: string; deletedAt: string }) => {
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              deletedAt: data.deletedAt,
            };
          }
          return msg;
        })
      );
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('reaction_added');
      socket.off('reaction_removed');
      socket.off('message_edited');
      socket.off('message_deleted');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (hideTypingTimeoutRef.current) clearTimeout(hideTypingTimeoutRef.current);
    };
  }, [chatId, userId, userName]);

  // Auto-scroll
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      isInitialLoad.current = false;
      previousMessageCount.current = messages.length;
      return;
    }
    if (messages.length > previousMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      previousMessageCount.current = messages.length;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('send_message', {
      chatId,
      authorId: userId,
      content: inputValue,
      replyToId: replyingTo?.id || null,
    });
    socket.emit('typing_stop', { chatId, userId });
    setInputValue('');
    setReplyingTo(null);
  };

  const detectMention = (value: string, cursorPos: number) => {
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastQuoteIndex = textBeforeCursor.lastIndexOf('"');
    const lastMentionIndex = Math.max(lastAtIndex, lastQuoteIndex);

    if (lastMentionIndex === -1) {
      setMentionDropdownVisible(false);
      return;
    }

    const textAfterMention = textBeforeCursor.substring(lastMentionIndex + 1);
    if (textAfterMention.includes(' ')) {
      setMentionDropdownVisible(false);
      return;
    }

    setMentionSearchQuery(textAfterMention);
    setMentionStartPos(lastMentionIndex);
    setMentionDropdownVisible(true);
    setMentionSelectedIndex(0);
  };

  const getFilteredUsers = () => {
    if (!mentionSearchQuery) return organizationUsers;
    const query = mentionSearchQuery.toLowerCase();
    return organizationUsers.filter(
      user => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    );
  };

  const insertMention = (user: OrganizationUser) => {
    const beforeMention = inputValue.substring(0, mentionStartPos);
    const afterMention = inputValue.substring(mentionStartPos + mentionSearchQuery.length + 1);
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;
    setInputValue(newValue);
    setMentionDropdownVisible(false);
    setMentionSearchQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleTyping = (value: string) => {
    setInputValue(value);
    const cursorPos = inputRef.current?.selectionStart || value.length;
    detectMention(value, cursorPos);

    const socket = socketRef.current;
    if (!socket) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (value.length > 0) {
      socket.emit('typing_start', { chatId, userId, userName });
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { chatId, userId });
      }, 3000);
    } else {
      socket.emit('typing_stop', { chatId, userId });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mentionDropdownVisible) {
      if (e.key === 'Enter') handleSend();
      return;
    }

    const filteredUsers = getFilteredUsers();
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setMentionSelectedIndex(prev => (prev < filteredUsers.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setMentionSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredUsers[mentionSelectedIndex]) insertMention(filteredUsers[mentionSelectedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        setMentionDropdownVisible(false);
        setMentionSearchQuery('');
        break;
    }
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

  const renderAvatarContent = (user: { name: string; avatar?: string; isAI?: boolean }) => {
    if (user.isAI || user.name === 'AI Assistant') {
      return <span className="text-base">🤖</span>;
    }
    if (user.avatar) {
      return <span className="text-base">{user.avatar}</span>;
    }
    return <span className="text-xs font-semibold text-white">{getInitials(user.name)}</span>;
  };

  // ==========================================
  // Reaction, Edit, and Delete handlers
  // ==========================================

  // Close context menu on click outside or Escape
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      console.log('Click outside check, contextMenuRef:', contextMenuRef.current);
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        console.log('Closing context menu - clicked outside');
        setContextMenu(null);
        setShowEmojiSubmenu(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('Closing context menu - Escape pressed');
        setContextMenu(null);
        setShowEmojiSubmenu(false);
      }
    };

    // Use setTimeout to avoid closing on the same click that opened the menu
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu]);

  // Handle context menu open
  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Context menu triggered:', message.id, e.clientX, e.clientY);
    setContextMenu({
      messageId: message.id,
      x: e.clientX,
      y: e.clientY,
      isOwnMessage: message.author.id === userId,
      isDeleted: !!message.deletedAt,
      messageContent: message.content,
    });
    setShowEmojiSubmenu(false);
  };

  // Toggle reaction (add if not exists, remove if exists)
  const handleToggleReaction = (messageId: string, emoji: string) => {
    console.log('handleToggleReaction called:', { messageId, emoji, userId, chatId });
    const socket = socketRef.current;
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    const message = messages.find(m => m.id === messageId);
    const existingReaction = message?.reactions?.find(
      r => r.emoji === emoji && r.userId === userId
    );

    if (existingReaction) {
      console.log('Removing reaction:', { messageId, emoji });
      socket.emit('remove_reaction', { messageId, userId, emoji, chatId });
    } else {
      console.log('Adding reaction:', { messageId, emoji });
      socket.emit('add_reaction', { messageId, userId, emoji, chatId });
    }
    setContextMenu(null);
    setShowEmojiSubmenu(false);
  };

  // Start editing a message
  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    setContextMenu(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  // Save edited message
  const handleSaveEdit = () => {
    const socket = socketRef.current;
    if (!socket || !editingMessageId || !editContent.trim()) return;

    socket.emit('edit_message', {
      messageId: editingMessageId,
      userId,
      content: editContent.trim(),
      chatId,
    });
    setEditingMessageId(null);
    setEditContent('');
  };

  // Delete message
  const handleDeleteMessage = (messageId: string) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('delete_message', { messageId, userId, chatId });
    setContextMenu(null);
  };

  // Copy message text
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setContextMenu(null);
  };

  // Group reactions by emoji with count
  const groupReactions = (reactions: MessageReaction[] = []): { emoji: string; count: number; users: string[]; hasUserReacted: boolean }[] => {
    const grouped: Record<string, { count: number; users: string[]; hasUserReacted: boolean }> = {};

    reactions.forEach(r => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { count: 0, users: [], hasUserReacted: false };
      }
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(r.user.name);
      if (r.userId === userId) {
        grouped[r.emoji].hasUserReacted = true;
      }
    });

    return Object.entries(grouped).map(([emoji, data]) => ({
      emoji,
      ...data,
    }));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(message => (
          <div
            id={`message-${message.id}`}
            key={message.id}
            className={cn('flex', message.author.id === userId ? 'justify-end' : 'justify-start')}
            onContextMenu={(e) => handleContextMenu(e, message)}
          >
            {/* Avatar for others */}
            {message.author.id !== userId && (
              <div className="flex-shrink-0 mr-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    message.author.isAI || message.author.name === 'AI Assistant'
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                      : getColorClass(message.author.name)
                  )}
                >
                  {renderAvatarContent(message.author)}
                </div>
              </div>
            )}

            <div className="relative max-w-[80%]">
              <div
                className={cn(
                  'rounded-2xl px-4 py-2',
                  message.deletedAt
                    ? 'bg-gray-100 text-gray-400 italic'
                    : message.author.id === userId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                )}
              >
                {/* Deleted message */}
                {message.deletedAt ? (
                  <p className="text-sm">Повідомлення видалено</p>
                ) : (
                  <>
                    {/* Reply quote */}
                    {message.replyTo && (
                      <div
                        className={cn(
                          'mb-2 p-2 rounded cursor-pointer text-xs',
                          message.author.id === userId ? 'bg-blue-600/30' : 'bg-black/10'
                        )}
                        onClick={() => {
                          const el = document.getElementById(`message-${message.replyTo!.id}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                      >
                        <p className={cn(
                          'font-medium',
                          message.author.id === userId ? 'text-blue-200' : 'text-blue-600'
                        )}>
                          {message.replyTo.author.name}
                        </p>
                        <p className={cn(
                          'truncate',
                          message.author.id === userId ? 'text-blue-100/80' : 'opacity-80'
                        )}>
                          {message.replyTo.deletedAt ? 'Повідомлення видалено' : message.replyTo.content}
                        </p>
                      </div>
                    )}

                    {/* Header */}
                    {message.author.id !== userId && (
                      <div className="flex items-center gap-1 mb-1">
                        {(message.author.isAI || message.author.name === 'AI Assistant') && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">AI</span>
                        )}
                        <p className="text-xs font-semibold text-gray-700">{message.author.name}</p>
                      </div>
                    )}

                    {/* Edit mode */}
                    {editingMessageId === message.id ? (
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Content */}
                        {message.author.isAI || message.author.name === 'AI Assistant' ? (
                          <div className="text-sm prose prose-sm max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </>
                    )}

                    {/* Timestamp and Edited badge */}
                    <div className="flex items-center gap-1 mt-1">
                      <p
                        className={cn(
                          'text-xs',
                          message.author.id === userId ? 'text-blue-100' : 'text-gray-400'
                        )}
                      >
                        {new Date(message.createdAt).toLocaleTimeString('uk-UA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {message.editedAt && (
                        <span className={cn(
                          'text-xs',
                          message.author.id === userId ? 'text-blue-100' : 'text-gray-400'
                        )}>
                          (відредаговано)
                        </span>
                      )}
                    </div>

                    {/* Task Preview */}
                    {hasTaskPreview(message) && message.aiContext?.taskPreview?.task && (
                      <div className="mt-2">
                        <TaskPreviewCard
                          taskData={message.aiContext.taskPreview.task}
                          onTaskCreated={info => handleTaskCreated(message.id, info)}
                          onDismiss={() => handleDismissPreview(message.id)}
                        />
                      </div>
                    )}

                    {/* Auto-Plan Preview */}
                    {hasAutoPlanPreview(message) && message.aiContext?.autoPlanPreview && (
                      <div className="mt-2">
                        <AutoPlanPreviewCard
                          planData={message.aiContext.autoPlanPreview}
                          onPlanApplied={info => handlePlanApplied(message.id, info)}
                          onDismiss={() => handleDismissPreview(message.id)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Reactions display */}
              {!message.deletedAt && message.reactions && message.reactions.length > 0 && (
                <div className={`flex flex-wrap gap-0.5 mt-1 ${message.author.id === userId ? 'justify-end' : 'justify-start'}`}>
                  {groupReactions(message.reactions).map(({ emoji, count, users, hasUserReacted }) => (
                    <button
                      key={emoji}
                      onClick={() => handleToggleReaction(message.id, emoji)}
                      className={cn(
                        'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors',
                        hasUserReacted
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                      )}
                      title={users.join(', ')}
                    >
                      <span>{emoji}</span>
                      <span>{count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Avatar for self */}
            {message.author.id === userId && (
              <div className="flex-shrink-0 ml-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    getColorClass(message.author.name)
                  )}
                >
                  {renderAvatarContent(message.author)}
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {isTyping && (
        <div className="px-4 py-2 border-t border-gray-100">
          <TypingIndicator userName={isTyping.userName} />
        </div>
      )}

      {/* Reply preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 border-t flex items-center gap-2">
          <div className="w-1 h-10 bg-blue-500 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-600">{replyingTo.authorName}</p>
            <p className="text-sm text-gray-600 truncate">{replyingTo.content}</p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-3 relative">
        {/* Mention dropdown */}
        {mentionDropdownVisible && (
          <div className="absolute bottom-full left-3 right-3 mb-2 max-h-48 overflow-y-auto bg-white border rounded-lg shadow-lg z-10">
            {getFilteredUsers().length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">Користувачів не знайдено</div>
            ) : (
              getFilteredUsers().map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className={cn(
                    'w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm',
                    index === mentionSelectedIndex && 'bg-blue-50'
                  )}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center',
                      user.isAI || user.name === 'AI Assistant'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                        : getColorClass(user.name)
                    )}
                  >
                    {renderAvatarContent(user)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                  </div>
                  {(user.isAI || user.name === 'AI Assistant') && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">AI</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {canEdit ? (
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={recipientName ? `Повідомлення для ${recipientName}...` : 'Введіть повідомлення...'}
              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="text-center text-sm text-gray-500 py-2">
            Тільки для перегляду. Ви не можете надсилати повідомлення.
          </div>
        )}
      </div>

      {/* Context Menu - rendered via portal to escape overflow:hidden */}
      {contextMenu && console.log('Rendering context menu at:', contextMenu.x, contextMenu.y) as undefined}
      {contextMenu && typeof document !== 'undefined' && createPortal(
        <div
          ref={contextMenuRef}
          className="fixed bg-white rounded-lg shadow-xl border py-2 min-w-[180px] z-[9999]"
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 200),
            left: Math.min(contextMenu.x, window.innerWidth - 200),
          }}
        >
          {/* Reply option (not for deleted messages) */}
          {!contextMenu.isDeleted && (
            <button
              type="button"
              onClick={() => {
                const message = messages.find(m => m.id === contextMenu.messageId);
                if (message) {
                  setReplyingTo({
                    id: contextMenu.messageId,
                    content: contextMenu.messageContent,
                    authorName: message.author.name,
                  });
                  setContextMenu(null);
                  inputRef.current?.focus();
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Reply className="w-4 h-4 text-gray-500" />
              <span>Відповісти</span>
            </button>
          )}

          {/* Reactions submenu */}
          {!contextMenu.isDeleted && (
            <div
              className="relative"
              onMouseEnter={() => {
                // Check available space on the right
                const menuWidth = 180; // context menu width
                const submenuWidth = 200; // emoji submenu approximate width
                const availableRight = window.innerWidth - contextMenu.x - menuWidth;
                setEmojiSubmenuPosition(availableRight >= submenuWidth ? 'right' : 'left');
                setShowEmojiSubmenu(true);
              }}
              onMouseLeave={() => setShowEmojiSubmenu(false)}
            >
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="text-base">😊</span>
                <span>Реакція</span>
                <span className="ml-auto text-gray-400">{emojiSubmenuPosition === 'right' ? '›' : '‹'}</span>
              </button>

              {/* Emoji submenu */}
              {showEmojiSubmenu && (
                <div className={`absolute top-0 bg-white rounded-lg shadow-xl border p-2 flex gap-1 ${
                  emojiSubmenuPosition === 'right' ? 'left-full ml-1' : 'right-full mr-1'
                }`}>
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleToggleReaction(contextMenu.messageId, emoji);
                      }}
                      className="text-xl hover:scale-125 transition-transform p-1 hover:bg-gray-100 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Edit option (only for own messages, not AI, not deleted) */}
          {contextMenu.isOwnMessage && !contextMenu.isDeleted && (
            <button
              type="button"
              onClick={() => {
                const message = messages.find(m => m.id === contextMenu.messageId);
                if (message && !message.author.isAI) {
                  handleStartEdit(message);
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Pencil className="w-4 h-4 text-gray-500" />
              <span>Редагувати</span>
            </button>
          )}

          {/* Copy option (not for deleted messages) */}
          {!contextMenu.isDeleted && (
            <button
              type="button"
              onClick={() => handleCopyText(contextMenu.messageContent)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Copy className="w-4 h-4 text-gray-500" />
              <span>Копіювати</span>
            </button>
          )}

          {/* Delete option (only for own messages, not already deleted) */}
          {contextMenu.isOwnMessage && !contextMenu.isDeleted && (
            <button
              type="button"
              onClick={() => handleDeleteMessage(contextMenu.messageId)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Видалити</span>
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
