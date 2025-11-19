"use client";

import { GoogleConnectButton } from "@/components/integrations/google-connect-button";
import { GscMetricsCard } from "@/components/gsc-metrics-card";
import { ChatBox } from "@/components/chat/chat-box";
import { ChatList } from "@/components/chat/chat-list";
import { CreateChatDialog } from "@/components/chat/create-chat-dialog";
import { UserList } from "@/components/users/user-list";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        organizationId: payload.organizationId,
      });
    } catch (error) {
      console.error("Invalid token:", error);
      router.push("/auth/login");
    }
  }, [router]);

  const handleChatSelect = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleChatCreated = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleUserClick = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`http://localhost:4000/api/chat/direct/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const chat = await response.json();
        setActiveChatId(chat.id);
      } else {
        console.error("Failed to create direct chat");
      }
    } catch (error) {
      console.error("Error creating direct chat:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Chat List */}
      <ChatList
        activeChatId={activeChatId || undefined}
        onChatSelect={handleChatSelect}
        onCreateChat={() => setIsCreateDialogOpen(true)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome to Forgeline! 🎉
              </h1>
              <p className="text-muted-foreground mt-2">
                Your SEO AI Platform is ready to use.
              </p>
            </div>

            {/* Status Card */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-6 w-6 text-primary"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">
                    Now v0.3 Chat (85%)
                  </h2>
                  <p className="text-muted-foreground">
                    Authentication & Google OAuth work! v0.3 Chat with real-time messaging, database
                    persistence, and online status tracking is 85% complete. Try the chat on the left! →
                  </p>
                </div>
              </div>

              <div className="border-t border-primary/20 pt-6 mt-6">
                <h3 className="font-semibold mb-3">What's Next? (v0.3 completion)</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-green-500/20 text-green-600">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium">Online Status</p>
                      <p className="text-muted-foreground">
                        See who's online real-time 🟢
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary">
                      2
                    </div>
                    <div>
                      <p className="font-medium">@Mentions</p>
                      <p className="text-muted-foreground">
                        Tag team members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-primary">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Connection Status</p>
                      <p className="text-muted-foreground">
                        See connection state
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-6 w-6 text-blue-600 dark:text-blue-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Your Account
                    </p>
                    <p className="text-2xl font-bold">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-6 w-6 text-green-600 dark:text-green-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <p className="text-2xl font-bold">Active</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  All systems operational
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-6 w-6 text-purple-600 dark:text-purple-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      AI Chats
                    </p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Coming in v0.4
                </p>
              </div>
            </div>

            {/* Google Integration */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Google Integration</h2>
              <GoogleConnectButton />
            </div>

            {/* GSC Metrics */}
            <GscMetricsCard />

            {/* User List */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Direct Messages</h2>
              <UserList onUserClick={handleUserClick} currentUserId={user.id} />
            </div>

            {/* Chat Area */}
            {activeChatId && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Active Chat</h2>
                <ChatBox
                  chatId={activeChatId}
                  userId={user.id}
                  userName={user.name}
                  organizationId={user.organizationId}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Chat Dialog */}
      <CreateChatDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
}