'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  TrendingUp,
  Search,
  MousePointerClick,
  Eye,
  Target,
  Link2,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { API_URL } from '@/config/api';

interface GscPerformance {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  startDate: string;
  endDate: string;
}

interface GscQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface AhrefsMetrics {
  domain: string;
  domainRating: number;
  urlRating: number;
  backlinks: number;
  referringDomains: number;
  organicKeywords: number;
  organicTraffic: number;
}

interface AhrefsKeyword {
  keyword: string;
  volume: number;
  difficulty: number;
  position: number;
  traffic: number;
}

interface SerpstatOverview {
  domain: string;
  organicKeywords: number;
  organicTraffic: number;
  visibilityIndex: number;
  serpstatRank: number;
}

interface SerpstatKeyword {
  keyword: string;
  position: number;
  volume: number;
  trafficPercent: number;
}

interface SeoMetricsResponse {
  gsc: {
    connected: boolean;
    propertyUrl: string | null;
    data?: {
      performance: GscPerformance;
      topQueries: GscQuery[];
    };
    error?: string;
  };
  ahrefs: {
    connected: boolean;
    data?: {
      metrics: AhrefsMetrics;
      topKeywords: AhrefsKeyword[];
    };
    error?: string;
  };
  serpstat: {
    connected: boolean;
    data?: {
      overview: SerpstatOverview;
      topKeywords: SerpstatKeyword[];
    };
    error?: string;
  };
}

interface ProjectSEODashboardProps {
  projectId: string;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  suffix = '',
  decimals = 0
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  suffix?: string;
  decimals?: number;
}) {
  const formattedValue = decimals > 0
    ? value.toFixed(decimals)
    : value.toLocaleString();

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{formattedValue}{suffix}</p>
      </div>
    </div>
  );
}

function NotConnectedState({ service, settingsLink }: { service: string; settingsLink?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
        <Link2 className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        {service} not connected
      </p>
      {settingsLink && (
        <a
          href={settingsLink}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Connect in Settings <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-lg text-destructive">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function ProjectSEODashboard({ projectId }: ProjectSEODashboardProps) {
  const [data, setData] = useState<SeoMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeoMetrics = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/projects/${projectId}/seo-metrics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch SEO metrics');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSeoMetrics();
  }, [projectId]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-lg">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <LoadingState />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <ErrorState message={error} />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">SEO Dashboard</h2>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Google Search Console Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Google Search Console
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!data.gsc.connected ? (
              <NotConnectedState service="Google" settingsLink="/dashboard/settings" />
            ) : data.gsc.error ? (
              <ErrorState message={data.gsc.error} />
            ) : data.gsc.data ? (
              <>
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Clicks"
                    value={data.gsc.data.performance.clicks}
                    icon={MousePointerClick}
                  />
                  <MetricCard
                    label="Impressions"
                    value={data.gsc.data.performance.impressions}
                    icon={Eye}
                  />
                  <MetricCard
                    label="CTR"
                    value={data.gsc.data.performance.ctr}
                    icon={Target}
                    suffix="%"
                    decimals={2}
                  />
                  <MetricCard
                    label="Avg Position"
                    value={data.gsc.data.performance.position}
                    icon={TrendingUp}
                    decimals={1}
                  />
                </div>

                {/* Top Queries */}
                {data.gsc.data.topQueries.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Top Queries</h4>
                    <div className="space-y-2">
                      {data.gsc.data.topQueries.map((query, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded"
                        >
                          <span className="truncate flex-1 mr-2" title={query.query}>
                            {query.query}
                          </span>
                          <span className="text-muted-foreground whitespace-nowrap">
                            {query.clicks} clicks
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  Data for last 28 days
                </p>
              </>
            ) : (
              <LoadingState />
            )}
          </CardContent>
        </Card>

        {/* Ahrefs Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Ahrefs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!data.ahrefs.connected ? (
              <NotConnectedState service="Ahrefs" settingsLink="/dashboard/settings" />
            ) : data.ahrefs.error ? (
              <ErrorState message={data.ahrefs.error} />
            ) : data.ahrefs.data ? (
              <>
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Domain Rating"
                    value={data.ahrefs.data.metrics.domainRating}
                    icon={BarChart3}
                  />
                  <MetricCard
                    label="Organic Traffic"
                    value={data.ahrefs.data.metrics.organicTraffic}
                    icon={TrendingUp}
                  />
                  <MetricCard
                    label="Organic Keywords"
                    value={data.ahrefs.data.metrics.organicKeywords}
                    icon={Search}
                  />
                  <MetricCard
                    label="Backlinks"
                    value={data.ahrefs.data.metrics.backlinks}
                    icon={Link2}
                  />
                </div>

                {/* Top Keywords */}
                {data.ahrefs.data.topKeywords.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Top Keywords</h4>
                    <div className="space-y-2">
                      {data.ahrefs.data.topKeywords.map((kw, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded"
                        >
                          <span className="truncate flex-1 mr-2" title={kw.keyword}>
                            {kw.keyword}
                          </span>
                          <span className="text-muted-foreground whitespace-nowrap">
                            #{kw.position}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <LoadingState />
            )}
          </CardContent>
        </Card>

        {/* Serpstat Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-green-600" />
              Serpstat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!data.serpstat.connected ? (
              <NotConnectedState service="Serpstat" settingsLink="/dashboard/settings" />
            ) : data.serpstat.error ? (
              <ErrorState message={data.serpstat.error} />
            ) : data.serpstat.data ? (
              <>
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Visibility"
                    value={data.serpstat.data.overview.visibilityIndex}
                    icon={Eye}
                    decimals={2}
                  />
                  <MetricCard
                    label="Organic Traffic"
                    value={data.serpstat.data.overview.organicTraffic}
                    icon={TrendingUp}
                  />
                  <MetricCard
                    label="Organic Keywords"
                    value={data.serpstat.data.overview.organicKeywords}
                    icon={Search}
                  />
                  <MetricCard
                    label="Serpstat Rank"
                    value={data.serpstat.data.overview.serpstatRank}
                    icon={BarChart3}
                  />
                </div>

                {/* Top Keywords */}
                {data.serpstat.data.topKeywords.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Top Keywords</h4>
                    <div className="space-y-2">
                      {data.serpstat.data.topKeywords.map((kw, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded"
                        >
                          <span className="truncate flex-1 mr-2" title={kw.keyword}>
                            {kw.keyword}
                          </span>
                          <span className="text-muted-foreground whitespace-nowrap">
                            #{kw.position}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <LoadingState />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
