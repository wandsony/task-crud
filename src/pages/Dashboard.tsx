import { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LayoutDashboard,
  ClipboardList,
  ListTodo,
  Loader,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  LogOut,
  UserCircle,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportCSV, exportPDF } from "@/lib/exportDashboard";
import { CommandPalette } from "@/components/CommandPalette";

export default function Dashboard() {
  const [days, setDays] = useState(14);
  const { data, isLoading } = useDashboard(days);
  const { signOut, user } = useAuth();

  const periodOptions = [
    { label: "7 dias", value: 7 },
    { label: "14 dias", value: 14 },
    { label: "30 dias", value: 30 },
    { label: "90 dias", value: 90 },
  ];

  const metrics = [
    { label: "Total", value: data?.total ?? 0, icon: ClipboardList, color: "text-primary" },
    { label: "A Fazer", value: data?.todo ?? 0, icon: ListTodo, color: "text-muted-foreground" },
    { label: "Em Andamento", value: data?.doing ?? 0, icon: Loader, color: "text-[hsl(var(--status-doing))]" },
    { label: "Concluídas", value: data?.done ?? 0, icon: CheckCircle2, color: "text-[hsl(var(--status-done))]" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-8 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">Dashboard</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CommandPalette />
            <Button asChild variant="outline" size="sm">
              <Link to="/tasks">
                <ClipboardList className="mr-2 h-4 w-4" />
                Tasks
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading || !data}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    data &&
                    exportPDF(
                      { total: data.total, todo: data.todo, doing: data.doing, done: data.done, completionRate: data.completionRate },
                      data.recentTasks,
                      data.dailyCounts
                    )
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    data &&
                    exportCSV(
                      { total: data.total, todo: data.todo, doing: data.doing, done: data.done, completionRate: data.completionRate },
                      data.recentTasks,
                      data.dailyCounts
                    )
                  }
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild title="Perfil">
              <Link to="/profile">
                <UserCircle className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground font-medium">Período:</span>
          {periodOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={days === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {metrics.map((m) => (
            <Card key={m.label} className="p-5">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-12" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <m.icon className={`h-4 w-4 ${m.color}`} />
                    <span className="text-sm text-muted-foreground font-medium">{m.label}</span>
                  </div>
                  <p className="text-3xl font-display font-bold">{m.value}</p>
                </>
              )}
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Donut Chart */}
          <Card className="p-5 flex flex-col">
            <p className="text-sm font-medium text-muted-foreground mb-4">Distribuição por Status</p>
            {isLoading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "A Fazer", value: data?.todo ?? 0 },
                        { name: "Em Andamento", value: data?.doing ?? 0 },
                        { name: "Concluídas", value: data?.done ?? 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="hsl(var(--muted-foreground))" />
                      <Cell fill="hsl(var(--status-doing))" />
                      <Cell fill="hsl(var(--status-done))" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground inline-block" /> A Fazer</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full inline-block" style={{ background: "hsl(var(--status-doing))" }} /> Em Andamento</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full inline-block" style={{ background: "hsl(var(--status-done))" }} /> Concluídas</span>
            </div>
          </Card>

          {/* Completion */}
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-[hsl(var(--status-done))]" />
                <span className="text-sm text-muted-foreground font-medium">Taxa de Conclusão</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <p className="text-4xl font-display font-bold">{data?.completionRate}%</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {data ? `${data.done} de ${data.total} tarefas concluídas` : ""}
            </p>
          </Card>
        </div>

        {/* Chart */}
        <Card className="p-5 mb-8">
            <p className="text-sm font-medium text-muted-foreground mb-4">Tarefas nos últimos {days} dias</p>
            {isLoading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data?.dailyCounts}>
                  <defs>
                    <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--status-done))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--status-done))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => format(new Date(v + "T12:00:00"), "dd/MM")}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    labelFormatter={(v) =>
                      format(new Date(v + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR })
                    }
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: 13,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Criadas"
                    stroke="hsl(var(--primary))"
                    fill="url(#gradCreated)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Concluídas"
                    stroke="hsl(var(--status-done))"
                    fill="url(#gradCompleted)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
        </Card>

        {/* Recent Activity */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">Atividade Recente</p>
            <Button asChild variant="ghost" size="sm">
              <Link to="/tasks">
                Ver todas <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </div>
                ))
              : data?.recentTasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.updated_at), "dd MMM yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </Link>
                ))}
            {data?.recentTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade ainda. Crie sua primeira task!
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
