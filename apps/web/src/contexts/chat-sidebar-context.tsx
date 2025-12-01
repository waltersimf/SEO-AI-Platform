'use client';

import { createContext, useContext, useReducer, ReactNode, useCallback, useMemo } from 'react';

// Types
export interface UnreadMessage {
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: Date;
}

export interface ChatSidebarState {
  isOpen: boolean;
  mode: 'narrow' | 'wide';
  view: 'list' | 'chat'; // Only for narrow mode
  activeChatId: string | null;
  activeChatName: string | null;
  activeChatOnline: boolean;
  unreadMessages: UnreadMessage[];
  totalUnreadCount: number;
}

type ChatSidebarAction =
  | { type: 'OPEN_SIDEBAR' }
  | { type: 'CLOSE_SIDEBAR' }
  | { type: 'TOGGLE_MODE' }
  | { type: 'SET_MODE'; payload: 'narrow' | 'wide' }
  | { type: 'SELECT_CHAT'; payload: { chatId: string; chatName: string; isOnline?: boolean } }
  | { type: 'GO_BACK_TO_LIST' }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'ADD_UNREAD_MESSAGE'; payload: UnreadMessage }
  | { type: 'SET_UNREAD_MESSAGES'; payload: UnreadMessage[] }
  | { type: 'SET_TOTAL_UNREAD_COUNT'; payload: number }
  | { type: 'CLEAR_UNREAD_FOR_CHAT'; payload: string };

const initialState: ChatSidebarState = {
  isOpen: false,
  mode: 'narrow',
  view: 'list',
  activeChatId: null,
  activeChatName: null,
  activeChatOnline: false,
  unreadMessages: [],
  totalUnreadCount: 0,
};

function chatSidebarReducer(state: ChatSidebarState, action: ChatSidebarAction): ChatSidebarState {
  switch (action.type) {
    case 'OPEN_SIDEBAR':
      return { ...state, isOpen: true };

    case 'CLOSE_SIDEBAR':
      return { ...state, isOpen: false, view: 'list' };

    case 'TOGGLE_MODE':
      return {
        ...state,
        mode: state.mode === 'narrow' ? 'wide' : 'narrow',
        // In wide mode, always show chat view if there's an active chat
        view: state.mode === 'narrow' && state.activeChatId ? 'chat' : state.view,
      };

    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'SELECT_CHAT':
      return {
        ...state,
        activeChatId: action.payload.chatId,
        activeChatName: action.payload.chatName,
        activeChatOnline: action.payload.isOnline ?? false,
        view: 'chat',
        // Clear unread messages for this chat
        unreadMessages: state.unreadMessages.filter(msg => msg.chatId !== action.payload.chatId),
      };

    case 'GO_BACK_TO_LIST':
      return { ...state, view: 'list' };

    case 'MARK_AS_READ':
      return {
        ...state,
        unreadMessages: state.unreadMessages.filter(msg => msg.chatId !== action.payload),
      };

    case 'ADD_UNREAD_MESSAGE':
      // Don't add if sidebar is open and this is the active chat
      if (state.isOpen && state.activeChatId === action.payload.chatId) {
        return state;
      }
      return {
        ...state,
        unreadMessages: [...state.unreadMessages, action.payload],
        totalUnreadCount: state.totalUnreadCount + 1,
      };

    case 'SET_UNREAD_MESSAGES':
      return { ...state, unreadMessages: action.payload };

    case 'SET_TOTAL_UNREAD_COUNT':
      return { ...state, totalUnreadCount: action.payload };

    case 'CLEAR_UNREAD_FOR_CHAT':
      return {
        ...state,
        unreadMessages: state.unreadMessages.filter(msg => msg.chatId !== action.payload),
      };

    default:
      return state;
  }
}

// Context interface
interface ChatSidebarContextType {
  state: ChatSidebarState;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleMode: () => void;
  setMode: (mode: 'narrow' | 'wide') => void;
  selectChat: (chatId: string, chatName: string, isOnline?: boolean) => void;
  goBackToList: () => void;
  markAsRead: (chatId: string) => void;
  addUnreadMessage: (message: UnreadMessage) => void;
  setUnreadMessages: (messages: UnreadMessage[]) => void;
  setTotalUnreadCount: (count: number) => void;
  clearUnreadForChat: (chatId: string) => void;
}

const ChatSidebarContext = createContext<ChatSidebarContextType | null>(null);

// Provider
interface ChatSidebarProviderProps {
  children: ReactNode;
}

export function ChatSidebarProvider({ children }: ChatSidebarProviderProps) {
  const [state, dispatch] = useReducer(chatSidebarReducer, initialState);

  const openSidebar = useCallback(() => dispatch({ type: 'OPEN_SIDEBAR' }), []);
  const closeSidebar = useCallback(() => dispatch({ type: 'CLOSE_SIDEBAR' }), []);
  const toggleMode = useCallback(() => dispatch({ type: 'TOGGLE_MODE' }), []);
  const setMode = useCallback((mode: 'narrow' | 'wide') => dispatch({ type: 'SET_MODE', payload: mode }), []);

  const selectChat = useCallback((chatId: string, chatName: string, isOnline?: boolean) => {
    dispatch({ type: 'SELECT_CHAT', payload: { chatId, chatName, isOnline } });
  }, []);

  const goBackToList = useCallback(() => dispatch({ type: 'GO_BACK_TO_LIST' }), []);
  const markAsRead = useCallback((chatId: string) => dispatch({ type: 'MARK_AS_READ', payload: chatId }), []);

  const addUnreadMessage = useCallback((message: UnreadMessage) => {
    dispatch({ type: 'ADD_UNREAD_MESSAGE', payload: message });
  }, []);

  const setUnreadMessages = useCallback((messages: UnreadMessage[]) => {
    dispatch({ type: 'SET_UNREAD_MESSAGES', payload: messages });
  }, []);

  const setTotalUnreadCount = useCallback((count: number) => {
    dispatch({ type: 'SET_TOTAL_UNREAD_COUNT', payload: count });
  }, []);

  const clearUnreadForChat = useCallback((chatId: string) => {
    dispatch({ type: 'CLEAR_UNREAD_FOR_CHAT', payload: chatId });
  }, []);

  const value = useMemo(() => ({
    state,
    openSidebar,
    closeSidebar,
    toggleMode,
    setMode,
    selectChat,
    goBackToList,
    markAsRead,
    addUnreadMessage,
    setUnreadMessages,
    setTotalUnreadCount,
    clearUnreadForChat,
  }), [state, openSidebar, closeSidebar, toggleMode, setMode, selectChat, goBackToList, markAsRead, addUnreadMessage, setUnreadMessages, setTotalUnreadCount, clearUnreadForChat]);

  return (
    <ChatSidebarContext.Provider value={value}>
      {children}
    </ChatSidebarContext.Provider>
  );
}

// Hook
export function useChatSidebar() {
  const context = useContext(ChatSidebarContext);
  if (!context) {
    throw new Error('useChatSidebar must be used within a ChatSidebarProvider');
  }
  return context;
}
