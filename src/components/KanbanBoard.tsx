import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskStatus } from "@/types/task";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskLabelBadges } from "@/components/TaskLabelsManager";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "A Fazer" },
  { status: "DOING", label: "Em Andamento" },
  { status: "DONE", label: "Concluídas" },
];

export function KanbanBoard() {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["kanban-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Erro ao mover tarefa."),
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as TaskStatus;
    const taskId = result.draggableId;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    updateStatus.mutate({ id: taskId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <StatusBadge status={col.status} />
                <span className="text-xs text-muted-foreground font-medium">
                  {columnTasks.length}
                </span>
              </div>
              <Droppable droppableId={col.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] rounded-lg border-2 border-dashed p-2 space-y-2 transition-colors ${
                      snapshot.isDraggingOver
                        ? "border-primary/50 bg-primary/5"
                        : "border-transparent"
                    }`}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 cursor-grab active:cursor-grabbing transition-shadow ${
                              snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""
                            }`}
                          >
                            <Link
                              to={`/tasks/${task.id}`}
                              className="font-display font-semibold text-sm hover:text-primary transition-colors line-clamp-2"
                            >
                              {task.title}
                            </Link>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="mt-2 space-y-1.5">
                              <TaskLabelBadges taskId={task.id} />
                              {task.due_date && (
                                <div
                                  className={`flex items-center gap-1 text-[10px] font-medium ${
                                    isPast(new Date(task.due_date)) && task.status !== "DONE"
                                      ? "text-destructive"
                                      : isToday(new Date(task.due_date))
                                      ? "text-[hsl(var(--status-doing))]"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  <CalendarClock className="h-3 w-3" />
                                  {format(new Date(task.due_date), "dd/MM", { locale: ptBR })}
                                </div>
                              )}
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {columnTasks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Arraste tarefas aqui
                      </p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
