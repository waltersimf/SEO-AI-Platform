'use client';

import { useEffect, useState, useRef } from 'react';
import { initSocket, getSocket } from '../chat/socket';
import { Send } from 'lucide-react';
import { TypingIndicator } from './typing-indicator';
import { TaskPreviewCard } from './task-preview-card';
import { AutoPlanPreviewCard } from './auto-plan-preview-card';
import { API_URL } from '@/config/api';
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

export function ChatBox({
  chatId,
  userId,
  userName,
  organizationId
}: {
  chatId: string;
  userId: string;
  userName: string;
  organizationId: string;
}) {
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
    // Mark the preview as created so it hides immediately
    setCreatedTaskIds(prev => new Set(prev).add(messageId));

    // Emit socket event for AI to send confirmation message AND update the message status
    const socket = socketRef.current;
    if (socket) {
      socket.emit('confirm_task_created', {
        chatId,
        messageId, // Pass messageId to update the message in DB
        taskId: info.taskId, // Pass taskId to store in taskPreview
        taskTitle: info.title,
        assigneeName: info.assigneeName,
        taskCount: info.taskCount,
        isGroupTask: info.isGroupTask,
      });
    }
  };

  // Handle dismissing a task preview
  const handleDismissPreview = (messageId: string) => {
    setDismissedPreviews(prev => new Set(prev).add(messageId));
  };

  // Handle auto-plan applied
  const handlePlanApplied = (messageId: string, info: {
    tasksApplied: number;
  }) => {
    // Mark the plan as applied so it hides immediately
    setAppliedPlanIds(prev => new Set(prev).add(messageId));

    // Emit socket event for AI to send confirmation message
    const socket = socketRef.current;
    if (socket) {
      socket.emit('confirm_auto_plan_applied', {
        chatId,
        messageId,
        tasksApplied: info.tasksApplied,
      });
    }
  };

  // Check if message has a task preview
  const hasTaskPreview = (message: Message): boolean => {
    const taskPreview = message.aiContext?.taskPreview;
    // Check both: persisted status from DB AND local state (for immediate hide)
    const isCreatedInDB = taskPreview?.status === 'created';
    const isCreatedLocally = createdTaskIds.has(message.id);

    const result = !!(
      taskPreview?.type === 'task_preview' &&
      taskPreview?.task &&
      !isCreatedInDB && // Check persisted status
      !isCreatedLocally && // Check local state
      !dismissedPreviews.has(message.id)
    );
    if (message.aiContext) {
      console.log('hasTaskPreview check for message:', message.id, {
        type: taskPreview?.type,
        status: taskPreview?.status,
        hasTask: !!taskPreview?.task,
        isCreatedInDB,
        isCreatedLocally,
        isDismissed: dismissedPreviews.has(message.id),
        result,
      });
    }
    return result;
  };

  // Check if message has an auto-plan preview
  const hasAutoPlanPreview = (message: Message): boolean => {
    const autoPlanPreview = message.aiContext?.autoPlanPreview;
    // Check both: persisted status from DB AND local state (for immediate hide)
    const isAppliedInDB = autoPlanPreview?.status === 'applied';
    const isAppliedLocally = appliedPlanIds.has(message.id);

    const result = !!(
      autoPlanPreview?.type === 'auto_plan_preview' &&
      autoPlanPreview?.plan &&
      !isAppliedInDB &&
      !isAppliedLocally &&
      !dismissedPreviews.has(message.id)
    );
    return result;
  };

  // Helper function to render avatar content consistently
  const renderAvatarContent = (user: { name: string; avatar?: string; isAI?: boolean }) => {
    if (user.isAI || user.name === 'AI Assistant') {
      return <span className="text-lg">🤖</span>;
    }
    if (user.avatar) {
      return <span className="text-lg">{user.avatar}</span>;
    }
    return <span className="text-xs font-semibold">{user.name?.[0] || '?'}</span>;
  };

  // Initialize socket with userId and organizationId
  useEffect(() => {
    socketRef.current = initSocket(userId, organizationId);
    
    console.log('📡 ChatBox initialized socket for user:', userId);
  }, [userId, organizationId]);

  // Load organization users for mentions
  useEffect(() => {
    const loadOrganizationUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/users/organization`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const users = await response.json();
          // Filter out current user
          const otherUsers = users.filter((u: OrganizationUser) => u.id !== userId);
          setOrganizationUsers(otherUsers);
        }
      } catch (error) {
        console.error('Failed to load organization users:', error);
      }
    };

    loadOrganizationUsers();
  }, [userId]);

  // Listen for online users updates
  useEffect(() => {
    const handleOnlineUsersChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ userIds: string[] }>;
      const userIds = customEvent.detail.userIds;

      console.log('👥 Online users updated:', userIds);
      setOnlineUsers(userIds);
    };

    window.addEventListener('online_users_changed', handleOnlineUsersChange);

    return () => {
      window.removeEventListener('online_users_changed', handleOnlineUsersChange);
    };
  }, []);

  useEffect(() => {
    // Reset initial load flag when chat changes
    isInitialLoad.current = true;
    previousMessageCount.current = 0;

    // Завантажити історію повідомлень з БД
    const loadMessageHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/chat/${chatId}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const history = await response.json();
          console.log('📜 Loaded message history, count:', history.length);
          // Log messages with aiContext
          const msgsWithAiContext = history.filter((m: Message) => m.aiContext);
          if (msgsWithAiContext.length > 0) {
            console.log('📋 Messages with aiContext from history:', msgsWithAiContext.map((m: Message) => ({
              id: m.id,
              aiContext: m.aiContext,
              hasTaskPreview: !!(m.aiContext as any)?.taskPreview,
            })));
          }
          // Ensure isAI flag is set for AI Assistant messages (API might not include it)
          const processedHistory = history.map((msg: Message) => ({
            ...msg,
            author: {
              ...msg.author,
              isAI: msg.author.isAI || msg.author.name === 'AI Assistant'
            }
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

    // Join chat room
    socket.emit('join_room', { chatId, userId, userName });
    console.log('Joined room:', chatId, 'as', userName);

    // Listen for new messages
    socket.on('receive_message', (message: Message) => {
      console.log('New message:', message);
      console.log('Message aiContext:', message.aiContext);
      console.log('Has taskPreview?:', message.aiContext?.taskPreview);
      setMessages((prev) => {
        // Check if message already exists to prevent duplicates
        const messageExists = prev.some(m => m.id === message.id);
        if (messageExists) {
          console.log('Message already exists, skipping:', message.id);
          return prev;
        }
        return [...prev, message];
      });
    });

    // Listen for typing
    socket.on('user_typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.userId !== userId) {
        if (data.isTyping) {
          setIsTyping({ userId: data.userId, userName: data.userName });

          // Auto-hide typing indicator after 3 seconds
          if (hideTypingTimeoutRef.current) {
            clearTimeout(hideTypingTimeoutRef.current);
          }

          hideTypingTimeoutRef.current = setTimeout(() => {
            setIsTyping(null);
          }, 3000);
        } else {
          setIsTyping(null);
          if (hideTypingTimeoutRef.current) {
            clearTimeout(hideTypingTimeoutRef.current);
          }
        }
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_typing');

      // Cleanup timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (hideTypingTimeoutRef.current) {
        clearTimeout(hideTypingTimeoutRef.current);
      }
    };
  }, [chatId, userId]);

  // Auto-scroll to bottom only for new messages, not initial load
  useEffect(() => {
    // On initial load, scroll to bottom immediately without smooth animation
    if (isInitialLoad.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      isInitialLoad.current = false;
      previousMessageCount.current = messages.length;
      return;
    }

    // For new messages (count increased), scroll smoothly to bottom
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

    // Stop typing
    socket.emit('typing_stop', { chatId, userId });

    setInputValue('');
  };

  // Check for @ mention (supports both @ and " for Ukrainian keyboard)
  const detectMention = (value: string, cursorPos: number) => {
    const textBeforeCursor = value.substring(0, cursorPos);

    // Find the last @ or " before cursor (Ukrainian keyboard Shift+2 = ")
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastQuoteIndex = textBeforeCursor.lastIndexOf('"');
    const lastMentionIndex = Math.max(lastAtIndex, lastQuoteIndex);

    if (lastMentionIndex === -1) {
      setMentionDropdownVisible(false);
      return;
    }

    // Check if there's a space after the mention character (means mention ended)
    const textAfterMention = textBeforeCursor.substring(lastMentionIndex + 1);
    if (textAfterMention.includes(' ')) {
      setMentionDropdownVisible(false);
      return;
    }

    // Show dropdown and set search query
    setMentionSearchQuery(textAfterMention);
    setMentionStartPos(lastMentionIndex);
    setMentionDropdownVisible(true);
    setMentionSelectedIndex(0);
  };

  // Filter users based on mention search query
  const getFilteredUsers = () => {
    if (!mentionSearchQuery) return organizationUsers;
    const query = mentionSearchQuery.toLowerCase();
    return organizationUsers.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  };

  // Insert mention into input
  const insertMention = (user: OrganizationUser) => {
    const beforeMention = inputValue.substring(0, mentionStartPos);
    const afterMention = inputValue.substring(mentionStartPos + mentionSearchQuery.length + 1);
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;
    setInputValue(newValue);
    setMentionDropdownVisible(false);
    setMentionSearchQuery('');

    // Focus input after insertion
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleTyping = (value: string) => {
    setInputValue(value);

    // Detect mention
    const cursorPos = inputRef.current?.selectionStart || value.length;
    detectMention(value, cursorPos);

    const socket = socketRef.current;
    if (!socket) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.length > 0) {
      // Send typing_start immediately on first character
      socket.emit('typing_start', { chatId, userId, userName });

      // Debounce: Send typing_stop after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { chatId, userId });
      }, 3000);
    } else {
      // Empty input - immediately stop typing
      socket.emit('typing_stop', { chatId, userId });
    }
  };

  // Handle keyboard navigation in mention dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mentionDropdownVisible) {
      if (e.key === 'Enter') {
        handleSend();
      }
      return;
    }

    const filteredUsers = getFilteredUsers();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setMentionSelectedIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setMentionSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredUsers[mentionSelectedIndex]) {
          insertMention(filteredUsers[mentionSelectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setMentionDropdownVisible(false);
        setMentionSearchQuery('');
        break;
    }
  };

  // Check if user is online
  const isUserOnline = (authorId: string): boolean => {
    return onlineUsers.includes(authorId);
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.author.id === userId ? 'justify-end' : 'justify-start'}`}
          >
            {/* Show avatar for other users (on the left) */}
            {message.author.id !== userId && (
              <div className="flex-shrink-0 mr-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {/* ⭐ ЗМІНА ТУТ: ВИКЛИК ХЕЛПЕРА */}
                  {renderAvatarContent(message.author)}
                </div>
              </div>
            )}

            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.author.id === userId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {/* Show avatar emoji inline for AI users */}
                {(message.author.isAI || message.author.name === 'AI Assistant') && (
                  <span className="text-base">🤖</span>
                )}
                <p className="text-xs font-semibold">
                  {message.author.name}
                </p>
                {/* AI Badge */}
                {(message.author.isAI || message.author.name === 'AI Assistant') && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">AI</span>
                )}
                {/* Online Status Indicator */}
                {isUserOnline(message.author.id) && (
                  <span className="text-green-500" title="Online">
                    🟢
                  </span>
                )}
                <p className="text-xs opacity-70">
                  {new Date(message.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {/* Render markdown for AI messages, plain text for others */}
              {(message.author.isAI || message.author.name === 'AI Assistant') ? (
                <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{message.content}</p>
              )}

              {/* Task Preview Card */}
              {hasTaskPreview(message) && message.aiContext?.taskPreview?.task && (
                <TaskPreviewCard
                  taskData={message.aiContext.taskPreview.task}
                  onTaskCreated={(info) => handleTaskCreated(message.id, info)}
                  onDismiss={() => handleDismissPreview(message.id)}
                />
              )}

              {/* Auto-Plan Preview Card */}
              {hasAutoPlanPreview(message) && message.aiContext?.autoPlanPreview && (
                <AutoPlanPreviewCard
                  planData={message.aiContext.autoPlanPreview}
                  onPlanApplied={(info) => handlePlanApplied(message.id, info)}
                  onDismiss={() => handleDismissPreview(message.id)}
                />
              )}
            </div>

            {/* Show avatar for current user (on the right) */}
            {message.author.id === userId && (
              <div className="flex-shrink-0 ml-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {/* ⭐ ЗМІНА ТУТ: ВИКЛИК ХЕЛПЕРА */}
                  {renderAvatarContent(message.author)}
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator - positioned above input */}
      {isTyping && (
        <div className="border-t">
          <TypingIndicator userName={isTyping.userName} />
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4 relative">
        {/* Mention Dropdown */}
        {mentionDropdownVisible && (
          <div className="absolute bottom-full left-4 right-4 mb-2 max-h-64 overflow-y-auto bg-white border rounded-lg shadow-lg z-10">
            {getFilteredUsers().length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">No users found</div>
            ) : (
              getFilteredUsers().map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 ${
                    index === mentionSelectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {/* ⭐ ЗМІНА ТУТ: ВИКЛИК ХЕЛПЕРА */}
                    {renderAvatarContent(user)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                  {(user.isAI || user.name === 'AI Assistant') && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">AI</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (@mention users)"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}