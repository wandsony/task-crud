import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTasks, useDeleteTask } from "@/hooks/useTasks";
import { TaskStatus } from "@/types/task";
import { TaskFilters } from "@/components/TaskFilters";
import { TaskPagination } from "@/components/TaskPagination";
import { TaskDeleteDialog } from "@/components/TaskDeleteDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { TaskLabelBadges } from "@/components/TaskLabelsManager";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Eye, Pencil, ClipboardList, LogOut, UserCircle, LayoutDashboard, Columns3, List, CalendarClock } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TaskChat } from "@/components/TaskChat";
import { CommandPalette } from "@/components/CommandPalette";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingWelcome } from "@/components/OnboardingWelcome";
import { OnboardingTour } from "@/components/OnboardingTour";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";

export default function TasksList() {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const { signOut, user } = useAuth();
  const onboarding = useOnboarding();

  const { data, isLoading } = useTasks({ page, search: debouncedSearch, status });
  const deleteTask = useDeleteTask();

  const [showTour, setShowTour] = useState(false);
  const [checklistDismissed, setChecklistDismissed] = useState(false);

  // Track filter usage
  useEffect(() => {
    if (debouncedSearch || status !== "ALL") {
      onboarding.completeChecklistItem("filterTasks");
    }
  }, [debouncedSearch, status]);

  const handleStatusChange = (newStatus: TaskStatus | "ALL") => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">Tasks</h1>
              <p className="text-sm text-muted-foreground">
                {data ? `${data.total} task${data.total !== 1 ? "s" : ""}` : "Carregando..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CommandPalette />
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <div className="flex border rounded-md">
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-r-none"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "kanban" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-l-none"
                onClick={() => setView("kanban")}
              >
                <Columns3 className="h-4 w-4" />
              </Button>
            </div>
            <Button asChild className="font-display font-semibold" data-tour="new-task">
              <Link to="/tasks/new" onClick={() => onboarding.completeChecklistItem("createTask")}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Task
              </Link>
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild title="Perfil" data-tour="profile">
              <Link to="/profile" onClick={() => onboarding.completeChecklistItem("viewProfile")}>
                <UserCircle className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-8">{user?.email}</p>

        {view === "kanban" ? (
          <div className="mb-6">
            <KanbanBoard />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="mb-6" data-tour="filters">
              <TaskFilters
                search={search}
                onSearchChange={handleSearchChange}
                status={status}
                onStatusChange={handleStatusChange}
              />
            </div>

            {/* List */}
            <div className="space-y-3" data-tour="task-list">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-5 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </Card>
                ))
              ) : data?.tasks.length === 0 ? (
                <Card className="p-12 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground font-display font-medium">Nenhuma task encontrada</p>
                  <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou crie uma nova task.</p>
                </Card>
              ) : (
                data?.tasks.map((task) => (
                  <Card
                    key={task.id}
                    className="p-4 flex items-center gap-4 animate-fade-in hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="font-display font-semibold text-foreground hover:text-primary truncate transition-colors"
                        >
                          {task.title}
                        </Link>
                        <StatusBadge status={task.status} />
                        {task.due_date && (
                          <span
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
                          </span>
                        )}
                      </div>
                      <TaskLabelBadges taskId={task.id} />
                      {task.description && (
                        <p className="text-sm text-muted-foreground truncate mt-1">{task.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(task.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/tasks/${task.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/tasks/${task.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <TaskDeleteDialog
                        taskTitle={task.title}
                        onConfirm={() => deleteTask.mutate(task.id)}
                        isLoading={deleteTask.isPending}
                      />
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {data && (
              <TaskPagination
                page={data.page}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
      <div data-tour="chat">
        <TaskChat onMessageSent={() => onboarding.completeChecklistItem("useChat")} />
      </div>

      {/* Onboarding */}
      <OnboardingWelcome
        open={!onboarding.welcomeCompleted}
        onComplete={() => {
          onboarding.completeWelcome();
          if (!onboarding.tourCompleted) setShowTour(true);
        }}
      />
      <OnboardingTour
        active={showTour}
        onComplete={() => {
          setShowTour(false);
          onboarding.completeTour();
        }}
      />
      {!checklistDismissed && onboarding.welcomeCompleted && (
        <OnboardingChecklist
          checklist={onboarding.checklist}
          progress={onboarding.checklistProgress}
          total={onboarding.checklistTotal}
          onDismiss={() => setChecklistDismissed(true)}
        />
      )}
    </div>
  );
}
