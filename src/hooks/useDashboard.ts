import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TaskStatus } from "@/types/task";

interface DailyCount {
  date: string;
  created: number;
  completed: number;
}

interface RecentTask {
  id: string;
  title: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

interface DashboardData {
  total: number;
  todo: number;
  doing: number;
  done: number;
  completionRate: number;
  recentTasks: RecentTask[];
  dailyCounts: DailyCount[];
}

export function useDashboard(days: number = 14) {
  return useQuery({
    queryKey: ["dashboard", days],
    queryFn: async (): Promise<DashboardData> => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString();

      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("id, title, status, created_at, updated_at")
        .gte("created_at", sinceStr)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const total = tasks.length;
      const todo = tasks.filter((t) => t.status === "TODO").length;
      const doing = tasks.filter((t) => t.status === "DOING").length;
      const done = tasks.filter((t) => t.status === "DONE").length;
      const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

      const recentTasks = tasks.slice(0, 8) as RecentTask[];

      // Build daily counts for the selected period
      const now = new Date();
      const dailyCounts: DailyCount[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const created = tasks.filter(
          (t) => t.created_at.startsWith(dateStr)
        ).length;
        const completed = tasks.filter(
          (t) => t.status === "DONE" && t.updated_at.startsWith(dateStr)
        ).length;
        dailyCounts.push({ date: dateStr, created, completed });
      }

      return { total, todo, doing, done, completionRate, recentTasks, dailyCounts };
    },
  });
}
