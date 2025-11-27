'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { API_URL } from '@/config/api';
import { apiFetch } from '@/lib/api';

export function GoogleConnectButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const data = await apiFetch(`${API_URL}/api/integrations/google`);
      setIsConnected(data && data.connected);
    } catch (error) {
      // 404 means not connected, which is expected
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    const token = localStorage.getItem('token');
    window.location.href = `${API_URL}/api/integrations/google/connect?token=${token}`;
  };

  if (isLoading) {
    return <Button disabled size="lg">Loading...</Button>;
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium">Connected</span>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} size="lg">
      Connect Google Account
    </Button>
  );
}