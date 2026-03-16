import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportTask {
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ExportMetrics {
  total: number;
  todo: number;
  doing: number;
  done: number;
  completionRate: number;
}

interface DailyCount {
  date: string;
  created: number;
  completed: number;
}

const statusLabel: Record<string, string> = {
  TODO: "A Fazer",
  DOING: "Em Andamento",
  DONE: "Concluída",
};

export function exportCSV(
  metrics: ExportMetrics,
  tasks: ExportTask[],
  dailyCounts: DailyCount[]
) {
  const lines: string[] = [];

  // Metrics
  lines.push("=== Métricas ===");
  lines.push("Métrica,Valor");
  lines.push(`Total de Tarefas,${metrics.total}`);
  lines.push(`A Fazer,${metrics.todo}`);
  lines.push(`Em Andamento,${metrics.doing}`);
  lines.push(`Concluídas,${metrics.done}`);
  lines.push(`Taxa de Conclusão,${metrics.completionRate}%`);
  lines.push("");

  // Daily
  lines.push("=== Tarefas por Dia (14 dias) ===");
  lines.push("Data,Criadas,Concluídas");
  dailyCounts.forEach((d) => {
    lines.push(`${format(new Date(d.date + "T12:00:00"), "dd/MM/yyyy")},${d.created},${d.completed}`);
  });
  lines.push("");

  // Tasks
  lines.push("=== Atividade Recente ===");
  lines.push("Título,Status,Criada em,Atualizada em");
  tasks.forEach((t) => {
    const title = t.title.replace(/,/g, " ");
    lines.push(
      `${title},${statusLabel[t.status] ?? t.status},${format(new Date(t.created_at), "dd/MM/yyyy HH:mm")},${format(new Date(t.updated_at), "dd/MM/yyyy HH:mm")}`
    );
  });

  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `dashboard-${format(new Date(), "yyyy-MM-dd")}.csv`);
}

export function exportPDF(
  metrics: ExportMetrics,
  tasks: ExportTask[],
  dailyCounts: DailyCount[]
) {
  const doc = new jsPDF();
  const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  doc.setFontSize(18);
  doc.text("Dashboard de Tarefas", 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Gerado em ${now}`, 14, 27);

  // Metrics table
  doc.setTextColor(0);
  doc.setFontSize(13);
  doc.text("Métricas", 14, 38);

  autoTable(doc, {
    startY: 42,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de Tarefas", String(metrics.total)],
      ["A Fazer", String(metrics.todo)],
      ["Em Andamento", String(metrics.doing)],
      ["Concluídas", String(metrics.done)],
      ["Taxa de Conclusão", `${metrics.completionRate}%`],
    ],
    theme: "striped",
    headStyles: { fillColor: [99, 82, 210] },
    margin: { left: 14 },
  });

  // Daily counts
  const afterMetrics = (doc as any).lastAutoTable?.finalY ?? 90;
  doc.setFontSize(13);
  doc.text("Tarefas por Dia (14 dias)", 14, afterMetrics + 10);

  autoTable(doc, {
    startY: afterMetrics + 14,
    head: [["Data", "Criadas", "Concluídas"]],
    body: dailyCounts.map((d) => [
      format(new Date(d.date + "T12:00:00"), "dd/MM/yyyy"),
      String(d.created),
      String(d.completed),
    ]),
    theme: "striped",
    headStyles: { fillColor: [99, 82, 210] },
    margin: { left: 14 },
  });

  // Recent tasks
  const afterDaily = (doc as any).lastAutoTable?.finalY ?? 160;
  if (afterDaily > 240) doc.addPage();
  const taskY = afterDaily > 240 ? 20 : afterDaily + 10;

  doc.setFontSize(13);
  doc.text("Atividade Recente", 14, taskY);

  autoTable(doc, {
    startY: taskY + 4,
    head: [["Título", "Status", "Criada em", "Atualizada em"]],
    body: tasks.map((t) => [
      t.title,
      statusLabel[t.status] ?? t.status,
      format(new Date(t.created_at), "dd/MM/yyyy HH:mm"),
      format(new Date(t.updated_at), "dd/MM/yyyy HH:mm"),
    ]),
    theme: "striped",
    headStyles: { fillColor: [99, 82, 210] },
    margin: { left: 14 },
    columnStyles: { 0: { cellWidth: 60 } },
  });

  doc.save(`dashboard-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
