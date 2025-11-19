'use client';

import { useEffect, useState } from 'react';

interface TypingIndicatorProps {
  userName: string;
}

export function TypingIndicator({ userName }: TypingIndicatorProps) {
  const [dots, setDots] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Fade in animation
  useEffect(() => {
    // Small delay for smooth fade in
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="flex items-center gap-1">
        <div className="flex gap-1">
          <span
            className={`w-2 h-2 rounded-full bg-gray-400 animate-bounce ${
              dots.length >= 1 ? 'opacity-100' : 'opacity-30'
            }`}
            style={{ animationDelay: '0ms' }}
          />
          <span
            className={`w-2 h-2 rounded-full bg-gray-400 animate-bounce ${
              dots.length >= 2 ? 'opacity-100' : 'opacity-30'
            }`}
            style={{ animationDelay: '150ms' }}
          />
          <span
            className={`w-2 h-2 rounded-full bg-gray-400 animate-bounce ${
              dots.length >= 3 ? 'opacity-100' : 'opacity-30'
            }`}
            style={{ animationDelay: '300ms' }}
          />
        </div>
        <span className="text-sm text-gray-500 ml-2 italic">
          {userName} is typing{dots}
        </span>
      </div>
    </div>
  );
}
