import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import {
  kpis,
  transmissoes,
  errosPorTipo,
  pendenciasPorEmpresa,
  distribuicaoTarefas,
  rankingAnalistas,
  empresas,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Executivo — DP Control" },
      {
        name: "description",
        content:
          "KPIs em tempo real do Departamento Pessoal: folhas, obrigações, SST, SLA, produtividade e pendências.",
      },
      { property: "og:title", content: "Dashboard Executivo — DP Control" },
      {
        property: "og:description",
        content: "Centro de controle operacional do Departamento Pessoal com indicadores em tempo real.",
      },
    ],
  }),
  component: Dashboard,
});

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="surface-panel p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Dashboard() {
  const criticas = empresas
    .slice()
    .sort((a, b) => b.diasSemRevisao - a.diasSemRevisao)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Executivo"
        description="Competência 07/2026 · atualizado agora há pouco"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Evolução das transmissões" subtitle="Últimos 7 meses por obrigação">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={transmissoes}>
                <defs>
                  {["eSocial", "dctfweb", "fgts", "reinf"].map((k, i) => (
                    <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors[i]} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={chartColors[i]} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {["eSocial", "dctfweb", "fgts", "reinf"].map((k, i) => (
                  <Area
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stroke={chartColors[i]}
                    fill={`url(#g-${k})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <Panel title="Distribuição de tarefas" subtitle="Por natureza do serviço">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={distribuicaoTarefas}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
              >
                {distribuicaoTarefas.map((_, i) => (
                  <Cell key={i} fill={chartColors[i % chartColors.length]} stroke="var(--card)" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Erros por tipo" subtitle="Acumulado do trimestre">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={errosPorTipo} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="tipo"
                width={150}
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="qtd" fill="var(--chart-4)" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Pendências por empresa" subtitle="Top 5 clientes com mais pendências">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pendenciasPorEmpresa}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="empresa" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-12} height={50} textAnchor="end" />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="qtd" fill="var(--chart-3)" radius={[6, 6, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Ranking de analistas" subtitle="Tarefas concluídas, SLA e erros no mês">
          <div className="space-y-3">
            {rankingAnalistas.map((a, i) => (
              <div key={a.nome} className="flex items-center gap-3">
                <span className="w-5 text-xs font-semibold text-muted-foreground">{i + 1}º</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium">{a.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {a.concluidas} tarefas · SLA {a.sla}% · {a.erros} erro(s)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${a.sla}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Ranking de clientes críticos" subtitle="Maior tempo sem revisão de particularidades">
          <div className="divide-y">
            {criticas.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.analista} · {e.funcionarios} funcionários
                  </p>
                </div>
                <span
                  className={
                    e.diasSemRevisao > 30
                      ? "shrink-0 text-xs font-semibold text-destructive"
                      : "shrink-0 text-xs font-semibold text-muted-foreground"
                  }
                >
                  {e.diasSemRevisao} dias
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
