import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    target: "[data-tour='new-task']",
    title: "Criar Task",
    description: "Clique aqui para criar uma nova tarefa com título, descrição e status.",
    position: "bottom",
  },
  {
    target: "[data-tour='filters']",
    title: "Filtros",
    description: "Use a busca e os filtros de status para encontrar tasks rapidamente.",
    position: "bottom",
  },
  {
    target: "[data-tour='task-list']",
    title: "Lista de Tasks",
    description: "Aqui ficam suas tarefas. Clique para ver detalhes, editar ou excluir.",
    position: "top",
  },
  {
    target: "[data-tour='profile']",
    title: "Perfil",
    description: "Acesse seu perfil para editar nome e avatar.",
    position: "bottom",
  },
  {
    target: "[data-tour='chat']",
    title: "Assistente IA",
    description: "Converse com o assistente para tirar dúvidas sobre suas tasks.",
    position: "top",
  },
];

interface OnboardingTourProps {
  active: boolean;
  onComplete: () => void;
}

export function OnboardingTour({ active, onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [visible, setVisible] = useState(false);

  const positionTooltip = useCallback(() => {
    if (!active) return;
    const current = tourSteps[step];
    const el = document.querySelector(current.target);
    if (!el) {
      setVisible(false);
      return;
    }

    const rect = el.getBoundingClientRect();
    const style: React.CSSProperties = { position: "fixed", zIndex: 9999 };
    const gap = 12;

    switch (current.position) {
      case "bottom":
        style.top = rect.bottom + gap;
        style.left = Math.max(8, rect.left + rect.width / 2 - 150);
        break;
      case "top":
        style.bottom = window.innerHeight - rect.top + gap;
        style.left = Math.max(8, rect.left + rect.width / 2 - 150);
        break;
      case "left":
        style.top = rect.top + rect.height / 2 - 40;
        style.right = window.innerWidth - rect.left + gap;
        break;
      case "right":
        style.top = rect.top + rect.height / 2 - 40;
        style.left = rect.right + gap;
        break;
    }

    // Ensure left doesn't exceed viewport
    if (style.left && typeof style.left === "number") {
      style.left = Math.min(style.left, window.innerWidth - 320);
    }

    setTooltipStyle(style);
    setVisible(true);

    // Highlight element
    el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-lg", "relative", "z-[9998]");
    return () => {
      el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-lg", "relative", "z-[9998]");
    };
  }, [active, step]);

  useEffect(() => {
    const cleanup = positionTooltip();
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip);
    return () => {
      cleanup?.();
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("scroll", positionTooltip);
    };
  }, [positionTooltip]);

  if (!active || !visible) return null;

  const current = tourSteps[step];
  const isLast = step === tourSteps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-foreground/20 z-[9997]" />

      {/* Tooltip */}
      <div style={tooltipStyle} className="w-[300px] bg-card border rounded-xl shadow-xl p-4 animate-fade-in">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Passo {step + 1} de {tourSteps.length}
            </p>
            <h3 className="font-display font-bold text-foreground">{current.title}</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1" onClick={onComplete}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{current.description}</p>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-1 h-8"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
          {isLast ? (
            <Button size="sm" onClick={onComplete} className="font-display font-semibold h-8">
              Concluir
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep((s) => s + 1)} className="font-display font-semibold gap-1 h-8">
              Próximo <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
