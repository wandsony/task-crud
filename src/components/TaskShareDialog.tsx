import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Trash2, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Share {
  id: string;
  shared_with_email: string;
  permission: string;
  created_at: string;
}

export function TaskShareDialog({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchShares = async () => {
    const { data } = await supabase
      .from("task_shares")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });
    if (data) setShares(data as Share[]);
  };

  useEffect(() => {
    if (open) fetchShares();
  }, [open, taskId]);

  const handleShare = async () => {
    if (!email.trim() || !user) return;
    setIsLoading(true);

    const { error } = await supabase.from("task_shares").insert({
      task_id: taskId,
      owner_user_id: user.id,
      shared_with_email: email.trim().toLowerCase(),
      permission,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Esta task já foi compartilhada com este email.");
      } else {
        toast.error("Erro ao compartilhar task.");
      }
    } else {
      toast.success("Task compartilhada com sucesso!");
      setEmail("");
      fetchShares();
    }
    setIsLoading(false);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("task_shares").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover compartilhamento.");
    } else {
      fetchShares();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Compartilhar Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email do usuário..."
              type="email"
              className="flex-1"
            />
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">Ver</SelectItem>
                <SelectItem value="edit">Editar</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleShare} disabled={isLoading || !email.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            </Button>
          </div>

          {shares.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Compartilhado com:</p>
              {shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{share.shared_with_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {share.permission === "edit" ? "Pode editar" : "Somente visualizar"} · {format(new Date(share.created_at), "dd MMM", { locale: ptBR })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(share.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {shares.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum compartilhamento. Adicione o email de um usuário acima.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
