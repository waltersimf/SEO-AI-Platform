'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, CheckCircle, Loader2, BarChart3 } from 'lucide-react';
import { API_URL } from '@/config/api';

interface Insight {
  projectId: string;
  projectName: string;
  projectDomain: string;
  metric: string;
  type: 'positive' | 'negative';
  change: number;
  message: string;
}

export function InsightsWidget() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const res = await fetch(`${API_URL}/api/analytics/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      } else if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/auth/login');
      } else {
        setError('Не вдалося завантажити інсайти');
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
      setError('Помилка завантаження');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Інсайти
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Інсайти
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Інсайти
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-muted-foreground">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm">Все стабільно, значних змін немає</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Інсайти
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.slice(0, 5).map((insight, index) => (
          <div
            key={`${insight.projectId}-${insight.metric}-${index}`}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              insight.type === 'positive'
                ? 'bg-green-50 hover:bg-green-100'
                : 'bg-red-50 hover:bg-red-100'
            }`}
            onClick={() => router.push(`/dashboard/projects/${insight.projectId}`)}
          >
            {insight.type === 'positive' ? (
              <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{insight.projectName}</p>
              <p
                className={`text-sm ${
                  insight.type === 'positive' ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {insight.message}
              </p>
            </div>
          </div>
        ))}
        {insights.length > 5 && (
          <p className="text-sm text-muted-foreground text-center pt-2">
            +{insights.length - 5} інших змін
          </p>
        )}
      </CardContent>
    </Card>
  );
}
