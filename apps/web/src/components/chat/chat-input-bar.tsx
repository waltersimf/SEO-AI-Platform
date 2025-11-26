'use client';

import { ChevronUp, ChevronDown, MessageCircle, Inbox, Maximize2, Send } from "lucide-react";
import { useState } from "react"; // <--- Додав useState для Quick Reply, якщо він вам потрібен

interface ChatInputBarProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
  unreadChats?: Array<{id: string, name: string, unreadCount: number}>;
}

const SIDEBAR_WIDTH = 256;

export function ChatInputBar({
  isOpen,
  onToggle,
  unreadCount = 0,
  unreadChats = []
}: ChatInputBarProps) {
  const [quickReplyText, setQuickReplyText] = useState('');
  
  const hasMultipleUnread = unreadChats.length > 1;
  const hasUnread = unreadCount > 0; // Використовуємо для Single Contact View

  const formatSenderList = () => {
    // ... (Your formatSenderList logic remains the same)
    if (unreadChats.length === 0) return '';
    if (unreadChats.length === 1) return unreadChats[0].name;
    if (unreadChats.length === 2) {
      return `${unreadChats[0].name}, ${unreadChats[1].name}`;
    }
    const firstTwo = unreadChats.slice(0, 2).map(c => c.name).join(', ');
    const remaining = unreadChats.length - 2;
    return `${firstTwo}, +${remaining} more`;
  };

  // Визначення, чи відображати Input Bar (ми його залишаємо видимим, бо Overlay плаває над ним)
  // if (isOpen) return null; // <--- Цей рядок ми видалили раніше

  const handleBarClick = (e: React.MouseEvent) => {
    // Якщо клік був зроблений на основний контейнер, відкриваємо чат
    onToggle();
  };
  
  // Визначення, який контент відображати (Multiple Unread, Single Unread, чи Zero State)
  const isSummaryView = hasMultipleUnread;
  const isSingleUnreadView = hasUnread && !hasMultipleUnread;
  const isDefaultView = !hasUnread;
  
  // Цей клас відповідає за область, яка повинна бути клікабельною для перемикання
  const clickableClass = "flex items-center gap-3 px-4 py-3 bg-muted hover:bg-muted/90 rounded-lg cursor-pointer transition-colors shadow-sm border border-border/50";

  return (
    <div
      className="fixed bottom-0 right-0 z-40 bg-transparent pointer-events-none"
      style={{ left: SIDEBAR_WIDTH }}
    >
      <div className="w-full pl-8 pr-12 py-4 pointer-events-auto">
        <div 
          className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden" 
          // Додаємо onClick на ВЕСЬ КАРД, коли він у режимі Summary/Single Unread/Default
          // В Single Unread/Default режимі клік по інпуту буде зупиняти це
          onClick={handleBarClick} 
        >

          {/* --- Верхня Секція (Завжди клікабельна для відкриття) --- */}
          {(isSummaryView || isSingleUnreadView || isDefaultView) && (
            <div 
              className="p-4 border-b border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {/* Тут ваша логіка відображення значків/статусу */}
              
              {/* Приклад відображення для Summary View */}
              {isSummaryView && (
                  <div className="flex-1 min-w-0">
                     <span className="font-bold text-gray-900">📬 {unreadCount} New Messages</span>
                     <p className="text-xs text-gray-600 truncate">From: {formatSenderList()}</p>
                  </div>
              )}
              {/* Приклад відображення для Single Unread View */}
              {isSingleUnreadView && (
                  <div className="flex-1 min-w-0">
                     <span className="font-semibold text-gray-900">{unreadChats[0].name}</span>
                     <p className="text-xs text-gray-600 truncate">New message received...</p>
                  </div>
              )}
              {/* Приклад відображення для Default View */}
              {isDefaultView && (
                  <div className="flex-1 min-w-0">
                     <span className="font-semibold text-gray-900">AI Assistant</span>
                     <p className="text-xs text-gray-600">Ready to help via chat...</p>
                  </div>
              )}
              
            </div>
          )}


          {/* --- Нижня Секція (Quick Reply / Action Button) --- */}
          <form 
            onSubmit={(e) => { e.preventDefault(); /* ... quick reply logic */ }}
            className="px-4 py-3 bg-gray-50 flex items-center gap-3"
            // Важливо: зупиняємо спливання кліку на цьому рівні, щоб клік всередині форми 
            // не викликав onToggle (handleBarClick) від батьківського div, коли не треба.
            onClick={(e) => e.stopPropagation()} 
          >
             
             <div className="relative flex-1">
               {/* Кнопка "Open Inbox" (коли Multiple Unread) */}
               {isSummaryView ? (
                  <button 
                    type="button"
                    // Тут не потрібен onClick, бо клік по ній вже викликав onToggle від батьківського div.
                    className="w-full text-left bg-blue-50 border border-blue-100 text-blue-700 font-medium text-sm rounded-lg pl-3 pr-4 py-2.5 hover:bg-blue-100 transition-all shadow-sm flex items-center justify-between pointer-events-none"
                  >
                    <span>Open inbox to reply...</span>
                    <Inbox size={16} />
                  </button>
               ) : (
                  // Справжній інпут (для Single/Default View)
                  <input 
                    value={quickReplyText}
                    onChange={(e) => setQuickReplyText(e.target.value)}
                    placeholder="Quick reply..."
                    className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    // Важливо: клік по інпуту НЕ повинен відкривати чат, а фокусуватись на вводі
                    onClick={(e) => e.stopPropagation()} 
                  />
               )}
             </div>
             
             {/* ... (Separator & Maximize button) */}
             <div className="h-6 w-px bg-gray-200 mx-1"></div>

             <button 
               type="button"
               onClick={onToggle} // Ця кнопка завжди перемикає/закриває чат
               className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
               title={isOpen ? "Close chat" : "Open chat"}
             >
               <Maximize2 size={18} />
             </button>
          </form>

        </div>
      </div>
    </div>
  );
}