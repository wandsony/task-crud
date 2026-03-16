import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList, Search, MessageSquare, UserCircle, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnboardingWelcomeProps {
  open: boolean;
  onComplete: () => void;
}

const slides = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao Tasks!",
    description: "Seu gerenciador de tarefas inteligente. Vamos te mostrar como aproveitar ao máximo a plataforma.",
    color: "bg-primary",
  },
  {
    icon: ClipboardList,
    title: "Gerencie suas Tasks",
    description: "Crie, edite e organize suas tarefas com status TODO, DOING e DONE. Acompanhe tudo em um só lugar.",
    color: "bg-accent",
  },
  {
    icon: Search,
    title: "Filtre e Busque",
    description: "Use a barra de busca e os filtros de status para encontrar rapidamente o que precisa.",
    color: "bg-[hsl(38,92%,50%)]",
  },
  {
    icon: MessageSquare,
    title: "Assistente IA",
    description: "Converse com o assistente inteligente para tirar dúvidas e obter ajuda com suas tasks.",
    color: "bg-primary",
  },
  {
    icon: UserCircle,
    title: "Seu Perfil",
    description: "Personalize seu nome e avatar na página de perfil. Tudo pronto para começar!",
    color: "bg-accent",
  },
];

export function OnboardingWelcome({ open, onComplete }: OnboardingWelcomeProps) {
  const [step, setStep] = useState(0);
  const isLast = step === slides.length - 1;
  const slide = slides[step];
  const Icon = slide.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onComplete()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 border-0">
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <Progress value={((step + 1) / slides.length) * 100} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {step + 1} de {slides.length}
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center px-8 py-8 gap-5">
          <div className={`h-16 w-16 rounded-2xl ${slide.color} flex items-center justify-center shadow-lg`}>
            <Icon className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold tracking-tight text-foreground">
              {slide.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {slide.description}
            </p>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          {isLast ? (
            <Button onClick={onComplete} className="font-display font-semibold gap-1">
              Começar <Sparkles className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)} className="font-display font-semibold gap-1">
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
