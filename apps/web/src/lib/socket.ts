import { io, Socket } from 'socket.io-client';

// SSR-safe check
const isBrowser = typeof window !== 'undefined';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!isBrowser) {
    // Return mock socket for SSR
    return {} as Socket;
  }

  if (!socket) {
    socket = io('http://localhost:4000', {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Debug logs
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};