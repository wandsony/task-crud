import { useParams, useNavigate, Link } from "react-router-dom";
import { useTask, useUpdateTask } from "@/hooks/useTasks";
import { TaskForm } from "@/components/TaskForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function TaskEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id!);
  const updateTask = useUpdateTask();
  const { completeChecklistItem } = useOnboarding();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl py-8 px-4 sm:px-6">
          <Skeleton className="h-8 w-24 mb-6" />
          <Card>
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-display">Task não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8 px-4 sm:px-6">
        <Button variant="ghost" asChild className="mb-6 font-display">
          <Link to={`/tasks/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Editar Task</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm
              defaultValues={{
                title: task.title,
                description: task.description ?? "",
                status: task.status,
                due_date: task.due_date ?? null,
              }}
              onSubmit={(data) =>
                updateTask.mutate(
                  { ...data, id: task.id },
                  { onSuccess: () => {
                    completeChecklistItem("editTask");
                    navigate(`/tasks/${task.id}`);
                  }}
                )
              }
              isLoading={updateTask.isPending}
              submitLabel="Atualizar Task"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
