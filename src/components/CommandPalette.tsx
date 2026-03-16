import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { StatusBadge } from "@/components/StatusBadge";
import { ClipboardList, LayoutDashboard, Plus, UserCircle, Search } from "lucide-react";
import { TaskStatus } from "@/types/task";

interface SearchResult {
  id: string;
  title: string;
  status: TaskStatus;
  description: string | null;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search tasks
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, description")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("updated_at", { ascending: false })
        .limit(8);

      if (data) setResults(data as SearchResult[]);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar...</span>
        <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar tasks, páginas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          {results.length > 0 && (
            <CommandGroup heading="Tasks">
              {results.map((task) => (
                <CommandItem key={task.id} onSelect={() => go(`/tasks/${task.id}`)} className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{task.title}</span>
                  <StatusBadge status={task.status} />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          <CommandGroup heading="Navegação">
            <CommandItem onSelect={() => go("/tasks")}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Lista de Tasks
            </CommandItem>
            <CommandItem onSelect={() => go("/dashboard")}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => go("/tasks/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Task
            </CommandItem>
            <CommandItem onSelect={() => go("/profile")}>
              <UserCircle className="mr-2 h-4 w-4" />
              Perfil
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
