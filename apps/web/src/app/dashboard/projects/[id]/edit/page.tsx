'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { API_URL } from '@/config/api';

interface Project {
  id: string;
  name: string;
  domain: string;
  targetKeywords: string[];
  competitors: string[];
}

export default function EditProjectPage() {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [targetKeywords, setTargetKeywords] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

      const data: Project = await response.json();
      setName(data.name);
      setDomain(data.domain);
      setTargetKeywords(data.targetKeywords?.join(', ') || '');
      setCompetitors(data.competitors?.join(', ') || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !domain.trim()) {
      setError('Name and domain are required');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setSaving(true);

    try {
      // Parse comma-separated values into arrays
      const keywordsArray = targetKeywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const competitorsArray = competitors
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim(),
          targetKeywords: keywordsArray,
          competitors: competitorsArray,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth/login');
          return;
        }
        const data = await response.json();
        throw new Error(data.message || 'Failed to update project');
      }

      router.push(`/dashboard/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => router.push(`/dashboard/projects/${projectId}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Project
            </Button>

            {/* Form Card */}
            <Card>
              <CardHeader>
                <CardTitle>Edit Project</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
                      {error}
                    </div>
                  )}

                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="My Website"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Domain Field */}
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      type="text"
                      placeholder="example.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      required
                    />
                  </div>

                  {/* Target Keywords Field */}
                  <div className="space-y-2">
                    <Label htmlFor="targetKeywords">Target Keywords</Label>
                    <textarea
                      id="targetKeywords"
                      placeholder="seo, marketing, web development"
                      value={targetKeywords}
                      onChange={(e) => setTargetKeywords(e.target.value)}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate keywords with commas
                    </p>
                  </div>

                  {/* Competitors Field */}
                  <div className="space-y-2">
                    <Label htmlFor="competitors">Competitors</Label>
                    <textarea
                      id="competitors"
                      placeholder="competitor1.com, competitor2.com"
                      value={competitors}
                      onChange={(e) => setCompetitors(e.target.value)}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate competitor domains with commas
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/projects/${projectId}`)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
