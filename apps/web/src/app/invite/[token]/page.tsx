'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { API_URL } from '@/config/api';
import {
  Crown,
  Shield,
  User,
  Eye,
  Calendar,
  UserPlus,
  AlertCircle,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

interface InviteData {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  organization: {
    id: string;
    name: string;
  };
  invitedBy: {
    id: string;
    name: string;
  };
}

interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

const roleLabels: Record<Role, string> = {
  OWNER: 'Власник',
  ADMIN: 'Адміністратор',
  MEMBER: 'Учасник',
  VIEWER: 'Глядач',
};

const roleIcons: Record<Role, React.ReactNode> = {
  OWNER: <Crown className="h-4 w-4" />,
  ADMIN: <Shield className="h-4 w-4" />,
  MEMBER: <User className="h-4 w-4" />,
  VIEWER: <Eye className="h-4 w-4" />,
};

const roleBadgeStyles: Record<Role, string> = {
  OWNER: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800',
  ADMIN: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800',
  MEMBER: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800',
  VIEWER: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700',
};

type PageState = 'loading' | 'valid' | 'expired' | 'not_found' | 'error';

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const authToken = localStorage.getItem('token');
    if (authToken) {
      try {
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        setCurrentUser({
          id: payload.sub,
          email: payload.email,
          name: payload.name,
        });
        setIsLoggedIn(true);
      } catch {
        // Invalid token, treat as not logged in
        localStorage.removeItem('token');
      }
    }

    // Fetch invite data
    fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      const response = await fetch(`${API_URL}/api/invites/verify/${token}`);

      if (response.ok) {
        const data = await response.json();
        setInvite(data);
        setPageState('valid');
      } else {
        const errorData = await response.json();

        if (errorData.message?.includes('expired')) {
          setPageState('expired');
        } else if (errorData.message?.includes('not found') || errorData.message?.includes('used')) {
          setPageState('not_found');
        } else {
          setPageState('error');
          setError(errorData.message || 'Сталася помилка');
        }
      }
    } catch (err) {
      console.error('Error fetching invite:', err);
      setPageState('error');
      setError('Не вдалося завантажити запрошення');
    }
  };

  const handleAccept = async () => {
    const authToken = localStorage.getItem('token');
    if (!authToken) return;

    setAcceptLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/invites/accept/${token}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Store success message for dashboard
        sessionStorage.setItem('inviteSuccess', `Ви приєдналися до ${data.organization.name}!`);
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Не вдалося прийняти запрошення');
      }
    } catch (err) {
      console.error('Error accepting invite:', err);
      setError('Не вдалося прийняти запрошення');
    } finally {
      setAcceptLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Завантаження...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired invite
  if (pageState === 'expired') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <CardTitle className="text-xl">Запрошення закінчилось</CardTitle>
            <CardDescription>
              Це запрошення більше не дійсне. Зверніться до адміністратора організації для отримання нового запрошення.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/">
              <Button variant="outline">На головну</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Not found or already used
  if (pageState === 'not_found') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-xl">Запрошення не знайдено</CardTitle>
            <CardDescription>
              Запрошення не існує або вже було використане.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/">
              <Button variant="outline">На головну</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-xl">Помилка</CardTitle>
            <CardDescription>{error || 'Сталася невідома помилка'}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/">
              <Button variant="outline">На головну</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Valid invite
  const emailMismatch = isLoggedIn && currentUser && invite && currentUser.email !== invite.email;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xl font-bold">F</span>
            </div>
          </div>
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-xl">
            Вас запрошено приєднатися до {invite?.organization.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Role badge */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-muted-foreground">Ви будете:</span>
            <Badge className={`${roleBadgeStyles[invite?.role || 'MEMBER']} flex items-center gap-1`}>
              {roleIcons[invite?.role || 'MEMBER']}
              {roleLabels[invite?.role || 'MEMBER']}
            </Badge>
          </div>

          {/* Invited by */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Запросив: {invite?.invitedBy.name}</span>
          </div>

          {/* Expiration */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Дійсне до: {invite ? formatDate(invite.expiresAt) : ''}</span>
          </div>

          {/* Email mismatch warning */}
          {emailMismatch && (
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Увага</p>
                  <p>
                    Це запрошення для <strong>{invite?.email}</strong>.
                    Ви увійшли як <strong>{currentUser?.email}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
                <XCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {isLoggedIn ? (
            <Button
              onClick={handleAccept}
              className="w-full"
              disabled={acceptLoading}
            >
              {acceptLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Приєднання...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Приєднатися
                </>
              )}
            </Button>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center mb-2">
                Для приєднання потрібно увійти або зареєструватися
              </p>
              <div className="flex gap-3 w-full">
                <Link href={`/auth/login?redirect=/invite/${token}`} className="flex-1">
                  <Button variant="default" className="w-full">
                    Увійти
                  </Button>
                </Link>
                <Link href={`/auth/signup?redirect=/invite/${token}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Зареєструватися
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
