import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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
  Search,
  Eye,
  Check,
  ExternalLink,
  Briefcase,
  Tag,
  UserCheck,
  XCircle,
  Layers,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { competencias, statusFolhaMeta } from "@/lib/folha-fechamento";
import { useFolhaTarefasSalvas } from "@/lib/folha-db";
import { useEmpresas } from "@/lib/empresas-store";
import { useCadastros } from "@/lib/cadastros-store";
import { useObrigacoes } from "@/lib/obrigacoes-store";
import { useRegDCTFWeb } from "@/lib/dctfweb-store";
import { useRegFGTSTrimestral } from "@/lib/fgts-trimestral-store";
import { useRegEspelhoDebito } from "@/lib/espelho-debito-store";
import { useRegSST } from "@/lib/sst-store";
import { useTarefas } from "@/lib/tarefas-store";
import { useParticularidades } from "@/lib/particularidades-store";
import { listarNomesCarteiras, TODAS_CARTEIRAS, normalizarCarteira } from "@/lib/carteiras-core";
import { obterResponsaveisCarteira } from "@/lib/bi-service";
import { useAuth } from "@/lib/auth-store";
import { isNivelOperacional } from "@/lib/permissoes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  calcularTransmissoesFolhaPorVencimento,
  type ItemTransmissaoFolhaVencimento,
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
  const { currentUser } = useAuth();
  const isOperacional = isNivelOperacional(currentUser.perfil);

  const [competencia, setCompetencia] = useState(competencias[1]!);
  const [carteira, setCarteira] = useState<string>(() => {
    if (isOperacional && currentUser.carteira) {
      return currentUser.carteira;
    }
    return TODAS_CARTEIRAS;
  });

  // Atualiza carteira caso o usuário logado mude
  useEffect(() => {
    if (isOperacional && currentUser.carteira) {
      setCarteira(currentUser.carteira);
    }
  }, [isOperacional, currentUser.carteira]);

  // ── Dados dos módulos ──────────────────────────────────────────────────────
  const { folhaTarefas } = useFolhaTarefasSalvas();
  const { empresas: empresasAtivas } = useEmpresas();
  const { carteiras: carteirasCad, analistas: analistasCad, supervisores: supervisoresCad } = useCadastros();
  const { obrigacoes } = useObrigacoes();
  const { registros: dctfweb } = useRegDCTFWeb();
  const { registros: fgts } = useRegFGTSTrimestral();
  const { registros: espelho } = useRegEspelhoDebito();
  const { registros: registrosSST } = useRegSST();
  const { tarefas } = useTarefas();
  const { registros: particularidades } = useParticularidades();

  // Lista de carteiras dinâmica
  const nomesCarteiras = useMemo(
    () => listarNomesCarteiras(empresasAtivas, carteirasCad),
    [empresasAtivas, carteirasCad],
  );

  // Metadados da carteira selecionada (semelhante à Gestão por Carteira)
  const carteiraInfo = useMemo(() => {
    const isAll = !carteira || carteira === TODAS_CARTEIRAS;
    if (isAll) {
      return {
        nome: "Todas as Carteiras",
        categoria: "Visão Consolidada",
        analistas: ["Equipe Operacional Geral"],
        supervisor: "Supervisão Geral",
      };
    }

    const carteiraObj = carteirasCad.find(
      (c) => normalizarCarteira(c.nome) === normalizarCarteira(carteira),
    );

    const responsaveis = obterResponsaveisCarteira(
      carteira,
      carteirasCad,
      analistasCad || [],
      supervisoresCad || [],
      empresasAtivas,
    );

    return {
      nome: carteira,
      categoria: carteiraObj?.categoria || "Geral",
      analistas: responsaveis.analistas.length > 0 ? responsaveis.analistas : ["Equipe Operacional"],
      supervisor: responsaveis.supervisor || "Supervisão Geral",
    };
  }, [carteira, carteirasCad, analistasCad, supervisoresCad, empresasAtivas]);

  // ── Cálculos agregados (memoizados) ────────────────────────────────────────
  const resumoFolha = useMemo(
    () => calcularResumoFolha(folhaTarefas, empresasAtivas, competencia, carteira),
    [folhaTarefas, empresasAtivas, competencia, carteira],
  );

  const transmissoesFolhaVencimento = useMemo(
    () =>
      calcularTransmissoesFolhaPorVencimento(
        folhaTarefas,
        empresasAtivas,
        particularidades,
        competencia,
        carteira,
      ),
    [folhaTarefas, empresasAtivas, particularidades, competencia, carteira],
  );

  // Estado do modal de detalhes da transmissão da folha por vencimento
  const [modalVencimento, setModalVencimento] = useState<ItemTransmissaoFolhaVencimento | null>(null);
  const [buscaEmpresasVenc, setBuscaEmpresasVenc] = useState("");
  const [filtroStatusVenc, setFiltroStatusVenc] = useState<"todas" | "transmitidas" | "pendentes">("todas");

  const empresasFiltradasModal = useMemo(() => {
    if (!modalVencimento) return [];
    return modalVencimento.empresas.filter((emp) => {
      if (filtroStatusVenc === "transmitidas" && !emp.transmitida) return false;
      if (filtroStatusVenc === "pendentes" && emp.transmitida) return false;
      if (buscaEmpresasVenc.trim()) {
        const q = buscaEmpresasVenc.toLowerCase().trim();
        const match =
          emp.nome.toLowerCase().includes(q) ||
          emp.codigo.toLowerCase().includes(q) ||
          emp.responsavel.toLowerCase().includes(q) ||
          emp.carteira.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [modalVencimento, filtroStatusVenc, buscaEmpresasVenc]);

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
  const totalVidas = empresasFiltradas.reduce(
    (acc, e) => acc + (Number(e.funcionarios) || 0),
    0,
  );

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

      {/* ── PAINEL CENTRALIZADO DE CONTROLE EXECUTIVO & FILTROS COM ALTO DESTAQUE ── */}
      <div className="surface-panel relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-b from-card via-card to-primary/5 p-5 md:p-6 shadow-md">
        <div className="flex flex-col items-center text-center gap-5">
          {/* Barra de Filtros Centralizada */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Seletor de Competência */}
            <div className="flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-background/90 px-3.5 py-1.5 shadow-sm hover:border-primary transition-all">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Competência:
              </span>
              <Select value={competencia} onValueChange={setCompetencia}>
                <SelectTrigger className="h-8 w-32 border-0 bg-transparent text-sm font-bold text-foreground focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {competencias.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs font-semibold">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Carteira */}
            {isOperacional ? (
              <div className="flex items-center gap-2 rounded-xl border-2 border-emerald-500/30 bg-background/90 px-3.5 py-1.5 shadow-sm">
                <Briefcase className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Carteira:
                </span>
                <span className="text-sm font-bold text-foreground">
                  {currentUser.carteira || carteira}
                </span>
                <span className="ml-1 rounded border bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold">
                  Sua Carteira
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-background/90 px-3.5 py-1.5 shadow-sm hover:border-primary transition-all">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Carteira:
                  </span>
                  <Select value={carteira} onValueChange={setCarteira}>
                    <SelectTrigger className="h-8 min-w-44 border-0 bg-transparent text-sm font-bold text-foreground focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TODAS_CARTEIRAS} className="text-xs font-bold text-primary">
                        ★ Todas as Carteiras (Consolidado)
                      </SelectItem>
                      {nomesCarteiras.map((c) => {
                        const catObj = carteirasCad.find(
                          (x) => normalizarCarteira(x.nome) === normalizarCarteira(c),
                        );
                        return (
                          <SelectItem key={c} value={c} className="text-xs">
                            <span className="font-semibold">{c}</span>
                            {catObj?.categoria && (
                              <span className="ml-2 rounded border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {catObj.categoria}
                              </span>
                            )}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão de alternar para Todas */}
                {carteira !== TODAS_CARTEIRAS ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCarteira(TODAS_CARTEIRAS)}
                    className="h-11 rounded-xl border-primary/30 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                  >
                    <XCircle className="h-4 w-4 mr-1.5 text-primary" /> Ver Todas as Carteiras
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 text-xs font-bold text-primary">
                    <Layers className="h-4 w-4" /> Visão Geral Consolidada
                  </span>
                )}
              </>
            )}
          </div>

          {/* Divisor Elegante */}
          <div className="w-full max-w-5xl border-t border-border/60" />

          {/* Cards de Identificação dos Responsáveis, Categoria e Carteira em Destaque Central */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full max-w-6xl">
            {/* 1. Carteira Ativa */}
            <div className="flex flex-col items-center justify-center rounded-xl border bg-background/80 p-3.5 text-center shadow-2xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                <Briefcase className="h-3.5 w-3.5 text-primary" /> Carteira Selecionada
              </span>
              <p className="text-base font-extrabold text-foreground truncate max-w-full">
                {carteiraInfo.nome}
              </p>
            </div>

            {/* 2. Categoria da Carteira Dinâmica */}
            <div className="flex flex-col items-center justify-center rounded-xl border bg-background/80 p-3.5 text-center shadow-2xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                <Tag className="h-3.5 w-3.5 text-primary" /> Categoria / Segmento
              </span>
              <span
                className="inline-flex items-center justify-center text-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-extrabold text-primary max-w-full truncate"
                title={carteiraInfo.categoria}
              >
                {carteiraInfo.categoria}
              </span>
            </div>

            {/* 3. Analista Responsável */}
            <div className="flex flex-col items-center justify-center rounded-xl border bg-background/80 p-3.5 text-center shadow-2xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                <UserCheck className="h-3.5 w-3.5 text-primary" /> Analista(s) Responsável(is)
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1">
                {carteiraInfo.analistas.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-xs font-extrabold text-foreground"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* 4. Supervisor Responsável */}
            <div className="flex flex-col items-center justify-center rounded-xl border bg-background/80 p-3.5 text-center shadow-2xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Supervisor Responsável
              </span>
              <p className="text-sm font-extrabold text-foreground">
                {carteiraInfo.supervisor}
              </p>
            </div>

            {/* 5. Período / Competência */}
            <div className="flex flex-col items-center justify-center rounded-xl border bg-background/80 p-3.5 text-center shadow-2xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Competência Ativa
              </span>
              <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-0.5 text-xs font-extrabold text-foreground tabular-nums">
                {competencia}
              </span>
            </div>
          </div>
        </div>
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

      {/* ── Transmissão da Folha por Vencimento ──────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle icon={Calendar}>
            Transmissão da Folha por Vencimento
          </SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {transmissoesFolhaVencimento.totalTransmitidas} transmitidas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
              <Clock className="h-3.5 w-3.5" />
              {transmissoesFolhaVencimento.totalPendentes} pendentes
            </span>
            {transmissoesFolhaVencimento.totalEmAtraso > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                {transmissoesFolhaVencimento.totalEmAtraso} em atraso
              </span>
            )}
          </div>
        </div>

        {transmissoesFolhaVencimento.itens.length === 0 ? (
          <EmptyState label="Nenhuma empresa encontrada para a competência e carteira selecionadas." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {transmissoesFolhaVencimento.itens.map((item) => {
              const temAtraso = item.emAtraso > 0;

              return (
                <div
                  key={item.dia}
                  className="surface-panel flex flex-col justify-between p-4 transition-all hover:ring-2 hover:ring-primary/40 shadow-xs"
                >
                  <div>
                    {/* Header do Card */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs shrink-0",
                            item.isDomestica
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                              : "bg-primary/10 text-primary text-sm",
                          )}
                        >
                          {item.isDomestica ? "DOM" : item.dia}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-foreground leading-tight flex items-center gap-1.5">
                            {item.tituloCard}
                            {item.isDomestica && (
                              <span className="rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 px-1 py-0.2 text-[9px] font-semibold">
                                PF
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            {item.subtitulo ?? `Vencimento dia ${item.dia}`}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-md border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {item.total} {item.total === 1 ? (item.isDomestica ? "doméstica" : "empresa") : (item.isDomestica ? "domésticas" : "empresas")}
                      </span>
                    </div>

                    {/* Destaques: Transmitidas vs Pendentes */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="rounded-lg border border-success/30 bg-success/10 p-2.5">
                        <div className="flex items-center gap-1.5 text-success">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-[10px] font-semibold uppercase tracking-wide">
                            Transmitidas
                          </span>
                        </div>
                        <p className="mt-1 text-2xl font-extrabold tabular-nums text-success leading-none">
                          {item.transmitidas}
                        </p>
                      </div>

                      <div
                        className={cn(
                          "rounded-lg border p-2.5",
                          item.pendentes > 0
                            ? "border-warning/30 bg-warning/10"
                            : "border-muted bg-muted/30",
                        )}
                      >
                        <div className="flex items-center gap-1.5 text-warning">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-[10px] font-semibold uppercase tracking-wide">
                            Pendentes
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-1 text-2xl font-extrabold tabular-nums leading-none",
                            item.pendentes > 0 ? "text-warning" : "text-muted-foreground",
                          )}
                        >
                          {item.pendentes}
                        </p>
                      </div>
                    </div>

                    {/* Progresso de Transmissão */}
                    <div className="mb-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Transmissão</span>
                        <span className="font-bold tabular-nums">
                          {item.pctTransmitido}%
                        </span>
                      </div>
                      <ProgressBar
                        value={item.pctTransmitido}
                        tone={
                          item.pctTransmitido >= 80
                            ? "success"
                            : item.pctTransmitido >= 50
                              ? "warning"
                              : "danger"
                        }
                      />
                    </div>

                    {/* Detalhamento por Status */}
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                      <div className="rounded border bg-card/60 p-1" title="Concluídas">
                        <p className="font-bold tabular-nums text-success">{item.porStatus.concluida}</p>
                        <p className="text-muted-foreground truncate">Concl.</p>
                      </div>
                      <div className="rounded border bg-card/60 p-1" title="Em Conferência">
                        <p className="font-bold tabular-nums text-primary">{item.porStatus.conferencia}</p>
                        <p className="text-muted-foreground truncate">Conf.</p>
                      </div>
                      <div className="rounded border bg-card/60 p-1" title="Em Andamento">
                        <p className="font-bold tabular-nums text-info">{item.porStatus.andamento}</p>
                        <p className="text-muted-foreground truncate">Andam.</p>
                      </div>
                      <div className="rounded border bg-card/60 p-1" title="Aguardando / Não Iniciadas">
                        <p className="font-bold tabular-nums text-muted-foreground">
                          {item.porStatus.nao_iniciada + item.porStatus.aguardando}
                        </p>
                        <p className="text-muted-foreground truncate">Não Inic.</p>
                      </div>
                    </div>

                    {/* Alerta de Atraso se houver */}
                    {temAtraso && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{item.emAtraso} folha{item.emAtraso > 1 ? "s" : ""} em atraso</span>
                      </div>
                    )}
                  </div>

                  {/* Ação: Ver empresas */}
                  <div className="mt-3.5 pt-2.5 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setModalVencimento(item);
                        setBuscaEmpresasVenc("");
                        setFiltroStatusVenc("todas");
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary py-1.5 text-xs font-semibold transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {item.isDomestica ? `Ver Domésticas (${item.total})` : `Ver Empresas (${item.total})`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

      {/* ── Modal de Detalhes da Folha por Vencimento ──────────────── */}
      <Dialog
        open={Boolean(modalVencimento)}
        onOpenChange={(open) => {
          if (!open) {
            setModalVencimento(null);
            setBuscaEmpresasVenc("");
            setFiltroStatusVenc("todas");
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b bg-muted/20">
            <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold",
                      modalVencimento?.isDomestica
                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                        : "bg-primary/15 text-primary",
                    )}
                  >
                    {modalVencimento?.isDomestica ? "DOM" : modalVencimento?.dia}
                  </span>
                  Transmissão da Folha — {modalVencimento?.label}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Competência: <strong className="text-foreground">{competencia}</strong> · Carteira:{" "}
                  <strong className="text-foreground">{carteira}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-md bg-success/15 px-2.5 py-1 font-semibold text-success">
                  {modalVencimento?.transmitidas} Transmitidas
                </span>
                <span className="rounded-md bg-warning/15 px-2.5 py-1 font-semibold text-warning">
                  {modalVencimento?.pendentes} Pendentes
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Barra de filtros internos */}
          <div className="p-3 border-b bg-background flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, empresa ou responsável..."
                value={buscaEmpresasVenc}
                onChange={(e) => setBuscaEmpresasVenc(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(["todas", "transmitidas", "pendentes"] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFiltroStatusVenc(tipo)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all",
                    filtroStatusVenc === tipo
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tipo === "todas" ? "Todas" : tipo === "transmitidas" ? "Transmitidas" : "Pendentes"}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela de Empresas */}
          <div className="flex-1 overflow-y-auto p-4">
            {empresasFiltradasModal.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
                <p className="text-xs text-muted-foreground">
                  Nenhuma empresa encontrada com os filtros atuais.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 px-3 text-left font-medium">Cód.</th>
                      <th className="py-2 px-3 text-left font-medium">Empresa</th>
                      <th className="py-2 px-3 text-left font-medium">Carteira</th>
                      <th className="py-2 px-3 text-left font-medium">Responsável</th>
                      <th className="py-2 px-3 text-center font-medium">Empregados</th>
                      <th className="py-2 px-3 text-center font-medium">Status da Folha</th>
                      <th className="py-2 px-3 text-right font-medium">Publicação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {empresasFiltradasModal.map((emp) => {
                      const statusMeta = statusFolhaMeta[emp.status];
                      return (
                        <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-3 font-mono font-semibold text-muted-foreground">
                            {emp.codigo}
                          </td>
                          <td className="py-2 px-3 font-medium text-foreground">
                            {emp.nome}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {emp.carteira}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {emp.responsavel}
                          </td>
                          <td className="py-2 px-3 text-center tabular-nums">
                            {emp.empregados ?? "—"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                                statusMeta.className,
                              )}
                            >
                              {emp.transmitida && <Check className="h-3 w-3" />}
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                            {emp.dataConclusao || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer do Modal */}
          <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Exibindo {empresasFiltradasModal.length} de {modalVencimento?.total} empresas
            </span>
            <button
              type="button"
              onClick={() => {
                setModalVencimento(null);
                goToFolha();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
            >
              Ir para Folha de Pagamento <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
