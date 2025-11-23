interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'reconnecting';
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
        <span className="flex h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></span>
        Connected
      </span>
    );
  }

  if (status === 'reconnecting') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
        <span className="flex h-2 w-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-pulse"></span>
        Reconnecting...
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
      <span className="flex h-2 w-2 rounded-full bg-red-600 dark:bg-red-400"></span>
      Disconnected
    </span>
  );
}
