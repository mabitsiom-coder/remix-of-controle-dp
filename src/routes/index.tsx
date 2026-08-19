import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
import {
  Building2,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Calendar,
  ChevronRight,
  BarChart3,
  ArrowRight,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { competencias } from "@/lib/folha-fechamento";
import { useFolhaTarefasSalvas } from "@/lib/folha-db";
import { useEmpresas } from "@/lib/empresas-store";
import { useCadastros } from "@/lib/cadastros-store";
import { useObrigacoes } from "@/lib/obrigacoes-store";
import { useRegDCTFWeb } from "@/lib/dctfweb-store";
import { useRegFGTSTrimestral } from "@/lib/fgts-trimestral-store";
import { useRegEspelhoDebito } from "@/lib/espelho-debito-store";
import { useRegSST } from "@/lib/sst-store";
import { useTarefas } from "@/lib/tarefas-store";
import { listarNomesCarteiras, TODAS_CARTEIRAS } from "@/lib/carteiras-core";

import {
  calcularResumoFolha,
  calcularResumoObrigacoes,
  calcularStatusTransmissoes,
  calcularResumoRotinas,
  calcularProximasRotinas,
  calcularResumoSST,
  calcularPendenciasCriticas,
  calcularPendenciasPorEmpresa,
  calcularDemandaPorArea,
  calcularDistribuicaoDemandas,
  calcularProximosVencimentos,
  calcularIndicadorGeralConclusao,
} from "@/lib/dashboard-aggregator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Auditoria — Departamento Pessoal" },
      {
        name: "description",
        content:
          "KPIs em tempo real do Departamento Pessoal: folhas, obrigações, SST, rotinas, produtividade e pendências.",
      },
    ],
  }),
  component: Dashboard,
});

// ─── Design tokens ───────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface-panel p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ label }: { label?: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
      <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground">
        {label ?? "Nenhum dado disponível para a competência selecionada."}
      </p>
    </div>
  );
}

function StatBadge({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info",
  }[tone];
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ${toneClass}`}
      >
        {value}
      </span>
    </div>
  );
}

function ProgressBar({
  value,
  tone = "success",
}: {
  value: number;
  tone?: "success" | "warning" | "danger" | "info";
}) {
  const barClass = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    info: "bg-info",
  }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${barClass}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function BigKpiCard({
  icon: Icon,
  label,
  value,
  sub,
  pct,
  tone = "default",
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  pct?: number;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  onClick?: () => void;
}) {
  const iconBg = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`surface-panel flex flex-col gap-3 p-4 text-left transition-all ${onClick ? "cursor-pointer hover:ring-2 hover:ring-primary/40" : "cursor-default"}`}
    >
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </span>
        {pct !== undefined && (
          <span
            className={`text-xs font-semibold ${pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-destructive"}`}
          >
            {pct}%
          </span>
        )}
        {onClick && (
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary" />
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs font-medium">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      {pct !== undefined && (
        <ProgressBar
          value={pct}
          tone={pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger"}
        />
      )}
    </button>
  );
}

function StatusChip({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "default" | "success" | "warning" | "danger" | "info";
}) {
  const cls = {
    default: "border-border bg-muted text-muted-foreground",
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    info: "border-info/30 bg-info/10 text-info",
  }[tone];
  return (
    <div className={`flex flex-col items-center rounded-lg border p-2 ${cls}`}>
      <span className="text-lg font-bold tabular-nums">{count}</span>
      <span className="text-center text-[10px] leading-tight">{label}</span>
    </div>
  );
}

function SectionTitle({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate();
  const [competencia, setCompetencia] = useState(competencias[1]!);
  const [carteira, setCarteira] = useState<string>(TODAS_CARTEIRAS);

  // ── Dados dos módulos ──────────────────────────────────────────────────────
  const { folhaTarefas } = useFolhaTarefasSalvas();
  const { empresas: empresasAtivas } = useEmpresas();
  const { carteiras: carteirasCad } = useCadastros();
  const { obrigacoes } = useObrigacoes();
  const { registros: dctfweb } = useRegDCTFWeb();
  const { registros: fgts } = useRegFGTSTrimestral();
  const { registros: espelho } = useRegEspelhoDebito();
  const { registros: registrosSST } = useRegSST();
  const { tarefas } = useTarefas();

  // Lista de carteiras dinâmica
  const nomesCarteiras = useMemo(
    () => listarNomesCarteiras(empresasAtivas, carteirasCad),
    [empresasAtivas, carteirasCad],
  );

  // ── Cálculos agregados (memoizados) ────────────────────────────────────────
  const resumoFolha = useMemo(
    () => calcularResumoFolha(folhaTarefas, empresasAtivas, competencia, carteira),
    [folhaTarefas, empresasAtivas, competencia, carteira],
  );

  const resumoObrigacoes = useMemo(
    () =>
      calcularResumoObrigacoes(
        obrigacoes,
        dctfweb,
        fgts,
        espelho,
        competencia,
        carteira,
      ),
    [obrigacoes, dctfweb, fgts, espelho, competencia, carteira],
  );

  const statusTransmissoes = useMemo(
    () =>
      calcularStatusTransmissoes(
        obrigacoes,
        dctfweb,
        fgts,
        espelho,
        competencia,
        carteira,
      ),
    [obrigacoes, dctfweb, fgts, espelho, competencia, carteira],
  );

  const resumoRotinas = useMemo(
    () => calcularResumoRotinas(tarefas, competencia, carteira),
    [tarefas, competencia, carteira],
  );

  const proximasRotinas = useMemo(
    () => calcularProximasRotinas(tarefas, carteira, 8),
    [tarefas, carteira],
  );

  const resumoSST = useMemo(
    () => calcularResumoSST(registrosSST, carteira),
    [registrosSST, carteira],
  );

  const pendenciasCriticas = useMemo(
    () =>
      calcularPendenciasCriticas(
        folhaTarefas,
        obrigacoes,
        tarefas,
        registrosSST,
        competencia,
        carteira,
      ),
    [folhaTarefas, obrigacoes, tarefas, registrosSST, competencia, carteira],
  );

  const pendenciasPorEmpresa = useMemo(
    () =>
      calcularPendenciasPorEmpresa(
        folhaTarefas,
        obrigacoes,
        tarefas,
        registrosSST,
        competencia,
        carteira,
      ),
    [folhaTarefas, obrigacoes, tarefas, registrosSST, competencia, carteira],
  );

  const demandaPorArea = useMemo(
    () =>
      calcularDemandaPorArea(
        folhaTarefas,
        obrigacoes,
        tarefas,
        registrosSST,
        dctfweb,
        fgts,
        espelho,
        competencia,
        carteira,
      ),
    [folhaTarefas, obrigacoes, tarefas, registrosSST, dctfweb, fgts, espelho, competencia, carteira],
  );

  const distribuicao = useMemo(
    () =>
      calcularDistribuicaoDemandas(folhaTarefas, tarefas, obrigacoes, competencia, carteira),
    [folhaTarefas, tarefas, obrigacoes, competencia, carteira],
  );

  const proximosVencimentos = useMemo(
    () =>
      calcularProximosVencimentos(tarefas, folhaTarefas, obrigacoes, competencia, carteira),
    [tarefas, folhaTarefas, obrigacoes, competencia, carteira],
  );

  const indicadorGeral = useMemo(
    () =>
      calcularIndicadorGeralConclusao(
        folhaTarefas,
        obrigacoes,
        tarefas,
        dctfweb,
        fgts,
        espelho,
        competencia,
        carteira,
      ),
    [folhaTarefas, obrigacoes, tarefas, dctfweb, fgts, espelho, competencia, carteira],
  );

  // Empresas filtradas para visão geral
  const empresasFiltradas = useMemo(() => {
    const ativas = empresasAtivas.filter((e) => e && !e.excluida);
    if (!carteira || carteira === TODAS_CARTEIRAS) return ativas;
    return ativas.filter(
      (e) =>
        (e.carteira ?? "").toLowerCase().replace(/\s/g, "") ===
        carteira.toLowerCase().replace(/\s/g, ""),
    );
  }, [empresasAtivas, carteira]);

  const totalEmpresas = empresasFiltradas.length;
  const comMovimento = empresasFiltradas.filter(
    (e) => e.tipo !== "sem-movimento",
  ).length;
  const semMovimento = totalEmpresas - comMovimento;

  // Total de demandas para visão geral
  const totalDemandas =
    demandaPorArea.reduce((acc, a) => acc + a.demandas, 0);
  const totalConcluidas =
    demandaPorArea.reduce((acc, a) => acc + a.concluidas, 0);
  const totalAndamento = resumoFolha.porStatus.find((s) => s.status === "andamento")?.total ?? 0;
  const totalAtraso = pendenciasCriticas.length;

  // Dados do gráfico de evolução de transmissões (por tipo disponível no store)
  const evolucaoTransmissoes = useMemo(() => {
    // Usa competências históricas disponíveis + atual
    return competencias.map((comp) => {
      const dctfComp = dctfweb.filter((d) =>
        d.transmissaoPublicacao && d.transmissaoPublicacao !== "" && d.transmissaoPublicacao !== "—"
      );
      const fgtsComp = fgts.filter((f) => f.enviadoCliente === "SIM");
      const espelhoComp = espelho.filter((e) => e.enviadoCliente === "SIM");
      const obrComp = obrigacoes.filter(
        (o) => o.competencia === comp && o.status === "transmitido",
      );
      return {
        mes: comp,
        DCTFWeb: comp === competencia ? dctfComp.length : 0,
        "FGTS Trim.": comp === competencia ? fgtsComp.length : 0,
        "Espelho Déb.": comp === competencia ? espelhoComp.length : 0,
        Obrigações: comp === competencia ? obrComp.length : 0,
      };
    });
  }, [dctfweb, fgts, espelho, obrigacoes, competencia]);

  // ── Helpers de navegação ───────────────────────────────────────────────────
  const goToFolha = () => void navigate({ to: "/folha" });
  const goToObrigacoes = () => void navigate({ to: "/obrigacoes" });
  const goToSST = () => void navigate({ to: "/sst" });
  const goToTarefas = () => void navigate({ to: "/tarefas" });
  const goToCalendario = () => void navigate({ to: "/calendario" });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ───────────────────────────────────────────────────────── */}
      <PageHeader
        title="Auditoria"
        description="Visão consolidada das demandas do Departamento Pessoal"
      />

      {/* ── LINHA 1 — Filtros ────────────────────────────────────────────── */}
      <div className="surface-panel flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            id="filtro-competencia"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            {competencias.map((c) => (
              <option key={c} value={c}>
                Competência {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <select
            id="filtro-carteira"
            value={carteira}
            onChange={(e) => setCarteira(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value={TODAS_CARTEIRAS}>Todas as Carteiras</option>
            {nomesCarteiras.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {totalEmpresas} empresa{totalEmpresas !== 1 ? "s" : ""} •{" "}
          {carteira === TODAS_CARTEIRAS ? "Visão consolidada" : carteira}
        </span>
      </div>

      {/* ── LINHA 2 — Visão Geral do Setor ──────────────────────────────────── */}
      <div>
        <SectionTitle icon={BarChart3}>Visão Geral do Setor</SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <BigKpiCard
            icon={Building2}
            label="Total de Empresas"
            value={totalEmpresas}
            tone="info"
          />
          <BigKpiCard
            icon={CheckCircle2}
            label="Com Movimento"
            value={comMovimento}
            tone="success"
          />
          <BigKpiCard
            icon={Clock}
            label="Sem Movimento"
            value={semMovimento}
            tone="default"
          />
          <BigKpiCard
            icon={FileText}
            label="Total de Demandas"
            value={totalDemandas}
            tone="info"
          />
          <BigKpiCard
            icon={CheckCircle2}
            label="Concluídas"
            value={totalConcluidas}
            pct={indicadorGeral.pctGeral}
            tone="success"
          />
          <BigKpiCard
            icon={AlertTriangle}
            label="Em Atraso"
            value={totalAtraso}
            tone={totalAtraso > 0 ? "danger" : "success"}
          />
        </div>
      </div>

      {/* ── Indicador de % Geral + Vencimentos ──────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Card grande de conclusão */}
        <div className="surface-panel flex flex-col justify-between gap-4 p-5 lg:col-span-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Conclusão Geral do Setor
            </p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums">
              {indicadorGeral.pctGeral}
              <span className="text-2xl font-semibold text-muted-foreground">%</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {indicadorGeral.concluidas.toLocaleString("pt-BR")} de{" "}
              {indicadorGeral.previstas.toLocaleString("pt-BR")} demandas concluídas
            </p>
          </div>
          <ProgressBar
            value={indicadorGeral.pctGeral}
            tone={
              indicadorGeral.pctGeral >= 80
                ? "success"
                : indicadorGeral.pctGeral >= 50
                  ? "warning"
                  : "danger"
            }
          />
        </div>

        {/* Próximos vencimentos */}
        <div className="surface-panel p-5 lg:col-span-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Próximos Vencimentos
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatusChip
              label="Vencem Hoje"
              count={proximosVencimentos.hoje}
              tone={proximosVencimentos.hoje > 0 ? "danger" : "default"}
            />
            <StatusChip
              label="Até 3 Dias"
              count={proximosVencimentos.em3Dias}
              tone={proximosVencimentos.em3Dias > 0 ? "warning" : "default"}
            />
            <StatusChip
              label="Até 7 Dias"
              count={proximosVencimentos.em7Dias}
              tone={proximosVencimentos.em7Dias > 0 ? "info" : "default"}
            />
            <StatusChip
              label="Vencidas"
              count={proximosVencimentos.atrasadas}
              tone={proximosVencimentos.atrasadas > 0 ? "danger" : "success"}
            />
          </div>
        </div>
      </div>

      {/* ── LINHA 3 — 4 Cards Modulares ─────────────────────────────────────── */}
      <div>
        <SectionTitle icon={TrendingUp}>Áreas Operacionais</SectionTitle>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Folha de Pagamento */}
          <button
            type="button"
            id="card-folha"
            onClick={goToFolha}
            className="surface-panel cursor-pointer p-4 text-left transition-all hover:ring-2 hover:ring-primary/40"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-info/15 text-info">
                  <FileText className="h-4 w-4" />
                </span>
                Folha de Pagamento
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mb-3 flex items-end gap-2">
              <span className="text-3xl font-bold tabular-nums">
                {resumoFolha.pctConclusao}
                <span className="text-base font-medium text-muted-foreground">%</span>
              </span>
              <span className="mb-0.5 text-xs text-muted-foreground">
                {resumoFolha.processadas}/{resumoFolha.totalEmpresas} empresas
              </span>
            </div>
            <ProgressBar
              value={resumoFolha.pctConclusao}
              tone={
                resumoFolha.pctConclusao >= 80
                  ? "success"
                  : resumoFolha.pctConclusao >= 50
                    ? "warning"
                    : "danger"
              }
            />
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {resumoFolha.porStatus.slice(0, 3).map((s) => (
                <div key={s.status} className="rounded border p-1.5 text-center">
                  <p className="text-base font-bold tabular-nums">{s.total}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {resumoFolha.porStatus.slice(3).map((s) => (
                <div key={s.status} className="rounded border p-1.5 text-center">
                  <p className="text-base font-bold tabular-nums">{s.total}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            {resumoFolha.emAtraso > 0 && (
              <div className="mt-2 flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-xs font-semibold text-destructive">
                  {resumoFolha.emAtraso} em atraso
                </span>
              </div>
            )}
          </button>

          {/* Obrigações */}
          <button
            type="button"
            id="card-obrigacoes"
            onClick={goToObrigacoes}
            className="surface-panel cursor-pointer p-4 text-left transition-all hover:ring-2 hover:ring-primary/40"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-success/15 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                Obrigações
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mb-3 flex items-end gap-2">
              <span className="text-3xl font-bold tabular-nums">
                {resumoObrigacoes.pctTransmitido}
                <span className="text-base font-medium text-muted-foreground">%</span>
              </span>
              <span className="mb-0.5 text-xs text-muted-foreground">transmitidas</span>
            </div>
            <ProgressBar
              value={resumoObrigacoes.pctTransmitido}
              tone={
                resumoObrigacoes.pctTransmitido >= 80
                  ? "success"
                  : resumoObrigacoes.pctTransmitido >= 50
                    ? "warning"
                    : "danger"
              }
            />
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <div className="rounded border p-1.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {resumoObrigacoes.transmitidos}
                </p>
                <p className="text-[10px] text-muted-foreground">Transmitidas</p>
              </div>
              <div className="rounded border p-1.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {resumoObrigacoes.pendentes}
                </p>
                <p className="text-[10px] text-muted-foreground">Pendentes</p>
              </div>
              <div className="rounded border p-1.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {resumoObrigacoes.conferidos}
                </p>
                <p className="text-[10px] text-muted-foreground">Conferidas</p>
              </div>
              <div className="rounded border p-1.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {resumoObrigacoes.revisados}
                </p>
                <p className="text-[10px] text-muted-foreground">Revisadas</p>
              </div>
            </div>
            {resumoObrigacoes.emAtraso > 0 && (
              <div className="mt-2 flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-xs font-semibold text-destructive">
                  {resumoObrigacoes.emAtraso} em atraso
                </span>
              </div>
            )}
          </button>

          {/* Rotinas */}
          <button
            type="button"
            id="card-rotinas"
            onClick={goToCalendario}
            className="surface-panel cursor-pointer p-4 text-left transition-all hover:ring-2 hover:ring-primary/40"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-warning/15 text-warning">
                  <Calendar className="h-4 w-4" />
                </span>
                Rotinas
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mb-3 flex items-end gap-2">
              <span className="text-3xl font-bold tabular-nums">
                {resumoRotinas.pctExecucao}
                <span className="text-base font-medium text-muted-foreground">%</span>
              </span>
              <span className="mb-0.5 text-xs text-muted-foreground">
                {resumoRotinas.concluidas}/{resumoRotinas.previstas} concluídas
              </span>
            </div>
            <ProgressBar
              value={resumoRotinas.pctExecucao}
              tone={
                resumoRotinas.pctExecucao >= 80
                  ? "success"
                  : resumoRotinas.pctExecucao >= 50
                    ? "warning"
                    : "danger"
              }
            />
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <div className="rounded border p-1.5 text-center">
                <p className="text-base font-bold tabular-nums">{resumoRotinas.concluidas}</p>
                <p className="text-[10px] text-muted-foreground">Concluídas</p>
              </div>
              <div className="rounded border p-1.5 text-center">
                <p className="text-base font-bold tabular-nums">{resumoRotinas.emAndamento}</p>
                <p className="text-[10px] text-muted-foreground">Em Andamento</p>
              </div>
              <div className="rounded border p-1.5 text-center">
                <p className="text-base font-bold tabular-nums">{resumoRotinas.pendentes}</p>
                <p className="text-[10px] text-muted-foreground">Pendentes</p>
              </div>
              <div className="rounded border p-1.5 text-center">
                <p className="text-base font-bold tabular-nums">{resumoRotinas.emAtraso}</p>
                <p className="text-[10px] text-muted-foreground">Em Atraso</p>
              </div>
            </div>
            {resumoRotinas.emAtraso > 0 && (
              <div className="mt-2 flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-xs font-semibold text-destructive">
                  {resumoRotinas.emAtraso} em atraso
                </span>
              </div>
            )}
          </button>

          {/* SST */}
          <button
            type="button"
            id="card-sst"
            onClick={goToSST}
            className="surface-panel cursor-pointer p-4 text-left transition-all hover:ring-2 hover:ring-primary/40"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/15 text-destructive">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                SST
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mb-3 flex items-end gap-2">
              <span className="text-3xl font-bold tabular-nums">
                {resumoSST.pctEnviados}
                <span className="text-base font-medium text-muted-foreground">%</span>
              </span>
              <span className="mb-0.5 text-xs text-muted-foreground">com SST na Mabit</span>
            </div>
            <ProgressBar
              value={resumoSST.pctEnviados}
              tone={
                resumoSST.pctEnviados >= 80
                  ? "success"
                  : resumoSST.pctEnviados >= 50
                    ? "warning"
                    : "danger"
              }
            />
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <div className="rounded border p-1.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {resumoSST.totalMonitoradas}
                </p>
                <p className="text-[10px] text-muted-foreground">Monitoradas</p>
              </div>
              <div className="rounded border p-1.5 text-center">
                <p className="text-base font-bold tabular-nums">{resumoSST.sstNaMabit}</p>
                <p className="text-[10px] text-muted-foreground">SST na Mabit</p>
              </div>
              <div className="rounded border p-1.5 text-center">
                <p className="text-base font-bold tabular-nums text-warning">
                  {resumoSST.comExamesVencidos}
                </p>
                <p className="text-[10px] text-muted-foreground">Exames Venc.</p>
              </div>
              <div className="rounded border p-1.5 text-center">
                <p className="text-base font-bold tabular-nums text-destructive">
                  {resumoSST.semProgramas}
                </p>
                <p className="text-[10px] text-muted-foreground">Sem Programas</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ── LINHA 4 — Gráficos ───────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Evolução das Transmissões"
            subtitle="Registros transmitidos por tipo de obrigação"
          >
            {evolucaoTransmissoes.every(
              (e) =>
                e.DCTFWeb === 0 &&
                e["FGTS Trim."] === 0 &&
                e["Espelho Déb."] === 0 &&
                e.Obrigações === 0,
            ) ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={evolucaoTransmissoes}>
                  <defs>
                    {["DCTFWeb", "FGTS Trim.", "Espelho Déb.", "Obrigações"].map(
                      (k, i) => (
                        <linearGradient
                          key={k}
                          id={`grad-${i}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={chartColors[i]}
                            stopOpacity={0.5}
                          />
                          <stop
                            offset="100%"
                            stopColor={chartColors[i]}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      ),
                    )}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mes"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {["DCTFWeb", "FGTS Trim.", "Espelho Déb.", "Obrigações"].map(
                    (k, i) => (
                      <Area
                        key={k}
                        type="monotone"
                        dataKey={k}
                        stroke={chartColors[i]}
                        fill={`url(#grad-${i})`}
                        strokeWidth={2}
                      />
                    ),
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        <Panel
          title="Distribuição das Demandas"
          subtitle="Por status na competência selecionada"
        >
          {distribuicao.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={distribuicao}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {distribuicao.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[i % chartColors.length]}
                      stroke="var(--card)"
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {/* ── LINHA 5 — Análises ───────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status das Transmissões */}
        <Panel
          title="Status das Transmissões"
          subtitle="Andamento por tipo de obrigação na competência"
          action={
            <button
              type="button"
              onClick={goToObrigacoes}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              Ver tudo <ChevronRight className="h-3 w-3" />
            </button>
          }
        >
          {statusTransmissoes.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Obrigação</th>
                    <th className="pb-2 text-right font-medium">Prev.</th>
                    <th className="pb-2 text-right font-medium">Trans.</th>
                    <th className="pb-2 text-right font-medium">Pend.</th>
                    <th className="pb-2 text-right font-medium">Atraso</th>
                    <th className="pb-2 text-right font-medium">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {statusTransmissoes.map((item) => (
                    <tr key={item.obrigacao}>
                      <td className="py-2 font-medium">{item.obrigacao}</td>
                      <td className="py-2 text-right tabular-nums">{item.previstas}</td>
                      <td className="py-2 text-right tabular-nums text-success">
                        {item.transmitidas}
                      </td>
                      <td className="py-2 text-right tabular-nums text-warning">
                        {item.pendentes}
                      </td>
                      <td className="py-2 text-right tabular-nums text-destructive">
                        {item.emAtraso}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        <span
                          className={`font-semibold ${item.pctConclusao >= 80 ? "text-success" : item.pctConclusao >= 50 ? "text-warning" : "text-destructive"}`}
                        >
                          {item.pctConclusao}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Demandas por Área */}
        <Panel
          title="Demandas por Área"
          subtitle="Distribuição operacional da competência"
        >
          {demandaPorArea.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-2 text-left font-medium">Área</th>
                      <th className="pb-2 text-right font-medium">Demandas</th>
                      <th className="pb-2 text-right font-medium">Concluídas</th>
                      <th className="pb-2 text-right font-medium">Pendentes</th>
                      <th className="pb-2 text-right font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {demandaPorArea.map((area) => (
                      <tr key={area.area}>
                        <td className="py-2 font-medium">{area.area}</td>
                        <td className="py-2 text-right tabular-nums">
                          {area.demandas.toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 text-right tabular-nums text-success">
                          {area.concluidas.toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 text-right tabular-nums text-warning">
                          {area.pendentes.toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 text-right">
                          <span
                            className={`font-semibold tabular-nums ${area.pctConclusao >= 80 ? "text-success" : area.pctConclusao >= 50 ? "text-warning" : "text-destructive"}`}
                          >
                            {area.pctConclusao}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart
                    data={demandaPorArea}
                    layout="vertical"
                    margin={{ left: 40, right: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="area"
                      width={60}
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey="concluidas"
                      name="Concluídas"
                      fill="var(--chart-3)"
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                    />
                    <Bar
                      dataKey="pendentes"
                      name="Pendentes"
                      fill="var(--chart-4)"
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* Próximas Rotinas */}
      <Panel
        title="Próximas Rotinas"
        subtitle="Rotinas ordenadas pela data mais próxima de vencimento"
        action={
          <button
            type="button"
            onClick={goToCalendario}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            Ver calendário <ChevronRight className="h-3 w-3" />
          </button>
        }
      >
        {proximasRotinas.length === 0 ? (
          <EmptyState label="Nenhuma rotina próxima do vencimento." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Rotina</th>
                  <th className="pb-2 text-right font-medium">Vencimento</th>
                  <th className="pb-2 text-right font-medium">Periodicidade</th>
                  <th className="pb-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {proximasRotinas.map((rotina) => {
                  const isAtrasada = rotina.status === "atrasada";
                  const isHoje = rotina.diasAteVencimento === 0;
                  const isProximo =
                    rotina.diasAteVencimento > 0 &&
                    rotina.diasAteVencimento <= 3;
                  return (
                    <tr
                      key={rotina.id}
                      className={
                        isAtrasada
                          ? "bg-destructive/5"
                          : isHoje
                            ? "bg-warning/5"
                            : ""
                      }
                    >
                      <td className="py-2 font-medium">{rotina.titulo}</td>
                      <td
                        className={`py-2 text-right tabular-nums font-medium ${isAtrasada ? "text-destructive" : isHoje ? "text-warning" : isProximo ? "text-warning" : ""}`}
                      >
                        {rotina.vencimento}
                        {isAtrasada && (
                          <span className="ml-1 text-[10px]">(atrasada)</span>
                        )}
                        {isHoje && (
                          <span className="ml-1 text-[10px]">(hoje)</span>
                        )}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {rotina.periodicidade}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            rotina.status === "concluida"
                              ? "bg-success/15 text-success"
                              : rotina.status === "atrasada"
                                ? "bg-destructive/15 text-destructive"
                                : rotina.status === "andamento"
                                  ? "bg-info/15 text-info"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {rotina.status === "concluida"
                            ? "Concluída"
                            : rotina.status === "atrasada"
                              ? "Atrasada"
                              : rotina.status === "andamento"
                                ? "Andamento"
                                : "Planejada"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ── LINHA 6 — Pontos de Atenção ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pendências Críticas */}
        <Panel
          title="Pendências Críticas"
          subtitle="Demandas que necessitam atenção imediata — ordenadas por maior atraso"
        >
          {pendenciasCriticas.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-success/40 bg-success/5">
              <CheckCircle2 className="h-8 w-8 text-success/60" />
              <p className="text-xs text-success">
                Nenhuma pendência crítica identificada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Área</th>
                    <th className="pb-2 text-left font-medium">Empresa</th>
                    <th className="pb-2 text-left font-medium">Demanda</th>
                    <th className="pb-2 text-right font-medium">Atraso</th>
                    <th className="pb-2 text-right font-medium">Resp.</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendenciasCriticas.map((p, i) => (
                    <tr key={`${p.empresa}-${i}`}>
                      <td className="py-2">
                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            p.area === "Folha"
                              ? "bg-info/15 text-info"
                              : p.area === "Obrigações"
                                ? "bg-success/15 text-success"
                                : p.area === "SST"
                                  ? "bg-destructive/15 text-destructive"
                                  : "bg-warning/15 text-warning"
                          }`}
                        >
                          {p.area}
                        </span>
                      </td>
                      <td className="max-w-[120px] truncate py-2 font-medium">
                        {p.empresa}
                      </td>
                      <td className="max-w-[140px] truncate py-2 text-muted-foreground">
                        {p.demanda}
                      </td>
                      <td className="py-2 text-right">
                        {p.diasEmAtraso > 0 ? (
                          <span className="font-semibold text-destructive">
                            {p.diasEmAtraso}d
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="max-w-[80px] truncate py-2 text-right text-muted-foreground">
                        {p.responsavel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Empresas com mais pendências */}
        <Panel
          title="Empresas com Mais Pendências"
          subtitle="Top empresas com demandas em aberto na competência"
        >
          {pendenciasPorEmpresa.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-success/40 bg-success/5">
              <CheckCircle2 className="h-8 w-8 text-success/60" />
              <p className="text-xs text-success">
                Nenhuma empresa com pendências identificada.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-2 text-left font-medium">Empresa</th>
                      <th className="pb-2 text-right font-medium">Total</th>
                      <th className="pb-2 text-right font-medium">Folha</th>
                      <th className="pb-2 text-right font-medium">Obrig.</th>
                      <th className="pb-2 text-right font-medium">SST</th>
                      <th className="pb-2 text-right font-medium">Rot.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendenciasPorEmpresa.map((p) => (
                      <tr key={p.empresa}>
                        <td className="max-w-[140px] truncate py-2 font-medium">
                          {p.empresa}
                        </td>
                        <td className="py-2 text-right font-bold text-destructive tabular-nums">
                          {p.totalPendencias}
                        </td>
                        <td className="py-2 text-right tabular-nums text-info">{p.folha}</td>
                        <td className="py-2 text-right tabular-nums text-success">
                          {p.obrigacoes}
                        </td>
                        <td className="py-2 text-right tabular-nums text-destructive">
                          {p.sst}
                        </td>
                        <td className="py-2 text-right tabular-nums text-warning">
                          {p.rotinas}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={pendenciasPorEmpresa.slice(0, 6)}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="empresa"
                      stroke="var(--muted-foreground)"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-12}
                      height={40}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey="totalPendencias"
                      name="Pendências"
                      fill="var(--chart-4)"
                      radius={[4, 4, 0, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
