'use client';

import { GoogleConnectButton } from '@/components/integrations/google-connect-button';
import { ChatBox } from '@/components/chat/chat-box';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({
        id: payload.sub,
        email: payload.email,
        organizationId: payload.organizationId,
      });
    } catch (error) {
      console.error('Invalid token:', error);
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Welcome to Forgeline! 🎉</h1>
          <p className="text-muted-foreground mt-2">
            Your SEO AI Platform is ready to use.
          </p>
        </div>

        {/* Google Connect Section */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-2">Google Search Console</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your Google account to access Search Console data
          </p>
          <GoogleConnectButton />
        </div>

        {/* Status Card */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-primary mb-2">
                ✅ v0.1 Foundation Complete!
              </h2>
              <p className="text-muted-foreground">
                Authentication is working! You successfully signed up and logged in.
                Your organization is ready for team collaboration.
              </p>
            </div>
          </div>

          <div className="border-t border-primary/20 pt-6">
            <h3 className="font-semibold mb-3">What's Next? (v0.2 - 6 days)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary">1</div>
                <div>
                  <p className="font-medium">Google OAuth</p>
                  <p className="text-muted-foreground">Connect your Google account</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary">2</div>
                <div>
                  <p className="font-medium">Search Console Data</p>
                  <p className="text-muted-foreground">Real metrics on dashboard</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary">3</div>
                <div>
                  <p className="font-medium">Interactive Charts</p>
                  <p className="text-muted-foreground">Clicks, impressions, CTR</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary">4</div>
                <div>
                  <p className="font-medium">Data Collection</p>
                  <p className="text-muted-foreground">Automated daily sync</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Placeholder */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Coming in v0.2</p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Coming in v0.4</p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Chats</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Coming in v0.3-v0.4</p>
          </div>
        </div>

        {/* Chat Test - v0.3 */}
        {user && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Team Chat (v0.3 Test)</h2>
            <ChatBox 
              chatId={user.organizationId} 
              userId={user.id}
              userName={user.email}
            />
          </div>
        )}

      </div>
    </div>
  );
}