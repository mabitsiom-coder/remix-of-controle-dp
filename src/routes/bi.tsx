import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { rankingAnalistas, slaMensal, tempoPorProcesso } from "@/lib/mock-data";

export const Route = createFileRoute("/bi")({
  head: () => ({
    meta: [
      { title: "BI Gerencial — DP Control" },
      {
        name: "description",
        content: "Indicadores gerenciais do DP: SLA, retrabalho, tempo médio por processo e performance da equipe.",
      },
      { property: "og:title", content: "BI Gerencial — DP Control" },
      { property: "og:description", content: "Dashboards gerenciais do Departamento Pessoal." },
    ],
  }),
  component: BI,
});

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function BI() {
  return (
    <div className="space-y-6">
      <PageHeader title="BI Gerencial" description="Performance da equipe, SLA, retrabalho e produtividade" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="SLA geral" value="94,3%" delta="+2,1pp" tone="success" />
        <KpiCard label="Retrabalho" value="6,1%" delta="-1,2pp" tone="success" />
        <KpiCard label="Horas trabalhadas" value="1.284h" delta="+62h" tone="info" />
        <KpiCard label="Empresas críticas" value={8} delta="-2" tone="danger" />
        <KpiCard label="Pendências" value={57} delta="+9" tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel p-4">
          <h2 className="mb-4 text-sm font-semibold">SLA x Retrabalho</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={slaMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="sla" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="retrabalho" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="surface-panel p-4">
          <h2 className="mb-4 text-sm font-semibold">Tempo médio por processo (horas)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tempoPorProcesso}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="processo" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="horas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface-panel overflow-x-auto">
        <h2 className="border-b p-3 text-sm font-semibold">Performance da equipe</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="p-3 font-medium">Colaborador</th>
              <th className="p-3 font-medium">Tarefas concluídas</th>
              <th className="p-3 font-medium">SLA</th>
              <th className="p-3 font-medium">Erros</th>
            </tr>
          </thead>
          <tbody>
            {rankingAnalistas.map((a) => (
              <tr key={a.nome} className="border-b last:border-0 hover:bg-muted/40">
                <td className="p-3 font-medium">{a.nome}</td>
                <td className="p-3 tabular-nums">{a.concluidas}</td>
                <td className="p-3 tabular-nums">{a.sla}%</td>
                <td className="p-3 tabular-nums">{a.erros}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
