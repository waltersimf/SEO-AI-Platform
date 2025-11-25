'use client';

import { MessageCircle, ChevronUp, Inbox, ExternalLink } from 'lucide-react';

interface ChatInputBarProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
  unreadChats?: Array<{
    id: string;
    name: string;
    unreadCount: number;
  }>;
}

export function ChatInputBar({
  isOpen,
  onToggle,
  unreadCount = 0,
  unreadChats = []
}: ChatInputBarProps) {
  
  const hasUnread = unreadCount > 0;
  
  if (isOpen) {
    return null;
  }
  
  const formatSenderList = () => {
    if (unreadChats.length === 0) return '';
    if (unreadChats.length === 1) return unreadChats[0].name;
    if (unreadChats.length === 2) {
      return `${unreadChats[0].name}, ${unreadChats[1].name}`;
    }
    const firstTwo = unreadChats.slice(0, 2).map(c => c.name).join(', ');
    const remaining = unreadChats.length - 2;
    return `${firstTwo}, +${remaining} more`;
  };

  return (
    <div className="fixed bottom-0 left-64 right-0 z-40 p-8 pt-0 pointer-events-none">
      <div className="pointer-events-auto">
        {hasUnread ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div 
              className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
              onClick={onToggle}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <Inbox className="h-5 w-5 text-blue-600" />
                </div>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  📬 {unreadCount} New Message{unreadCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="text-gray-400">From: </span>
                  <span className="font-medium text-gray-600">{formatSenderList()}</span>
                </p>
              </div>
            </div>
            
            <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-2">
              <div 
                className="flex-1 flex items-center border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                onClick={onToggle}
              >
                <span className="text-sm text-blue-600">Open inbox to reply...</span>
              </div>
              
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={onToggle}
              >
                <Inbox className="h-5 w-5 text-gray-400" />
              </button>
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={onToggle}
              >
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
            onClick={onToggle}
          >
            <MessageCircle className="h-5 w-5 text-gray-400" />
            <div className="flex-1 border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-400">Type message...</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronUp className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}