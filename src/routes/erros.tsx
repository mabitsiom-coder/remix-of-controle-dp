import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { erros, errosPorColaborador, errosPorTipo } from "@/lib/mock-data";

export const Route = createFileRoute("/erros")({
  head: () => ({
    meta: [
      { title: "Central de Erros — DP Control" },
      {
        name: "description",
        content: "Registro de erros com causa raiz, plano de ação, reincidência e custo de retrabalho.",
      },
      { property: "og:title", content: "Central de Erros — DP Control" },
      { property: "og:description", content: "Análise de causa raiz e prevenção de erros no DP." },
    ],
  }),
  component: Erros,
});

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function Erros() {
  const horas = erros.reduce((s, e) => s + e.horasPerdidas, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Erros"
        description="Causa raiz, contenção, correção, prevenção e treinamento necessário"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Erros registrados" valor={erros.length} />
        <Card label="Horas de retrabalho" valor={`${horas}h`} />
        <Card label="Taxa de reincidência" valor="8,3%" />
        <Card label="Custo estimado" valor={`R$ ${(horas * 75).toLocaleString("pt-BR")}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel p-4">
          <h2 className="mb-4 text-sm font-semibold">Erros por colaborador</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={errosPorColaborador}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="nome" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="erros" fill="var(--chart-4)" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface-panel p-4">
          <h2 className="mb-4 text-sm font-semibold">Erros por tipo</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={errosPorTipo} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="tipo" width={150} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="qtd" fill="var(--chart-3)" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        {erros.map((e) => (
          <div key={e.id} className="surface-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">{e.tipo}</h3>
                <p className="text-xs text-muted-foreground">
                  {e.empresa} · {e.departamento} · competência {e.competencia} · {e.data}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={e.impacto} />
                <StatusBadge status={e.status} />
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Bloco titulo="Descrição" texto={e.descricao} />
              <Bloco titulo="Causa raiz" texto={e.causaRaiz} />
              <Bloco titulo="Plano de ação" texto={e.planoAcao} />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Responsável: {e.responsavel} · {e.horasPerdidas}h de retrabalho
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="surface-panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
    </div>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-sm">{texto}</p>
    </div>
  );
}
