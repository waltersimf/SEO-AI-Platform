'use client';

import { createContext, useContext, ReactNode } from 'react';

type SocketStatus = 'connected' | 'disconnected' | 'reconnecting';

interface SocketContextType {
  socketStatus: SocketStatus;
}

const SocketContext = createContext<SocketContextType>({
  socketStatus: 'disconnected',
});

interface SocketProviderProps {
  socketStatus: SocketStatus;
  children: ReactNode;
}

export function SocketProvider({ socketStatus, children }: SocketProviderProps) {
  return (
    <SocketContext.Provider value={{ socketStatus }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
