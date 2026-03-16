
-- Add due_date to tasks
ALTER TABLE public.tasks ADD COLUMN due_date timestamp with time zone DEFAULT NULL;

-- Create labels table
CREATE TABLE public.labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own labels" ON public.labels
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create task_labels junction table
CREATE TABLE public.task_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(task_id, label_id)
);

ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own task labels" ON public.task_labels
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid())
  );

-- Create subtasks table
CREATE TABLE public.subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subtasks" ON public.subtasks
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid())
  );
