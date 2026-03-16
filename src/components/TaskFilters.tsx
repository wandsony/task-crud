import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { TaskStatus } from "@/types/task";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: TaskStatus | "ALL";
  onStatusChange: (value: TaskStatus | "ALL") => void;
}

export function TaskFilters({ search, onSearchChange, status, onStatusChange }: TaskFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={status} onValueChange={(v) => onStatusChange(v as TaskStatus | "ALL")}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          <SelectItem value="TODO">A Fazer</SelectItem>
          <SelectItem value="DOING">Fazendo</SelectItem>
          <SelectItem value="DONE">Concluída</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
