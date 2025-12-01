'use client';

import { useEffect, useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { initSocket, getSocket } from './socket';
import { TypingIndicator } from './typing-indicator';
import { TaskPreviewCard } from './task-preview-card';
import { AutoPlanPreviewCard } from './auto-plan-preview-card';
import { API_URL } from '@/config/api';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
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

    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
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
    });
    socket.emit('typing_stop', { chatId, userId });
    setInputValue('');
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(message => (
          <div
            key={message.id}
            className={cn('flex', message.author.id === userId ? 'justify-end' : 'justify-start')}
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

            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2',
                message.author.id === userId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              )}
            >
              {/* Header */}
              {message.author.id !== userId && (
                <div className="flex items-center gap-1 mb-1">
                  {(message.author.isAI || message.author.name === 'AI Assistant') && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">AI</span>
                  )}
                  <p className="text-xs font-semibold text-gray-700">{message.author.name}</p>
                </div>
              )}

              {/* Content */}
              {message.author.isAI || message.author.name === 'AI Assistant' ? (
                <div className="text-sm prose prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{message.content}</p>
              )}

              {/* Timestamp */}
              <p
                className={cn(
                  'text-xs mt-1',
                  message.author.id === userId ? 'text-blue-100' : 'text-gray-400'
                )}
              >
                {new Date(message.createdAt).toLocaleTimeString('uk-UA', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>

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
      </div>
    </div>
  );
}
