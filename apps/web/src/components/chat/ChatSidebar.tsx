'use client';

import { useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useChatSidebar } from '@/contexts/chat-sidebar-context';
import { SidebarChatList } from './SidebarChatList';
import { SidebarChatWindow } from './SidebarChatWindow';
import { CreateChatDialog } from './create-chat-dialog';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ChatSidebarProps {
  currentUserId?: string;
  currentUserName?: string;
  organizationId?: string;
}

export function ChatSidebar({
  currentUserId,
  currentUserName,
  organizationId,
}: ChatSidebarProps) {
  const {
    state,
    closeSidebar,
    toggleMode,
    goBackToList,
    selectChat,
  } = useChatSidebar();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isOpen) {
        closeSidebar();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [state.isOpen, closeSidebar]);

  // Handle responsive - force narrow mode on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && state.mode === 'wide') {
        toggleMode();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [state.mode, toggleMode]);

  const handleChatCreated = (chatId: string) => {
    setLocalRefreshTrigger(prev => prev + 1);
    // Select the new chat
    selectChat(chatId, 'New Chat', false);
  };

  const isWide = state.mode === 'wide';
  const showListView = state.view === 'list' || isWide;
  const showChatView = state.view === 'chat' || isWide;

  return (
    <>
      {/* Backdrop - clickable overlay to close sidebar */}
      {state.isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-xl z-40',
          'transform transition-all duration-300 ease-out',
          state.isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{
          // Inline styles to guarantee width works
          // Narrow: 35% screen, Wide: 65% screen
          width: isWide ? '65vw' : '35vw',
          minWidth: isWide ? '900px' : '450px',
          maxWidth: isWide ? '1200px' : '600px',
        }}
      >
        {/* Narrow Mode */}
        {!isWide && (
          <div className="flex flex-col h-full">
            {/* Header - List View */}
            {state.view === 'list' && (
              <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">Повідомлення</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleMode}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 hidden md:flex"
                    title="Expand to wide mode"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={closeSidebar}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Header - Chat View */}
            {state.view === 'chat' && (
              <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={goBackToList}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {state.activeChatName?.[0]?.toUpperCase() || '?'}
                      </div>
                      {state.activeChatOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{state.activeChatName}</p>
                      <p className="text-xs text-gray-500">
                        {state.activeChatOnline ? 'Онлайн' : 'Офлайн'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleMode}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 hidden md:flex"
                    title="Expand to wide mode"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={closeSidebar}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-hidden">
              {state.view === 'list' ? (
                <SidebarChatList
                  currentUserId={currentUserId}
                  onCreateChat={() => setIsCreateDialogOpen(true)}
                  refreshTrigger={localRefreshTrigger}
                />
              ) : state.activeChatId && currentUserId && currentUserName && organizationId ? (
                <SidebarChatWindow
                  chatId={state.activeChatId}
                  userId={currentUserId}
                  userName={currentUserName}
                  organizationId={organizationId}
                  recipientName={state.activeChatName || undefined}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Оберіть чат, щоб почати спілкування
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wide Mode */}
        {isWide && (
          <div className="flex h-full">
            {/* Left Panel - Chat List */}
            <div className="w-[300px] border-r border-gray-200 flex flex-col flex-shrink-0">
              {/* Header */}
              <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">Повідомлення</h2>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-hidden">
                <SidebarChatList
                  currentUserId={currentUserId}
                  onCreateChat={() => setIsCreateDialogOpen(true)}
                  refreshTrigger={localRefreshTrigger}
                  compact
                />
              </div>
            </div>

            {/* Right Panel - Chat Window */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 flex-shrink-0">
                {state.activeChatId ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {state.activeChatName?.[0]?.toUpperCase() || '?'}
                      </div>
                      {state.activeChatOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{state.activeChatName}</p>
                      <p className="text-xs text-gray-500">
                        {state.activeChatOnline ? 'Онлайн' : 'Офлайн'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleMode}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                    title="Collapse to narrow mode"
                  >
                    <ArrowDownLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={closeSidebar}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Window */}
              <div className="flex-1 overflow-hidden">
                {state.activeChatId && currentUserId && currentUserName && organizationId ? (
                  <SidebarChatWindow
                    chatId={state.activeChatId}
                    userId={currentUserId}
                    userName={currentUserName}
                    organizationId={organizationId}
                    recipientName={state.activeChatName || undefined}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/30">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-3xl">💬</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">Оберіть розмову</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Виберіть чат зі списку, щоб почати спілкування
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Chat Dialog */}
      <CreateChatDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onChatCreated={handleChatCreated}
      />
    </>
  );
}
