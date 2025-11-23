import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/config/api';

let socket: Socket | null = null;
let onlineUsers: Set<string> = new Set();

export const initSocket = (userId: string, organizationId: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
    
    // Notify server that user is online
    socket?.emit('user_online', { userId, organizationId });
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
  });

  // Listen for FULL list of online users (NEW event from backend)
  socket.on('online_users_updated', (userIds: string[]) => {
    console.log('👥 Online users updated:', userIds);
    
    // Update local cache
    onlineUsers = new Set(userIds);
    
    // Trigger custom event for React components to listen
    window.dispatchEvent(new CustomEvent('online_users_changed', { 
      detail: { userIds } 
    }));
  });

  return socket as Socket;
};

export const getSocket = (): Socket => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket first.');
  }
  return socket;
};

/**
 * Check if specific user is currently online
 */
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

/**
 * Get array of all online user IDs
 */
export const getOnlineUsers = (): string[] => {
  return Array.from(onlineUsers);
};

/**
 * Disconnect socket and clear online users cache
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    onlineUsers.clear();
  }
};