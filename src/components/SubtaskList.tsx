import { useState } from "react";
import { useSubtasks, useCreateSubtask, useToggleSubtask, useDeleteSubtask } from "@/hooks/useSubtasks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2 } from "lucide-react";

interface SubtaskListProps {
  taskId: string;
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const { data: subtasks = [], isLoading } = useSubtasks(taskId);
  const createSubtask = useCreateSubtask();
  const toggleSubtask = useToggleSubtask();
  const deleteSubtask = useDeleteSubtask();
  const [newTitle, setNewTitle] = useState("");

  const completed = subtasks.filter((s) => s.completed).length;
  const total = subtasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    createSubtask.mutate({ taskId, title, position: total });
    setNewTitle("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-medium text-muted-foreground">
          Subtarefas {total > 0 && `(${completed}/${total})`}
        </h3>
      </div>

      {total > 0 && (
        <Progress value={progress} className="h-2" />
      )}

      <div className="space-y-1">
        {subtasks.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group"
          >
            <Checkbox
              checked={sub.completed}
              onCheckedChange={(checked) =>
                toggleSubtask.mutate({ id: sub.id, completed: !!checked, taskId })
              }
            />
            <span
              className={`flex-1 text-sm ${
                sub.completed ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              {sub.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteSubtask.mutate({ id: sub.id, taskId })}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
        className="flex gap-2"
      >
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nova subtarefa..."
          className="h-8 text-sm"
        />
        <Button type="submit" size="sm" variant="outline" disabled={!newTitle.trim()}>
          <Plus className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
}
