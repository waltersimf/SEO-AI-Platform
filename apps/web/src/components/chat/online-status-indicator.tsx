"use client";

import { useEffect, useState } from "react";
import { isUserOnline } from "./socket";

interface OnlineStatusIndicatorProps {
  userId: string;
  showLabel?: boolean;
}

export function OnlineStatusIndicator({ userId, showLabel = false }: OnlineStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Initial check
    setIsOnline(isUserOnline(userId));

    // Listen for status changes
    const handleStatusChange = (event: CustomEvent) => {
      if (event.detail.userId === userId) {
        setIsOnline(event.detail.status === 'online');
      }
    };

    const handleOnlineUsersUpdate = () => {
      setIsOnline(isUserOnline(userId));
    };

    window.addEventListener('user_status_change', handleStatusChange as EventListener);
    window.addEventListener('online_users_updated', handleOnlineUsersUpdate);

    return () => {
      window.removeEventListener('user_status_change', handleStatusChange as EventListener);
      window.removeEventListener('online_users_updated', handleOnlineUsersUpdate);
    };
  }, [userId]);

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-2 w-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      {showLabel && (
        <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}