"use client";

import { GoogleConnectButton } from "@/components/integrations/google-connect-button";
import { GscMetricsCard } from "@/components/gsc-metrics-card";
import { InsightsWidget } from "@/components/dashboard/insights-widget";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/contexts/socket-context";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { socketStatus } = useSocket();

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

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Main Content - Add padding bottom for input bar */}
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-6">
          <div className="space-y-8">
            {/* Welcome Section */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Ласкаво просимо до Forgeline!
              </h1>
              <p className="text-muted-foreground mt-2">
                Ваша SEO AI платформа готова до роботи.
              </p>
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
                      Ваш акаунт
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
                      Статус
                    </p>
                    <p className="text-2xl font-bold">Активний</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Всі системи працюють
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
                      AI чати
                    </p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Скоро буде
                </p>
              </div>
            </div>

            {/* Insights and Google Integration Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Insights Widget */}
              <InsightsWidget />

              {/* Google Integration */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Інтеграція з Google</h3>
                <GoogleConnectButton />
              </div>
            </div>

            {/* GSC Metrics */}
            <GscMetricsCard />
          </div>
        </div>
      </div>
    </div>
  );
}