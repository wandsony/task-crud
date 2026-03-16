import { useNavigate } from "react-router-dom";
import { useCreateTask } from "@/hooks/useTasks";
import { TaskForm } from "@/components/TaskForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function TaskNew() {
  const navigate = useNavigate();
  const createTask = useCreateTask();

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
          <CardHeader>
            <CardTitle className="font-display text-xl">Nova Task</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm
              onSubmit={(data) =>
                createTask.mutate(data, { onSuccess: () => navigate("/tasks") })
              }
              isLoading={createTask.isPending}
              submitLabel="Criar Task"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
