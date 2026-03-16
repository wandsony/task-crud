import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Send, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user_email?: string;
}

export function TaskComments({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (!error && data) setComments(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments-${taskId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${taskId}` },
        () => fetchComments()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [taskId]);

  const handleSend = async () => {
    if (!content.trim() || !user) return;
    setIsSending(true);
    const { error } = await supabase
      .from("task_comments")
      .insert({ task_id: taskId, user_id: user.id, content: content.trim() });

    if (error) {
      toast.error("Erro ao enviar comentário");
    } else {
      setContent("");
    }
    setIsSending(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("task_comments").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir comentário");
  };

  const getInitials = (email?: string) => {
    if (!email) return "?";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div>
      <h3 className="text-sm font-display font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Comentários ({comments.length})
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-foreground">
                    {comment.user_id === user?.id ? "Você" : "Usuário"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
              </div>
              {comment.user_id === user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Adicionar um comentário..."
          className="min-h-[60px] text-sm resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
          }}
        />
        <Button
          size="icon"
          className="shrink-0 self-end"
          onClick={handleSend}
          disabled={isSending || !content.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Ctrl+Enter para enviar</p>
    </div>
  );
}
