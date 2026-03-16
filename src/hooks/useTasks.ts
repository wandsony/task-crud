import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskFormData, TaskStatus } from "@/types/task";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE = 6;

interface UseTasksOptions {
  page?: number;
  search?: string;
  status?: TaskStatus | "ALL";
}

export function useTasks({ page = 1, search = "", status = "ALL" }: UseTasksOptions = {}) {
  return useQuery({
    queryKey: ["tasks", page, search, status],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*", { count: "exact" });

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (status !== "ALL") {
        query = query.eq("status", status);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        tasks: data as Task[],
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
        page,
      };
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Task;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (formData: TaskFormData) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          due_date: formData.due_date || null,
          user_id: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task criada com sucesso!");
    },
    onError: () => toast.error("Erro ao criar task."),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...formData }: TaskFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          due_date: formData.due_date || null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task atualizada com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar task."),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task excluída com sucesso!");
    },
    onError: () => toast.error("Erro ao excluir task."),
  });
}
