'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Globe, Calendar, Pencil, Trash2, Tag, Users, Link2, Check, Loader2, ChevronsUpDown, Search, CreditCard } from 'lucide-react';
import { API_URL } from '@/config/api';
import { ProjectSEODashboard } from '@/components/projects/project-seo-dashboard';

interface Project {
  id: string;
  name: string;
  domain: string;
  targetKeywords: string[];
  competitors: string[];
  gscPropertyUrl: string | null;
  gaPropertyId: string | null;
  serpstatProjectId: string | null;
  paymentStatus: 'paid' | 'pending' | 'unpaid' | 'overdue';
  paymentDueDate: string | null;
  budgetTotal: number | null;
  budgetSpent: number | null;
  lastPaymentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GscProperty {
  siteUrl: string;
  permissionLevel: string;
}

interface GaProperty {
  propertyId: string;
  displayName: string;
}

export default function ProjectDetailPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Google integration state
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(true);
  const [gscProperties, setGscProperties] = useState<GscProperty[]>([]);
  const [gaProperties, setGaProperties] = useState<GaProperty[]>([]);
  const [selectedGsc, setSelectedGsc] = useState<string>('');
  const [selectedGa, setSelectedGa] = useState<string>('');
  const [gscSearchQuery, setGscSearchQuery] = useState('');
  const [gscDropdownOpen, setGscDropdownOpen] = useState(false);
  const [gaSearchQuery, setGaSearchQuery] = useState('');
  const [gaDropdownOpen, setGaDropdownOpen] = useState(false);
  const [selectedSerpstatProjectId, setSelectedSerpstatProjectId] = useState<string>('');
  const [savingIntegrations, setSavingIntegrations] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [integrationSuccess, setIntegrationSuccess] = useState(false);

  // Payment tracking state
  const [paymentStatus, setPaymentStatus] = useState<string>('unpaid');
  const [paymentDueDate, setPaymentDueDate] = useState<string>('');
  const [budgetTotal, setBudgetTotal] = useState<string>('');
  const [budgetSpent, setBudgetSpent] = useState<string>('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  // Filter GSC properties based on search query
  const filteredGscProperties = useMemo(() => {
    if (!gscSearchQuery.trim()) return gscProperties;
    const query = gscSearchQuery.toLowerCase();
    return gscProperties.filter((prop) =>
      prop.siteUrl.toLowerCase().includes(query)
    );
  }, [gscProperties, gscSearchQuery]);

  // Get selected GSC property
  const selectedGscProperty = useMemo(() => {
    return gscProperties.find((p) => p.siteUrl === selectedGsc);
  }, [gscProperties, selectedGsc]);

  // Filter GA4 properties based on search query
  const filteredGaProperties = useMemo(() => {
    if (!gaSearchQuery.trim()) return gaProperties;
    const query = gaSearchQuery.toLowerCase();
    return gaProperties.filter(
      (prop) =>
        prop.displayName.toLowerCase().includes(query) ||
        prop.propertyId.toLowerCase().includes(query)
    );
  }, [gaProperties, gaSearchQuery]);

  // Get selected GA4 property display name
  const selectedGaProperty = useMemo(() => {
    return gaProperties.find((p) => p.propertyId === selectedGa);
  }, [gaProperties, selectedGa]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchProject(token);
    checkGoogleConnection(token);
  }, [router, projectId]);

  const fetchProject = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth/login');
          return;
        }
        if (response.status === 404) {
          throw new Error('Project not found');
        }
        throw new Error('Failed to fetch project');
      }

      const data = await response.json();
      setProject(data);
      // Initialize selected values from project data
      setSelectedGsc(data.gscPropertyUrl || '');
      setSelectedGa(data.gaPropertyId || '');
      setSelectedSerpstatProjectId(data.serpstatProjectId || '');
      // Initialize payment state
      setPaymentStatus(data.paymentStatus || 'unpaid');
      setPaymentDueDate(data.paymentDueDate ? data.paymentDueDate.split('T')[0] : '');
      setBudgetTotal(data.budgetTotal?.toString() || '');
      setBudgetSpent(data.budgetSpent?.toString() || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleConnection = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/integrations/google`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Check for connected flag in response
        if (data && data.connected) {
          setGoogleConnected(true);
          fetchGoogleProperties(token);
        }
      } else if (response.status === 404) {
        // Integration not found - not connected
        setGoogleConnected(false);
      }
    } catch (err) {
      console.error('Error checking Google connection:', err);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const fetchGoogleProperties = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/integrations/google/properties`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGscProperties(data.gscProperties || []);
        setGaProperties(data.gaProperties || []);
      }
    } catch (err) {
      console.error('Error fetching Google properties:', err);
    }
  };

  const handleSaveIntegrations = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setSavingIntegrations(true);
    setIntegrationError(null);
    setIntegrationSuccess(false);

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gscPropertyUrl: selectedGsc || null,
          gaPropertyId: selectedGa || null,
          serpstatProjectId: selectedSerpstatProjectId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save integrations');
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      setIntegrationSuccess(true);
      setTimeout(() => setIntegrationSuccess(false), 3000);
    } catch (err) {
      setIntegrationError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSavingIntegrations(false);
    }
  };

  const handleSavePayment = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setSavingPayment(true);
    setPaymentError(null);
    setPaymentSuccess(false);

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentStatus,
          paymentDueDate: paymentDueDate || undefined,
          budgetTotal: budgetTotal ? parseFloat(budgetTotal) : undefined,
          budgetSpent: budgetSpent ? parseFloat(budgetSpent) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Не вдалося зберегти дані оплати');
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 3000);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Виникла помилка');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to delete project');
      }

      router.push('/dashboard/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="space-y-8">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/projects')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                {error}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const formattedCreatedDate = new Date(project.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedUpdatedDate = new Date(project.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="space-y-8">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/projects')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>{project.domain}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <Card className="border-destructive">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Delete Project</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Are you sure you want to delete "{project.name}"? This action cannot be undone.
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          disabled={deleting}
                        >
                          {deleting ? 'Deleting...' : 'Yes, Delete'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={deleting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Info Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Domain</p>
                      <p className="font-medium">{project.domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{formattedCreatedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{formattedUpdatedDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Target Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.targetKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {project.targetKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No keywords added yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Competitors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Competitors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.competitors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {project.competitors.map((competitor, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium"
                        >
                          {competitor}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No competitors added yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Integrations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    SEO Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingGoogle ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Checking connection...</span>
                    </div>
                  ) : !googleConnected ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect your Google account to link Search Console and Analytics properties.
                      </p>
                      <Button
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          window.location.href = `${API_URL}/api/integrations/google/connect?token=${token}`;
                        }}
                      >
                        Connect Google Account
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Success/Error Messages */}
                      {integrationSuccess && (
                        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                          <Check className="h-4 w-4" />
                          Integrations saved successfully!
                        </div>
                      )}
                      {integrationError && (
                        <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                          {integrationError}
                        </div>
                      )}

                      {/* GSC Property Selection with Search */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Google Search Console</label>
                        {gscProperties.length > 0 ? (
                          <Popover open={gscDropdownOpen} onOpenChange={setGscDropdownOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={gscDropdownOpen}
                                className="w-full justify-between font-normal"
                              >
                                {selectedGscProperty
                                  ? selectedGscProperty.siteUrl
                                  : 'Select a property...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <div className="flex items-center border-b px-3">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                <Input
                                  placeholder="Пошук GSC property..."
                                  value={gscSearchQuery}
                                  onChange={(e) => setGscSearchQuery(e.target.value)}
                                  className="flex h-10 w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>
                              <div className="max-h-60 overflow-y-auto">
                                {filteredGscProperties.length === 0 ? (
                                  <div className="py-6 text-center text-sm text-muted-foreground">
                                    Не знайдено
                                  </div>
                                ) : (
                                  <div className="p-1">
                                    {filteredGscProperties.map((prop) => (
                                      <button
                                        key={prop.siteUrl}
                                        onClick={() => {
                                          setSelectedGsc(prop.siteUrl);
                                          setGscDropdownOpen(false);
                                          setGscSearchQuery('');
                                        }}
                                        className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                                          selectedGsc === prop.siteUrl ? 'bg-accent' : ''
                                        }`}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            selectedGsc === prop.siteUrl ? 'opacity-100' : 'opacity-0'
                                          }`}
                                        />
                                        <span className="truncate">{prop.siteUrl}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No Search Console properties found
                          </p>
                        )}
                        {project.gscPropertyUrl && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Connected: {project.gscPropertyUrl}
                          </p>
                        )}
                      </div>

                      {/* GA4 Property Selection with Search */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Google Analytics 4</label>
                        {gaProperties.length > 0 ? (
                          <Popover open={gaDropdownOpen} onOpenChange={setGaDropdownOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={gaDropdownOpen}
                                className="w-full justify-between font-normal"
                              >
                                {selectedGaProperty
                                  ? `${selectedGaProperty.displayName} (${selectedGaProperty.propertyId})`
                                  : 'Select a property...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <div className="flex items-center border-b px-3">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                <Input
                                  placeholder="Пошук GA4 property..."
                                  value={gaSearchQuery}
                                  onChange={(e) => setGaSearchQuery(e.target.value)}
                                  className="flex h-10 w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>
                              <div className="max-h-60 overflow-y-auto">
                                {filteredGaProperties.length === 0 ? (
                                  <div className="py-6 text-center text-sm text-muted-foreground">
                                    Не знайдено
                                  </div>
                                ) : (
                                  <div className="p-1">
                                    {filteredGaProperties.map((prop) => (
                                      <button
                                        key={prop.propertyId}
                                        onClick={() => {
                                          setSelectedGa(prop.propertyId);
                                          setGaDropdownOpen(false);
                                          setGaSearchQuery('');
                                        }}
                                        className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                                          selectedGa === prop.propertyId ? 'bg-accent' : ''
                                        }`}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            selectedGa === prop.propertyId ? 'opacity-100' : 'opacity-0'
                                          }`}
                                        />
                                        <div className="flex flex-col items-start">
                                          <span>{prop.displayName}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {prop.propertyId}
                                          </span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No Analytics properties found
                          </p>
                        )}
                        {project.gaPropertyId && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Connected: {project.gaPropertyId}
                          </p>
                        )}
                      </div>

                      {/* Serpstat Project ID */}
                      <div className="space-y-2 pt-4 border-t">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Search className="h-4 w-4 text-green-600" />
                          Serpstat Project ID
                        </label>
                        <Input
                          type="text"
                          placeholder="ID проекту для моніторингу позицій"
                          value={selectedSerpstatProjectId}
                          onChange={(e) => setSelectedSerpstatProjectId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Знайдіть ID в URL проекту Serpstat: serpstat.com/rank-tracker/project/<strong>ID</strong>/
                        </p>
                        {project.serpstatProjectId && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Connected: {project.serpstatProjectId}
                          </p>
                        )}
                      </div>

                      {/* Save Button */}
                      <Button
                        onClick={handleSaveIntegrations}
                        disabled={savingIntegrations}
                        className="w-full"
                      >
                        {savingIntegrations ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Integrations'
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Payment Tracking */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Оплата
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Success/Error Messages */}
                  {paymentSuccess && (
                    <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                      <Check className="h-4 w-4" />
                      Дані оплати збережено!
                    </div>
                  )}
                  {paymentError && (
                    <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                      {paymentError}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Status selector */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Статус оплати</label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="paid">Оплачено</option>
                        <option value="pending">Очікує оплати</option>
                        <option value="unpaid">Не оплачено</option>
                        <option value="overdue">Прострочено</option>
                      </select>
                    </div>

                    {/* Due date */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Дата оплати</label>
                      <Input
                        type="date"
                        value={paymentDueDate}
                        onChange={(e) => setPaymentDueDate(e.target.value)}
                      />
                    </div>

                    {/* Budget Total */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Бюджет (грн)</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={budgetTotal}
                        onChange={(e) => setBudgetTotal(e.target.value)}
                      />
                    </div>

                    {/* Budget Spent */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Витрачено (грн)</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={budgetSpent}
                        onChange={(e) => setBudgetSpent(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Budget progress bar */}
                  {budgetTotal && parseFloat(budgetTotal) > 0 && (
                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Використано бюджету</span>
                        <span className="font-medium">
                          {Math.round(((parseFloat(budgetSpent) || 0) / parseFloat(budgetTotal)) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (parseFloat(budgetSpent) || 0) / parseFloat(budgetTotal) > 0.9 ? 'bg-red-500' :
                            (parseFloat(budgetSpent) || 0) / parseFloat(budgetTotal) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(((parseFloat(budgetSpent) || 0) / parseFloat(budgetTotal)) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{parseFloat(budgetSpent) || 0} грн</span>
                        <span>{parseFloat(budgetTotal)} грн</span>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <Button
                    onClick={handleSavePayment}
                    disabled={savingPayment}
                    className="w-full"
                  >
                    {savingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Збереження...
                      </>
                    ) : (
                      'Зберегти дані оплати'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* SEO Dashboard */}
            <ProjectSEODashboard projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}
