'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Calendar } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  paymentStatus?: 'paid' | 'pending' | 'unpaid' | 'overdue';
  paymentDueDate?: string;
  budgetTotal?: number;
  budgetSpent?: number;
}

interface ProjectCardProps {
  project: Project;
}

// Payment status badge helper
const getPaymentStatusBadge = (status?: string, dueDate?: string) => {
  if (!status) return null;

  // Check if overdue (unpaid and past due date)
  const isOverdue = status === 'unpaid' && dueDate && new Date(dueDate) < new Date();
  const displayStatus = isOverdue ? 'overdue' : status;

  const config: Record<string, { bg: string; text: string; label: string }> = {
    paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Оплачено' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Очікує оплати' },
    unpaid: { bg: 'bg-red-100', text: 'text-red-700', label: 'Не оплачено' },
    overdue: { bg: 'bg-red-200', text: 'text-red-800', label: 'Прострочено' },
  };

  const { bg, text, label } = config[displayStatus] || config.unpaid;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  const formattedDate = new Date(project.createdAt).toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold">{project.name}</h3>
          {getPaymentStatusBadge(project.paymentStatus, project.paymentDueDate)}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>{project.domain}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
          {/* Budget progress bar */}
          {project.budgetTotal && project.budgetTotal > 0 && (
            <div className="pt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Бюджет</span>
                <span>{Math.round(((project.budgetSpent || 0) / project.budgetTotal) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (project.budgetSpent || 0) / project.budgetTotal > 0.9 ? 'bg-red-500' :
                    (project.budgetSpent || 0) / project.budgetTotal > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(((project.budgetSpent || 0) / project.budgetTotal) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
