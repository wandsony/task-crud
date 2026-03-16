
-- Create enum type for task status
CREATE TYPE public.task_status AS ENUM ('TODO', 'DOING', 'DONE');

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'TODO',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for this CRUD)
CREATE POLICY "Anyone can read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can create tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tasks" ON public.tasks FOR DELETE USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data
INSERT INTO public.tasks (title, description, status) VALUES
  ('Configurar ambiente de desenvolvimento', 'Instalar Node.js, Docker e configurar VS Code', 'DONE'),
  ('Criar API REST', 'Implementar endpoints CRUD para o backend', 'DOING'),
  ('Desenvolver frontend React', 'Criar componentes e páginas do CRUD', 'TODO'),
  ('Escrever testes unitários', 'Cobrir os principais fluxos com testes', 'TODO'),
  ('Deploy em produção', 'Configurar CI/CD e fazer deploy final', 'TODO');
