import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useLabels() {
  return useQuery({
    queryKey: ["labels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labels")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from("labels")
        .insert({ name, color, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["labels"] }),
    onError: () => toast.error("Erro ao criar label."),
  });
}

export function useDeleteLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("labels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      queryClient.invalidateQueries({ queryKey: ["task-labels"] });
    },
  });
}

export function useTaskLabels(taskId: string) {
  return useQuery({
    queryKey: ["task-labels", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_labels")
        .select("label_id, labels(*)")
        .eq("task_id", taskId);
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}

export function useToggleTaskLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, labelId, attached }: { taskId: string; labelId: string; attached: boolean }) => {
      if (attached) {
        const { error } = await supabase
          .from("task_labels")
          .delete()
          .eq("task_id", taskId)
          .eq("label_id", labelId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("task_labels")
          .insert({ task_id: taskId, label_id: labelId });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["task-labels", vars.taskId] });
    },
  });
}
