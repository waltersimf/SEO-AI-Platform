'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Globe, Calendar, Pencil, Trash2, Tag, Users, Link2, Check, Loader2 } from 'lucide-react';
import { API_URL } from '@/config/api';

interface Project {
  id: string;
  name: string;
  domain: string;
  targetKeywords: string[];
  competitors: string[];
  gscPropertyUrl: string | null;
  gaPropertyId: string | null;
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
  const [savingIntegrations, setSavingIntegrations] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [integrationSuccess, setIntegrationSuccess] = useState(false);

  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

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
          <div className="p-8">
            <div className="max-w-4xl mx-auto space-y-8">
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
        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-8">
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
                    Google Integration
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
                        onClick={() => window.location.href = `${API_URL}/api/integrations/google/connect`}
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

                      {/* GSC Property Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Google Search Console</label>
                        {gscProperties.length > 0 ? (
                          <select
                            value={selectedGsc}
                            onChange={(e) => setSelectedGsc(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">Select a property...</option>
                            {gscProperties.map((prop) => (
                              <option key={prop.siteUrl} value={prop.siteUrl}>
                                {prop.siteUrl}
                              </option>
                            ))}
                          </select>
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

                      {/* GA4 Property Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Google Analytics 4</label>
                        {gaProperties.length > 0 ? (
                          <select
                            value={selectedGa}
                            onChange={(e) => setSelectedGa(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">Select a property...</option>
                            {gaProperties.map((prop) => (
                              <option key={prop.propertyId} value={prop.propertyId}>
                                {prop.displayName} ({prop.propertyId})
                              </option>
                            ))}
                          </select>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
