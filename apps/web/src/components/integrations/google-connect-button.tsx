'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

export function GoogleConnectButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:4000/api/integrations/google', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(!!data);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = 'http://localhost:4000/api/integrations/google/connect';
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