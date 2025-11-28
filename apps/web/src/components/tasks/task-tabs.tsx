"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface TaskTabsProps {
  activeTab: "schedule" | "backlog" | "done";
  onTabChange: (tab: "schedule" | "backlog" | "done") => void;
  scheduledCount: number;
  backlogCount: number;
  doneCount: number;
}

export function TaskTabs({
  activeTab,
  onTabChange,
  scheduledCount,
  backlogCount,
  doneCount,
}: TaskTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="schedule" className="gap-2">
          Schedule
          {scheduledCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {scheduledCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="backlog" className="gap-2">
          Backlog
          {backlogCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {backlogCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="done" className="gap-2">
          Done
          {doneCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {doneCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
