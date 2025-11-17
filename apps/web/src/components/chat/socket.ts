import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let onlineUsers: Set<string> = new Set();

export const initSocket = (userId: string, organizationId: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io('http://localhost:4000', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    
    // Notify server that user is online
    socket?.emit('user_online', { userId, organizationId });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  // Listen for user status changes
  socket.on('user_status', (data: { userId: string; status: 'online' | 'offline' }) => {
    console.log(`User ${data.userId} is now ${data.status}`);
    
    if (data.status === 'online') {
      onlineUsers.add(data.userId);
    } else {
      onlineUsers.delete(data.userId);
    }
    
    // Trigger custom event for components to listen
    window.dispatchEvent(new CustomEvent('user_status_change', { 
      detail: { userId: data.userId, status: data.status } 
    }));
  });

  // Receive list of online users on connect
  socket.on('online_users', (userIds: string[]) => {
    console.log('Online users:', userIds);
    onlineUsers = new Set(userIds);
    
    // Trigger event
    window.dispatchEvent(new CustomEvent('online_users_updated', { 
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

export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

export const getOnlineUsers = (): string[] => {
  return Array.from(onlineUsers);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    onlineUsers.clear();
  }
};