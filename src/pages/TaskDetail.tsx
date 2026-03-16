import { useParams, Link, useNavigate } from "react-router-dom";
import { useTask, useDeleteTask } from "@/hooks/useTasks";
import { StatusBadge } from "@/components/StatusBadge";
import { TaskDeleteDialog } from "@/components/TaskDeleteDialog";
import { SubtaskList } from "@/components/SubtaskList";
import { TaskLabelsManager } from "@/components/TaskLabelsManager";
import { TaskComments } from "@/components/TaskComments";
import { TaskShareDialog } from "@/components/TaskShareDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Calendar, RefreshCw, CalendarClock, AlertTriangle } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id!);
  const deleteTask = useDeleteTask();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl py-8 px-4 sm:px-6">
          <Skeleton className="h-8 w-24 mb-6" />
          <Card>
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-display">Task não encontrada.</p>
          <Button asChild className="mt-4"><Link to="/tasks">Voltar</Link></Button>
        </div>
      </div>
    );
  }

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "DONE";
  const isDueToday = task.due_date && isToday(new Date(task.due_date));

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8 px-4 sm:px-6">
        <Button variant="ghost" asChild className="mb-6 font-display">
          <Link to="/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="font-display text-xl">{task.title}</CardTitle>
                <StatusBadge status={task.status} />
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <TaskShareDialog taskId={task.id} />
              <Button variant="outline" size="icon" asChild>
                <Link to={`/tasks/${task.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <TaskDeleteDialog
                taskTitle={task.title}
                onConfirm={() => deleteTask.mutate(task.id, { onSuccess: () => navigate("/tasks") })}
                isLoading={deleteTask.isPending}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {task.description && (
              <div>
                <h3 className="text-sm font-display font-medium text-muted-foreground mb-1">Descrição</h3>
                <p className="text-foreground whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Due date */}
            {task.due_date && (
              <div
                className={`flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 ${
                  isOverdue
                    ? "bg-destructive/10 text-destructive"
                    : isDueToday
                    ? "bg-[hsl(var(--status-doing))]/10 text-[hsl(var(--status-doing))]"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isOverdue ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CalendarClock className="h-4 w-4" />
                )}
                Prazo: {format(new Date(task.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                {isOverdue && " — Atrasada!"}
                {isDueToday && " — Vence hoje!"}
              </div>
            )}

            {/* Labels */}
            <TaskLabelsManager taskId={task.id} />

            {/* Subtasks */}
            <SubtaskList taskId={task.id} />

            {/* Comments */}
            <TaskComments taskId={task.id} />

            <div className="flex gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Criada em {format(new Date(task.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizada em {format(new Date(task.updated_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
