import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "@/types/task";

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: "A Fazer", className: "bg-status-todo/15 text-status-todo border-status-todo/30" },
  DOING: { label: "Fazendo", className: "bg-status-doing/15 text-status-doing border-status-doing/30" },
  DONE: { label: "Concluída", className: "bg-status-done/15 text-status-done border-status-done/30" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
