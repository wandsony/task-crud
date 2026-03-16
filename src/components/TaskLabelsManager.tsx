import { useState } from "react";
import { useLabels, useCreateLabel, useDeleteLabel, useTaskLabels, useToggleTaskLabel } from "@/hooks/useLabels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Tag, Trash2, Check } from "lucide-react";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#6366f1", "#a855f7",
];

interface TaskLabelsManagerProps {
  taskId: string;
}

export function TaskLabelsManager({ taskId }: TaskLabelsManagerProps) {
  const { data: labels = [] } = useLabels();
  const { data: taskLabels = [] } = useTaskLabels(taskId);
  const createLabel = useCreateLabel();
  const deleteLabel = useDeleteLabel();
  const toggleLabel = useToggleTaskLabel();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[6]);

  const attachedIds = new Set(taskLabels.map((tl: any) => tl.label_id));

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createLabel.mutate({ name, color: newColor });
    setNewName("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-display font-medium text-muted-foreground">Labels</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
              <Tag className="h-3 w-3 mr-1" /> Gerenciar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium">Labels disponíveis</p>

              <div className="space-y-1 max-h-40 overflow-y-auto">
                {labels.map((label: any) => {
                  const isAttached = attachedIds.has(label.id);
                  return (
                    <div key={label.id} className="flex items-center gap-2 py-1">
                      <button
                        onClick={() =>
                          toggleLabel.mutate({ taskId, labelId: label.id, attached: isAttached })
                        }
                        className="flex items-center gap-2 flex-1 text-left rounded px-2 py-1 hover:bg-muted/50"
                      >
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ background: label.color }}
                        />
                        <span className="text-sm truncate">{label.name}</span>
                        {isAttached && <Check className="h-3 w-3 ml-auto text-primary" />}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => deleteLabel.mutate(label.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
                {labels.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">Nenhuma label criada.</p>
                )}
              </div>

              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Nova label</p>
                <div className="flex gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nome..."
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className="h-5 w-5 rounded-full border-2 transition-transform"
                      style={{
                        background: c,
                        borderColor: c === newColor ? "hsl(var(--foreground))" : "transparent",
                        transform: c === newColor ? "scale(1.2)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {taskLabels.map((tl: any) => (
          <Badge
            key={tl.label_id}
            variant="secondary"
            className="text-xs font-normal"
            style={{
              background: `${tl.labels?.color}20`,
              color: tl.labels?.color,
              borderColor: `${tl.labels?.color}40`,
            }}
          >
            {tl.labels?.name}
          </Badge>
        ))}
        {taskLabels.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma label atribuída.</p>
        )}
      </div>
    </div>
  );
}

/** Read-only label badges for lists */
export function TaskLabelBadges({ taskId }: { taskId: string }) {
  const { data: taskLabels = [] } = useTaskLabels(taskId);
  if (taskLabels.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {taskLabels.map((tl: any) => (
        <Badge
          key={tl.label_id}
          variant="secondary"
          className="text-[10px] px-1.5 py-0 font-normal"
          style={{
            background: `${tl.labels?.color}20`,
            color: tl.labels?.color,
            borderColor: `${tl.labels?.color}40`,
          }}
        >
          {tl.labels?.name}
        </Badge>
      ))}
    </div>
  );
}
