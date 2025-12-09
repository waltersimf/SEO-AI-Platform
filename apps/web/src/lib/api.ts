'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  // Auto-logout on 401
  if (response.status === 401) {
    localStorage.removeItem('token');
    toast.error('Session expired. Please login again.');
    window.location.href = '/auth/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export function useApi<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (endpoint: string, options?: RequestInit) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<T>(endpoint, options);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { call, loading, error };
}
