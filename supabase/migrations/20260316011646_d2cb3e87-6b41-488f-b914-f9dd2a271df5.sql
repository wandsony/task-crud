
-- Task shares table (must be first since comments RLS references it)
CREATE TABLE public.task_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, shared_with_email)
);

ALTER TABLE public.task_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage shares"
  ON public.task_shares FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Shared users can view their shares"
  ON public.task_shares FOR SELECT TO authenticated
  USING (shared_with_user_id = auth.uid());

-- Task comments table
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their tasks"
  ON public.task_comments FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR 
    task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid()) OR
    task_id IN (SELECT task_id FROM public.task_shares WHERE shared_with_user_id = auth.uid())
  );

CREATE POLICY "Users can insert comments"
  ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON public.task_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
