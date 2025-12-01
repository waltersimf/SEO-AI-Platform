'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TimePicker } from '@/components/ui/time-picker';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Table,
  HardDrive,
  Search,
  BarChart3,
  ExternalLink,
  X,
  Calendar,
  Clock,
} from 'lucide-react';
import { API_URL } from '@/config/api';

interface GoogleIntegration {
  connected: boolean;
  scopes: string[];
  metadata?: {
    email?: string;
    name?: string;
  };
}

interface AutoPlanSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  dayOfWeek: number;
  time: string;
  notifyBeforeApply: boolean;
  autoApply: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [googleIntegration, setGoogleIntegration] = useState<GoogleIntegration | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string; link?: string } | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [showFilesModal, setShowFilesModal] = useState(false);

  // Auto-plan settings state
  const [autoPlanSettings, setAutoPlanSettings] = useState<AutoPlanSettings>({
    enabled: false,
    frequency: 'weekly',
    dayOfWeek: 1,
    time: '08:00',
    notifyBeforeApply: true,
    autoApply: false,
  });
  const [autoPlanLoading, setAutoPlanLoading] = useState(false);
  const [autoPlanSaving, setAutoPlanSaving] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    checkGoogleConnection(token);
    fetchAutoPlanSettings(token);
  }, [router]);

  const checkGoogleConnection = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/integrations/google`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoogleIntegration(data);
      } else {
        setGoogleIntegration(null);
      }
    } catch (error) {
      console.error('Error checking Google connection:', error);
      setGoogleIntegration(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAutoPlanSettings = async (token: string) => {
    setAutoPlanLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/settings/auto-plan`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAutoPlanSettings({
          enabled: data.enabled,
          frequency: data.frequency,
          dayOfWeek: data.dayOfWeek,
          time: data.time,
          notifyBeforeApply: data.notifyBeforeApply,
          autoApply: data.autoApply,
          lastRunAt: data.lastRunAt,
          nextRunAt: data.nextRunAt,
        });
      }
    } catch (error) {
      console.error('Error fetching auto-plan settings:', error);
    } finally {
      setAutoPlanLoading(false);
    }
  };

  const updateAutoPlanSettings = async (updates: Partial<AutoPlanSettings>) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSettings = { ...autoPlanSettings, ...updates };
    setAutoPlanSettings(newSettings);
    setAutoPlanSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/settings/auto-plan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        const data = await response.json();
        setAutoPlanSettings({
          enabled: data.enabled,
          frequency: data.frequency,
          dayOfWeek: data.dayOfWeek,
          time: data.time,
          notifyBeforeApply: data.notifyBeforeApply,
          autoApply: data.autoApply,
          lastRunAt: data.lastRunAt,
          nextRunAt: data.nextRunAt,
        });
        setActionResult({ type: 'success', message: 'Налаштування авто-плану збережено' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving auto-plan settings:', error);
      setActionResult({ type: 'error', message: 'Не вдалося зберегти налаштування' });
    } finally {
      setAutoPlanSaving(false);
      setTimeout(() => setActionResult(null), 3000);
    }
  };

  const handleConnectGoogle = () => {
    const token = localStorage.getItem('token');
    window.location.href = `${API_URL}/api/integrations/google/connect?token=${token}`;
  };

  const handleDisconnectGoogle = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading('disconnect');
    try {
      const response = await fetch(`${API_URL}/api/integrations/google`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setGoogleIntegration(null);
        setActionResult({ type: 'success', message: 'Google акаунт успішно відключено' });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      setActionResult({ type: 'error', message: 'Не вдалося відключити Google акаунт' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionResult(null), 5000);
    }
  };

  const handleViewDriveFiles = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading('drive');
    try {
      const response = await fetch(`${API_URL}/api/integrations/google/drive/files`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDriveFiles(data.files || []);
        setShowFilesModal(true);
      } else {
        throw new Error('Failed to fetch files');
      }
    } catch (error) {
      setActionResult({ type: 'error', message: 'Не вдалося отримати файли Drive' });
      setTimeout(() => setActionResult(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateDoc = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading('docs');
    try {
      const response = await fetch(`${API_URL}/api/integrations/google/docs/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActionResult({
          type: 'success',
          message: `Created: ${data.title}`,
          link: data.webViewLink,
        });
      } else {
        throw new Error('Failed to create document');
      }
    } catch (error) {
      setActionResult({ type: 'error', message: 'Не вдалося створити Google Doc' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionResult(null), 10000);
    }
  };

  const handleCreateSheet = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading('sheets');
    try {
      const response = await fetch(`${API_URL}/api/integrations/google/sheets/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActionResult({
          type: 'success',
          message: `Created: ${data.title}`,
          link: data.webViewLink,
        });
      } else {
        throw new Error('Failed to create spreadsheet');
      }
    } catch (error) {
      setActionResult({ type: 'error', message: 'Не вдалося створити Google Sheet' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionResult(null), 10000);
    }
  };

  const hasScope = (scope: string) => {
    return googleIntegration?.scopes?.some(s => s.includes(scope)) || false;
  };

  const dayNames = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];

  const formatNextRunTime = (dateStr?: string) => {
    if (!dateStr) return 'Не заплановано';
    const date = new Date(dateStr);
    return date.toLocaleString('uk-UA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Налаштування</h1>
              <p className="text-muted-foreground mt-2">
                Керуйте інтеграціями та налаштуваннями акаунту
              </p>
            </div>

            {/* Action Result Toast */}
            {actionResult && (
              <div
                className={`p-4 rounded-lg flex items-center justify-between ${
                  actionResult.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {actionResult.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span>{actionResult.message}</span>
                  {actionResult.link && (
                    <a
                      href={actionResult.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline font-medium"
                    >
                      Open <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <button onClick={() => setActionResult(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Google Integration Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google Інтеграція
                </CardTitle>
                <CardDescription>
                  Підключіть Google акаунт для доступу до Search Console, Analytics, Drive, Docs та Sheets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Connection Status */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {googleIntegration?.connected ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Підключено</p>
                          {googleIntegration.metadata?.email && (
                            <p className="text-sm text-muted-foreground">
                              {googleIntegration.metadata.email}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                        <p className="font-medium text-muted-foreground">Не підключено</p>
                      </>
                    )}
                  </div>
                  {googleIntegration?.connected ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDisconnectGoogle}
                      disabled={actionLoading === 'disconnect'}
                    >
                      {actionLoading === 'disconnect' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Відключити'
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleConnectGoogle}>Підключити Google акаунт</Button>
                  )}
                </div>

                {/* Services Grid */}
                {googleIntegration?.connected && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Search Console */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Search Console</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {hasScope('webmasters') ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" /> Підключено
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <XCircle className="h-4 w-4" /> Не авторизовано
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Analytics */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">Analytics</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {hasScope('analytics') ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" /> Підключено
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <XCircle className="h-4 w-4" /> Не авторизовано
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Drive */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Drive</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {hasScope('drive') ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" /> Підключено
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <XCircle className="h-4 w-4" /> Не авторизовано
                          </span>
                        )}
                      </div>
                      {hasScope('drive') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleViewDriveFiles}
                          disabled={actionLoading === 'drive'}
                          className="w-full"
                        >
                          {actionLoading === 'drive' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <HardDrive className="h-4 w-4 mr-2" />
                          )}
                          Переглянути файли
                        </Button>
                      )}
                    </div>

                    {/* Docs */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Docs</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {hasScope('documents') ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" /> Підключено
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <XCircle className="h-4 w-4" /> Не авторизовано
                          </span>
                        )}
                      </div>
                      {hasScope('documents') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCreateDoc}
                          disabled={actionLoading === 'docs'}
                          className="w-full"
                        >
                          {actionLoading === 'docs' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          Створити тест. документ
                        </Button>
                      )}
                    </div>

                    {/* Sheets */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Table className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Sheets</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {hasScope('spreadsheets') ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" /> Підключено
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <XCircle className="h-4 w-4" /> Не авторизовано
                          </span>
                        )}
                      </div>
                      {hasScope('spreadsheets') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCreateSheet}
                          disabled={actionLoading === 'sheets'}
                          className="w-full"
                        >
                          {actionLoading === 'sheets' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Table className="h-4 w-4 mr-2" />
                          )}
                          Створити тест. таблицю
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auto-Planning Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-purple-600" />
                  Авто-планування
                </CardTitle>
                <CardDescription>
                  Автоматично плануйте завдання з беклогу на регулярній основі
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {autoPlanLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-plan-enabled" className="text-base font-medium">
                          Увімкнути авто-планування
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Автоматично запускати авто-план у вказаний час
                        </p>
                      </div>
                      <Switch
                        id="auto-plan-enabled"
                        checked={autoPlanSettings.enabled}
                        onCheckedChange={(checked) => updateAutoPlanSettings({ enabled: checked })}
                        disabled={autoPlanSaving}
                      />
                    </div>

                    {/* Settings Grid */}
                    <div className={`grid gap-6 md:grid-cols-2 ${!autoPlanSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                      {/* Frequency */}
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Частота</Label>
                        <Select
                          value={autoPlanSettings.frequency}
                          onValueChange={(value: 'daily' | 'weekly') => updateAutoPlanSettings({ frequency: value })}
                          disabled={autoPlanSaving || !autoPlanSettings.enabled}
                        >
                          <SelectTrigger id="frequency">
                            <SelectValue placeholder="Оберіть частоту" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Щодня</SelectItem>
                            <SelectItem value="weekly">Щотижня</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Day of Week (only for weekly) */}
                      {autoPlanSettings.frequency === 'weekly' && (
                        <div className="space-y-2">
                          <Label htmlFor="dayOfWeek">День тижня</Label>
                          <Select
                            value={autoPlanSettings.dayOfWeek.toString()}
                            onValueChange={(value) => updateAutoPlanSettings({ dayOfWeek: parseInt(value) })}
                            disabled={autoPlanSaving || !autoPlanSettings.enabled}
                          >
                            <SelectTrigger id="dayOfWeek">
                              <SelectValue placeholder="Оберіть день" />
                            </SelectTrigger>
                            <SelectContent>
                              {dayNames.map((day, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Time */}
                      <div className="space-y-2">
                        <Label>Час</Label>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <TimePicker
                            value={autoPlanSettings.time}
                            onChange={(value) => updateAutoPlanSettings({ time: value })}
                            disabled={autoPlanSaving || !autoPlanSettings.enabled}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Behavior Settings */}
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground">Поведінка</h4>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notify-before" className="text-sm font-medium">
                            Попередній перегляд
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Надіслати попередній перегляд в AI чат перед застосуванням
                          </p>
                        </div>
                        <Switch
                          id="notify-before"
                          checked={autoPlanSettings.notifyBeforeApply}
                          onCheckedChange={(checked) => updateAutoPlanSettings({ notifyBeforeApply: checked })}
                          disabled={autoPlanSaving || !autoPlanSettings.enabled}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-apply" className="text-sm font-medium">
                            Застосовувати автоматично
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Застосовувати план без ручного підтвердження
                          </p>
                        </div>
                        <Switch
                          id="auto-apply"
                          checked={autoPlanSettings.autoApply}
                          onCheckedChange={(checked) => updateAutoPlanSettings({ autoApply: checked })}
                          disabled={autoPlanSaving || !autoPlanSettings.enabled}
                        />
                      </div>
                    </div>

                    {/* Next Run Info */}
                    {autoPlanSettings.enabled && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Наступний запуск: {formatNextRunTime(autoPlanSettings.nextRunAt)}
                          </span>
                        </div>
                        {autoPlanSettings.lastRunAt && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 ml-6">
                            Останній запуск: {formatNextRunTime(autoPlanSettings.lastRunAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Saving indicator */}
                    {autoPlanSaving && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Збереження...
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Drive Files Modal */}
      {showFilesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Файли Google Drive</h2>
              <button
                onClick={() => setShowFilesModal(false)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {driveFiles.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Файлів не знайдено у вашому Drive
                </p>
              ) : (
                <div className="space-y-2">
                  {driveFiles.map((file) => (
                    <a
                      key={file.id}
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                    >
                      {file.mimeType.includes('folder') ? (
                        <HardDrive className="h-5 w-5 text-yellow-500" />
                      ) : file.mimeType.includes('document') ? (
                        <FileText className="h-5 w-5 text-blue-500" />
                      ) : file.mimeType.includes('spreadsheet') ? (
                        <Table className="h-5 w-5 text-green-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {file.mimeType}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
