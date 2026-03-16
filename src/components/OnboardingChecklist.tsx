import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle2, Circle, ChevronUp, ChevronDown, Rocket, X } from "lucide-react";

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
}

const items: ChecklistItem[] = [
  { key: "createTask", label: "Criar uma task", description: "Crie sua primeira tarefa" },
  { key: "editTask", label: "Editar uma task", description: "Edite título, descrição ou status" },
  { key: "filterTasks", label: "Usar filtros", description: "Filtre por status ou pesquise" },
  { key: "viewProfile", label: "Ver seu perfil", description: "Acesse a página de perfil" },
  { key: "useChat", label: "Usar o assistente IA", description: "Envie uma mensagem no chat" },
];

interface OnboardingChecklistProps {
  checklist: Record<string, boolean>;
  progress: number;
  total: number;
  onDismiss: () => void;
}

export function OnboardingChecklist({ checklist, progress, total, onDismiss }: OnboardingChecklistProps) {
  const [open, setOpen] = useState(true);
  const percentage = Math.round((progress / total) * 100);
  const allDone = progress === total;

  if (allDone) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[300px]">
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="shadow-xl border overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <Rocket className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-display font-bold text-sm text-foreground">Primeiros passos</p>
                  <p className="text-xs text-muted-foreground">{progress}/{total} completos</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDismiss(); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
                {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>
          </CollapsibleTrigger>

          <div className="px-4 pb-1">
            <Progress value={percentage} className="h-1.5" />
          </div>

          <CollapsibleContent>
            <div className="p-3 pt-2 space-y-1">
              {items.map((item) => {
                const done = checklist[item.key];
                return (
                  <div
                    key={item.key}
                    className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                      done ? "opacity-60" : "hover:bg-muted/50"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-accent mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
