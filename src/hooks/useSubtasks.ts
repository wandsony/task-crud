import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: ["subtasks", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subtasks")
        .select("*")
        .eq("task_id", taskId)
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, title, position }: { taskId: string; title: string; position: number }) => {
      const { data, error } = await supabase
        .from("subtasks")
        .insert({ task_id: taskId, title, position })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ["subtasks", vars.taskId] }),
    onError: () => toast.error("Erro ao criar subtarefa."),
  });
}

export function useToggleSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed, taskId }: { id: string; completed: boolean; taskId: string }) => {
      const { error } = await supabase
        .from("subtasks")
        .update({ completed })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ["subtasks", vars.taskId] }),
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase.from("subtasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ["subtasks", vars.taskId] }),
  });
}
