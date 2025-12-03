'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Mail,
  Clock,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Crown,
  Shield,
  User,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { API_URL } from '@/config/api';
import Link from 'next/link';

type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  jobRole: string;
  avatar: string | null;
  isAI: boolean;
  isOnline: boolean;
  createdAt: string;
}

interface Invite {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: Role;
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

export default function TeamSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  // Form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUser({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        organizationId: payload.organizationId,
        role: payload.role as Role,
      });
    } catch (error) {
      console.error('Invalid token:', error);
      router.push('/auth/login');
      return;
    }

    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`${API_URL}/api/team`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/invites`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setTeamMembers(membersData);
      }

      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvites(invitesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('error', 'Не вдалося завантажити дані');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const canManageTeam = currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setInviteLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/invites`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (response.ok) {
        showToast('success', 'Запрошення надіслано успішно');
        setInviteEmail('');
        setInviteRole('MEMBER');
        fetchData(token);
      } else {
        const error = await response.json();
        showToast('error', error.message || 'Не вдалося надіслати запрошення');
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      showToast('error', 'Не вдалося надіслати запрошення');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(`revoke-${inviteId}`);
    try {
      const response = await fetch(`${API_URL}/api/invites/${inviteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        showToast('success', 'Запрошення скасовано');
        fetchData(token);
      } else {
        showToast('error', 'Не вдалося скасувати запрошення');
      }
    } catch (error) {
      console.error('Error revoking invite:', error);
      showToast('error', 'Не вдалося скасувати запрошення');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(`role-${userId}`);
    try {
      const response = await fetch(`${API_URL}/api/team/${userId}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        showToast('success', 'Роль змінено успішно');
        fetchData(token);
      } else {
        const error = await response.json();
        showToast('error', error.message || 'Не вдалося змінити роль');
      }
    } catch (error) {
      console.error('Error changing role:', error);
      showToast('error', 'Не вдалося змінити роль');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(`remove-${userId}`);
    try {
      const response = await fetch(`${API_URL}/api/team/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        showToast('success', 'Учасника видалено з команди');
        fetchData(token);
      } else {
        const error = await response.json();
        showToast('error', error.message || 'Не вдалося видалити учасника');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      showToast('error', 'Не вдалося видалити учасника');
    } finally {
      setActionLoading(null);
    }
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header with back link */}
            <div>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад до налаштувань
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Команда</h1>
              <p className="text-muted-foreground mt-2">
                Керуйте учасниками команди та запрошеннями
              </p>
            </div>

            {/* Toast */}
            {toast && (
              <div
                className={`p-4 rounded-lg flex items-center gap-2 ${
                  toast.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {toast.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span>{toast.message}</span>
              </div>
            )}

            {/* Section 1: Invite New Member */}
            {canManageTeam && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Запросити нового члена
                  </CardTitle>
                  <CardDescription>
                    Надішліть запрошення на email для приєднання до команди
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="email" className="sr-only">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-full sm:w-48">
                      <Label htmlFor="role" className="sr-only">
                        Роль
                      </Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Оберіть роль" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Адміністратор</SelectItem>
                          <SelectItem value="MEMBER">Учасник</SelectItem>
                          <SelectItem value="VIEWER">Глядач</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={inviteLoading}>
                      {inviteLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Надіслати запрошення
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Section 2: Pending Invites */}
            {canManageTeam && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Очікують на приєднання
                  </CardTitle>
                  <CardDescription>
                    Запрошення, які ще не прийняті
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {invites.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Немає активних запрошень
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {invites.map((invite) => {
                        const daysLeft = getDaysUntilExpiry(invite.expiresAt);
                        return (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{invite.email}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge className={roleBadgeStyles[invite.role]}>
                                    {roleLabels[invite.role]}
                                  </Badge>
                                  <span>•</span>
                                  <span>
                                    {daysLeft > 0
                                      ? `Закінчується через ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дні' : 'днів'}`
                                      : 'Закінчується сьогодні'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvite(invite.id)}
                              disabled={actionLoading === `revoke-${invite.id}`}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              {actionLoading === `revoke-${invite.id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Скасувати'
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Section 3: Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Члени команди
                </CardTitle>
                <CardDescription>
                  Усі учасники вашої організації
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.map((member) => {
                    const isOwner = member.role === 'OWNER';
                    const isSelf = member.id === currentUser?.id;
                    const canChangeRole = canManageTeam && !isOwner && !isSelf;
                    const canRemove = canManageTeam && !isOwner && !isSelf;
                    // ADMIN cannot change/remove another ADMIN
                    const isAdminVsAdmin = currentUser?.role === 'ADMIN' && member.role === 'ADMIN';

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                              member.isAI
                                ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {member.avatar || getInitials(member.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name}</p>
                              {isSelf && (
                                <span className="text-xs text-muted-foreground">(Ви)</span>
                              )}
                              {member.isAI && (
                                <Badge variant="secondary" className="text-xs">
                                  AI
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {canChangeRole && !isAdminVsAdmin ? (
                            <Select
                              value={member.role}
                              onValueChange={(v) => handleRoleChange(member.id, v as Role)}
                              disabled={actionLoading === `role-${member.id}`}
                            >
                              <SelectTrigger className="w-40">
                                {actionLoading === `role-${member.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                {currentUser?.role === 'OWNER' && (
                                  <SelectItem value="ADMIN">
                                    <div className="flex items-center gap-2">
                                      {roleIcons.ADMIN}
                                      Адміністратор
                                    </div>
                                  </SelectItem>
                                )}
                                <SelectItem value="MEMBER">
                                  <div className="flex items-center gap-2">
                                    {roleIcons.MEMBER}
                                    Учасник
                                  </div>
                                </SelectItem>
                                <SelectItem value="VIEWER">
                                  <div className="flex items-center gap-2">
                                    {roleIcons.VIEWER}
                                    Глядач
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              className={`${roleBadgeStyles[member.role]} flex items-center gap-1`}
                            >
                              {roleIcons[member.role]}
                              {roleLabels[member.role]}
                            </Badge>
                          )}

                          {canRemove && !isAdminVsAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  disabled={actionLoading === `remove-${member.id}`}
                                >
                                  {actionLoading === `remove-${member.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Видалити учасника?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Ви впевнені, що хочете видалити {member.name} з команди? Цю дію
                                    можна скасувати.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Видалити
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
