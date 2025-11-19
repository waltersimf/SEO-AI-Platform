'use client';

import { useEffect, useState, useRef } from 'react';
import { initSocket, getSocket } from '../chat/socket';
import { Send } from 'lucide-react';
import { TypingIndicator } from './typing-indicator';

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket with userId and organizationId
  useEffect(() => {
    socketRef.current = initSocket(userId, organizationId);
    
    console.log('📡 ChatBox initialized socket for user:', userId);
  }, [userId, organizationId]);

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
    // Завантажити історію повідомлень з БД
    const loadMessageHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4000/api/chat/${chatId}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const history = await response.json();
          setMessages(history);
        }
      } catch (error) {
        console.error('Failed to load message history:', error);
      }
    };

    loadMessageHistory();

    const socket = socketRef.current;
    if (!socket) return;

    // Join chat room
    socket.emit('join_room', chatId);
    console.log('Joined room:', chatId);

    // Listen for new messages
    socket.on('receive_message', (message: Message) => {
      console.log('New message:', message);
      setMessages((prev) => [...prev, message]);
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleTyping = (value: string) => {
    setInputValue(value);

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
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.author.id === userId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold">
                  {message.author.name}
                </p>
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
              <p className="text-sm">{message.content}</p>
            </div>
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
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
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