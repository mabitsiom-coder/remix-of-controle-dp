import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Briefcase,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  ArrowUpDown,
  Filter,
  XCircle,
  ExternalLink,
  Info,
  Layers,
  ChevronRight,
  Tag,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmpresas } from "@/lib/empresas-store";
import { useCadastros } from "@/lib/cadastros-store";
import { useTarefas, type Tarefa } from "@/lib/tarefas-store";
import { useFolhaTarefasSalvas } from "@/lib/folha-db";
import { listarNomesCarteiras, TODAS_CARTEIRAS, normalizarCarteira } from "@/lib/carteiras-core";
import {
  calcularMetricasCarteira,
  gerarResumoTodasCarteiras,
  type MetricasCarteira,
  type TarefaAtrasadaItem,
} from "@/lib/bi-service";
import { RastreabilidadeEmpresasDialog } from "@/components/rastreabilidade-empresas-dialog";
import { DetalhesRotinaDialog } from "@/components/detalhes-rotina-dialog";
import { rankingAnalistas, slaMensal } from "@/lib/mock-data";

export const Route = createFileRoute("/bi")({
  head: () => ({
    meta: [
      { title: "Gestão por Carteira — Departamento Pessoal" },
      {
        name: "description",
        content:
          "Dashboard gerencial por Carteira e Competência: empresas com movimento, acompanhamento de tarefas, SLA e produtividade.",
      },
      { property: "og:title", content: "Gestão por Carteira — Departamento Pessoal" },
      {
        property: "og:description",
        content: "Indicadores operacionais e gerenciais do DP.",
      },
    ],
  }),
  component: BIGerencial,
});

const COMPETENCIAS_DISPONIVEIS = [
  "08/2026",
  "07/2026",
  "06/2026",
  "05/2026",
  "09/2026",
  "10/2026",
];

const CORES_TAREFAS = {
  concluidas: "var(--chart-2, #10b981)",
  andamento: "var(--chart-1, #3b82f6)",
  atrasadas: "var(--destructive, #f43f5e)",
};

const CORES_MOVIMENTO = {
  comMovimento: "#10b981",
  semMovimento: "#f59e0b",
};

const tooltipStyle = {
  backgroundColor: "var(--popover, #1e293b)",
  border: "1px solid var(--border, #334155)",
  borderRadius: "10px",
  color: "var(--popover-foreground, #f8fafc)",
  fontSize: 12,
};

function BIGerencial() {
  // Filtros principais
  const [competencia, setCompetencia] = useState("08/2026");
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>(TODAS_CARTEIRAS);

  // Estados de modais e interações
  const [modalEmpresasAberto, setModalEmpresasAberto] = useState(false);
  const [modalEmpresasTitulo, setModalEmpresasTitulo] = useState("");
  const [modalEmpresasSubtitulo, setModalEmpresasSubtitulo] = useState("");
  const [modalEmpresasLista, setModalEmpresasLista] = useState<any[]>([]);

  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null);
  const [detalhesTarefaAberto, setDetalhesTarefaAberto] = useState(false);

  // Ordenação da tabela consolidada
  const [sortField, setSortField] = useState<string>("totalEmpresas");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Stores
  const { empresas } = useEmpresas();
  const { carteiras, analistas, supervisores } = useCadastros();
  const { tarefas } = useTarefas();
  const { folhaTarefas } = useFolhaTarefasSalvas();

  // Lista de carteiras ativas
  const nomesCarteiras = useMemo(() => {
    return listarNomesCarteiras(empresas, carteiras);
  }, [empresas, carteiras]);

  // Métricas da carteira e competência selecionadas
  const metricas: MetricasCarteira = useMemo(() => {
    return calcularMetricasCarteira({
      carteiraFiltro,
      competencia,
      empresas,
      carteiras,
      analistas,
      supervisores,
      tarefas,
      folhaTarefas,
    });
  }, [carteiraFiltro, competencia, empresas, carteiras, analistas, supervisores, tarefas, folhaTarefas]);

  // Resumo consolidado de todas as carteiras
  const resumoTodasCarteiras = useMemo(() => {
    return gerarResumoTodasCarteiras({
      competencia,
      nomesCarteiras,
      empresas,
      carteiras,
      analistas,
      supervisores,
      tarefas,
      folhaTarefas,
    });
  }, [competencia, nomesCarteiras, empresas, carteiras, analistas, supervisores, tarefas, folhaTarefas]);

  // Ordenar resumo de carteiras
  const resumoOrdenado = useMemo(() => {
    return [...resumoTodasCarteiras].sort((a, b) => {
      const vA = (a as any)[sortField];
      const vB = (b as any)[sortField];
      if (typeof vA === "string") {
        return sortOrder === "asc" ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return sortOrder === "asc" ? Number(vA) - Number(vB) : Number(vB) - Number(vA);
    });
  }, [resumoTodasCarteiras, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Funções para abrir modal de rastreabilidade
  const abrirEmpresasTotal = () => {
    setModalEmpresasTitulo(`Total de Empresas — ${metricas.carteiraNome}`);
    setModalEmpresasSubtitulo(`${metricas.totalEmpresas} empresa(s) pertencentes à carteira na competência ${competencia}`);
    setModalEmpresasLista(metricas.empresasLista);
    setModalEmpresasAberto(true);
  };

  const abrirEmpresasComMovimento = () => {
    setModalEmpresasTitulo(`Empresas com Movimento — ${metricas.carteiraNome}`);
    setModalEmpresasSubtitulo(`${metricas.comMovimento} empresa(s) com movimento (${metricas.pctComMovimento}% da carteira) em ${competencia}`);
    setModalEmpresasLista(metricas.empresasComMovimentoLista);
    setModalEmpresasAberto(true);
  };

  const abrirEmpresasSemMovimento = () => {
    setModalEmpresasTitulo(`Empresas sem Movimento — ${metricas.carteiraNome}`);
    setModalEmpresasSubtitulo(`${metricas.semMovimento} empresa(s) classificadas sem movimento (${metricas.pctSemMovimento}% da carteira) em ${competencia}`);
    setModalEmpresasLista(metricas.empresasSemMovimentoLista);
    setModalEmpresasAberto(true);
  };

  const abrirEmpresasPorCategoria = (categoria: string) => {
    const lista = metricas.empresasLista.filter((e) => {
      const reg = e.regime || "";
      if (categoria === "Simples Nacional") return reg.includes("Simples");
      if (categoria === "Lucro Presumido") return reg.includes("Presumido");
      if (categoria === "Lucro Real") return reg.includes("Real");
      if (categoria === "MEI") return reg.includes("MEI");
      return true;
    });

    setModalEmpresasTitulo(`Empresas: ${categoria} — ${metricas.carteiraNome}`);
    setModalEmpresasSubtitulo(`${lista.length} empresa(s) nesta categoria em ${competencia}`);
    setModalEmpresasLista(lista);
    setModalEmpresasAberto(true);
  };

  const abrirDetalheTarefa = (item: TarefaAtrasadaItem) => {
    if (item.originalTarefa) {
      setTarefaSelecionada(item.originalTarefa);
      setDetalhesTarefaAberto(true);
    }
  };

  // Dados para gráficos
  const dadosGraficoTarefas = useMemo(() => [
    { name: "Concluídas", value: metricas.tarefasConcluidas, color: CORES_TAREFAS.concluidas },
    { name: "Em Andamento", value: metricas.tarefasAndamento, color: CORES_TAREFAS.andamento },
    { name: "Em Atraso", value: metricas.tarefasAtrasadas, color: CORES_TAREFAS.atrasadas },
  ], [metricas]);

  const dadosGraficoMovimento = useMemo(() => [
    { name: "Com Movimento", value: metricas.comMovimento, color: CORES_MOVIMENTO.comMovimento },
    { name: "Sem Movimento", value: metricas.semMovimento, color: CORES_MOVIMENTO.semMovimento },
  ], [metricas]);

  return (
    <div className="space-y-6">
      {/* 1. CABEÇALHO PRINCIPAL */}
      <PageHeader
        title="Gestão por Carteira"
        description="Acompanhamento executivo de empresas, movimentação, tarefas e produtividade do DP."
      />

      {/* 2. PAINEL CENTRALIZADO DE CONTROLE EXECUTIVO & FILTROS COM ALTO DESTAQUE */}
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
                  {COMPETENCIAS_DISPONIVEIS.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs font-semibold">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Carteira */}
            <div className="flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-background/90 px-3.5 py-1.5 shadow-sm hover:border-primary transition-all">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Carteira:
              </span>
              <Select value={carteiraFiltro} onValueChange={setCarteiraFiltro}>
                <SelectTrigger className="h-8 min-w-44 border-0 bg-transparent text-sm font-bold text-foreground focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS_CARTEIRAS} className="text-xs font-bold text-primary">
                    ★ Todas as Carteiras (Consolidado)
                  </SelectItem>
                  {nomesCarteiras.map((c) => {
                    const catObj = carteiras.find(
                      (x) => normalizarCarteira(x.nome) === normalizarCarteira(c)
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
            {carteiraFiltro !== TODAS_CARTEIRAS ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCarteiraFiltro(TODAS_CARTEIRAS)}
                className="h-11 rounded-xl border-primary/30 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
              >
                <XCircle className="h-4 w-4 mr-1.5 text-primary" /> Ver Todas as Carteiras
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 text-xs font-bold text-primary">
                <Layers className="h-4 w-4" /> Visão Geral Consolidada
              </span>
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
                {metricas.carteiraNome}
              </p>
            </div>

            {/* 2. Categoria da Carteira Dinâmica */}
            <div className="flex flex-col items-center justify-center rounded-xl border bg-background/80 p-3.5 text-center shadow-2xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                <Tag className="h-3.5 w-3.5 text-primary" /> Categoria / Segmento
              </span>
              <span
                className="inline-flex items-center justify-center text-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-extrabold text-primary max-w-full truncate"
                title={metricas.carteiraCategoria}
              >
                {metricas.carteiraCategoria}
              </span>
            </div>

            {/* 3. Analista Responsável */}
            <div className="flex flex-col items-center justify-center rounded-xl border bg-background/80 p-3.5 text-center shadow-2xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                <UserCheck className="h-3.5 w-3.5 text-primary" /> Analista(s) Responsável(is)
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1">
                {metricas.analistas.map((a, i) => (
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
                {metricas.supervisor}
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

      {/* 3. CARDS DE INDICADORES: EMPRESAS & TAREFAS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {/* Total de Empresas */}
        <div
          onClick={abrirEmpresasTotal}
          className="surface-panel group cursor-pointer p-3.5 transition-all hover:border-primary/50 hover:shadow-sm"
          title="Clique para ver lista de empresas"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Empresas</span>
            <Building2 className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{metricas.totalEmpresas}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Info className="h-2.5 w-2.5" /> Ver relação completa
          </p>
        </div>

        {/* Empresas com Movimento */}
        <div
          onClick={abrirEmpresasComMovimento}
          className="surface-panel group cursor-pointer border-emerald-500/20 bg-emerald-500/5 p-3.5 transition-all hover:border-emerald-500/50 hover:shadow-sm"
          title="Clique para ver empresas com movimento"
        >
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Com Movimento</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {metricas.comMovimento}
          </p>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
            {metricas.pctComMovimento}% da carteira
          </p>
        </div>

        {/* Empresas sem Movimento */}
        <div
          onClick={abrirEmpresasSemMovimento}
          className="surface-panel group cursor-pointer border-amber-500/20 bg-amber-500/5 p-3.5 transition-all hover:border-amber-500/50 hover:shadow-sm"
          title="Clique para ver empresas sem movimento"
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Sem Movimento</span>
            <XCircle className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {metricas.semMovimento}
          </p>
          <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium mt-0.5">
            {metricas.pctSemMovimento}% da carteira
          </p>
        </div>

        {/* Total de Tarefas */}
        <div className="surface-panel p-3.5">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Tarefas</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{metricas.totalTarefas}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Competência {competencia}
          </p>
        </div>

        {/* Tarefas Concluídas */}
        <div className="surface-panel border-emerald-500/20 bg-emerald-500/5 p-3.5">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Concluídas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {metricas.tarefasConcluidas}
          </p>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
            {metricas.pctConcluidas}% concluído
          </p>
        </div>

        {/* Tarefas Em Andamento */}
        <div className="surface-panel border-blue-500/20 bg-blue-500/5 p-3.5">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Em Andamento</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
            {metricas.tarefasAndamento}
          </p>
          <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium mt-0.5">
            {metricas.pctAndamento}% em processo
          </p>
        </div>

        {/* Tarefas Em Atraso */}
        <div className="surface-panel border-rose-500/20 bg-rose-500/5 p-3.5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Em Atraso</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {metricas.tarefasAtrasadas}
          </p>
          <p className="text-[10px] text-rose-700 dark:text-rose-300 font-medium mt-0.5">
            {metricas.pctAtrasadas}% atrasado
          </p>
        </div>
      </div>

      {/* 4. DASHBOARDS GRÁFICOS */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Gráfico 1: Movimento das Empresas */}
        <div className="surface-panel p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary" /> Movimento das Empresas
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                Total: {metricas.totalEmpresas}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Comparativo entre empresas ativas com e sem movimento na competência {competencia}.
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosGraficoMovimento}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {dadosGraficoMovimento.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  formatter={(value, entry: any) => (
                    <span className="text-xs font-medium text-foreground">
                      {value} ({entry.payload.value} · {metricas.totalEmpresas > 0 ? Math.round((entry.payload.value / metricas.totalEmpresas) * 100) : 0}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-3 text-center text-xs">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">
              <p className="text-[10px] uppercase font-bold">Com Movimento</p>
              <p className="text-base font-bold">{metricas.comMovimento} ({metricas.pctComMovimento}%)</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-700 dark:text-amber-300">
              <p className="text-[10px] uppercase font-bold">Sem Movimento</p>
              <p className="text-base font-bold">{metricas.semMovimento} ({metricas.pctSemMovimento}%)</p>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Situação das Tarefas */}
        <div className="surface-panel p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Situação das Tarefas
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                Total: {metricas.totalTarefas}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Distribuição do status das tarefas e rotinas da carteira na competência {competencia}.
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosGraficoTarefas}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {dadosGraficoTarefas.map((entry, index) => (
                    <Cell key={`cell-task-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  formatter={(value, entry: any) => (
                    <span className="text-xs font-medium text-foreground">
                      {value} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1 border-t pt-3 text-center text-xs">
            <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-300">
              <p className="text-[9px] uppercase font-bold">Concluídas</p>
              <p className="text-sm font-bold">{metricas.pctConcluidas}%</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-700 dark:text-blue-300">
              <p className="text-[9px] uppercase font-bold">Em Andamento</p>
              <p className="text-sm font-bold">{metricas.pctAndamento}%</p>
            </div>
            <div className="rounded-lg bg-rose-500/10 p-1.5 text-rose-700 dark:text-rose-300">
              <p className="text-[9px] uppercase font-bold">Em Atraso</p>
              <p className="text-sm font-bold">{metricas.pctAtrasadas}%</p>
            </div>
          </div>
        </div>

        {/* Gráfico 3: Distribuição por Categoria */}
        <div className="surface-panel p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" /> Distribuição por Categoria
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                {metricas.distribuicaoCategorias.length} categorias
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Divisão das empresas da carteira por regime tributário e porte.
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metricas.distribuicaoCategorias}
                layout="vertical"
                margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="categoria"
                  type="category"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: any, name: any, item: any) => [
                    `${value} empresa(s) (${item.payload.percentual}%)`,
                    "Quantidade",
                  ]}
                />
                <Bar
                  dataKey="quantidade"
                  fill="var(--chart-1, #3b82f6)"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                  onClick={(data: any) => abrirEmpresasPorCategoria(data.categoria)}
                  className="cursor-pointer hover:opacity-80"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 border-t pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Dica: clique em uma barra para filtrar</span>
            <Button
              variant="link"
              size="sm"
              onClick={abrirEmpresasTotal}
              className="h-auto p-0 text-[11px] text-primary"
            >
              Ver todas as empresas →
            </Button>
          </div>
        </div>
      </div>

      {/* 5. DESEMPENHO E EVOLUÇÃO DAS TAREFAS */}
      <div className="surface-panel p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Desempenho Operacional das Tarefas
            </h3>
            <p className="text-xs text-muted-foreground">
              Taxa de conclusão e eficiência das rotinas na competência {competencia}.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400">
              Concluídas: {metricas.pctConcluidas}%
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              Andamento: {metricas.pctAndamento}%
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              Atrasadas: {metricas.pctAtrasadas}%
            </span>
          </div>
        </div>

        {/* Barra de Progresso Tríplice */}
        <div className="space-y-1.5">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted/60 flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${metricas.pctConcluidas}%` }}
              title={`Concluídas: ${metricas.tarefasConcluidas} (${metricas.pctConcluidas}%)`}
            />
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${metricas.pctAndamento}%` }}
              title={`Em Andamento: ${metricas.tarefasAndamento} (${metricas.pctAndamento}%)`}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${metricas.pctAtrasadas}%` }}
              title={`Em Atraso: ${metricas.tarefasAtrasadas} (${metricas.pctAtrasadas}%)`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>0%</span>
            <span>Meta de Conclusão: 100% da Folha e Rotinas</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* 6. TABELA DETALHADA: VISÃO CONSOLIDADA OU TAREFAS EM ATRASO */}
      {metricas.isConsolidado ? (
        /* VISÃO CONSOLIDADA — TODAS AS CARTEIRAS */
        <div className="surface-panel overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border-b bg-muted/20 gap-2">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Comparativo de Desempenho por Carteira
              </h3>
              <p className="text-xs text-muted-foreground">
                Visão consolidada da competência {competencia}. Clique em uma carteira para abrir sua visão detalhada.
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {resumoOrdenado.length} carteiras analisadas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold">
                <tr>
                  <th
                    className="p-3 text-left cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("carteiraNome")}
                  >
                    <div className="flex items-center gap-1">
                      Carteira <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-left cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("carteiraCategoria")}
                  >
                    <div className="flex items-center gap-1">
                      Categoria / Segmento <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-3 text-left">Analista(s)</th>
                  <th className="p-3 text-left">Supervisor</th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalEmpresas")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Empresas <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("comMovimento")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Com Mov. <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("semMovimento")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Sem Mov. <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalTarefas")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Tarefas <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("concluidas")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Concluídas <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("atrasadas")}
                  >
                    <div className="flex items-center justify-center gap-1 text-rose-600">
                      Em Atraso <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("pctConclusao")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      % Conclusão <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-3 text-center w-12" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {resumoOrdenado.map((r) => (
                  <tr
                    key={r.carteiraId}
                    onClick={() => setCarteiraFiltro(r.carteiraNome)}
                    className="hover:bg-muted/40 cursor-pointer transition-colors group"
                  >
                    <td className="p-3 font-semibold text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary/60" />
                      {r.carteiraNome}
                    </td>
                    <td className="p-3">
                      <span
                        className="inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary max-w-[170px] truncate"
                        title={r.carteiraCategoria}
                      >
                        {r.carteiraCategoria}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground max-w-[180px] truncate" title={r.analistasStr}>
                      {r.analistasStr}
                    </td>
                    <td className="p-3 text-muted-foreground">{r.supervisorStr}</td>
                    <td className="p-3 text-center font-semibold tabular-nums">
                      {r.totalEmpresas}
                    </td>
                    <td className="p-3 text-center tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                      {r.comMovimento}
                    </td>
                    <td className="p-3 text-center tabular-nums text-amber-600 dark:text-amber-400 font-medium">
                      {r.semMovimento}
                    </td>
                    <td className="p-3 text-center tabular-nums">{r.totalTarefas}</td>
                    <td className="p-3 text-center tabular-nums text-emerald-600 font-medium">
                      {r.concluidas}
                    </td>
                    <td className="p-3 text-center tabular-nums font-bold text-rose-600 dark:text-rose-400">
                      {r.atrasadas > 0 ? r.atrasadas : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${r.pctConclusao}%` }}
                          />
                        </div>
                        <span className="font-semibold tabular-nums text-xs">
                          {r.pctConclusao}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-muted-foreground group-hover:text-primary">
                      <ChevronRight className="h-4 w-4 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISÃO CARTEIRA INDIVIDUAL — TAREFAS EM ATRASO & ROTINAS CRÍTICAS */
        <div className="surface-panel overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border-b bg-muted/20 gap-2">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" /> Tarefas em Atraso & Atenção Operacional
              </h3>
              <p className="text-xs text-muted-foreground">
                Rotinas da carteira <strong>{metricas.carteiraNome}</strong> com prazo expirado na competência {competencia}.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">
              {metricas.tarefasAtrasadasLista.length} tarefa(s) atrasada(s)
            </span>
          </div>

          {metricas.tarefasAtrasadasLista.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
              <h4 className="text-sm font-semibold text-foreground">Tudo em dia nesta carteira!</h4>
              <p className="text-xs max-w-sm mt-1">
                Nenhuma tarefa em atraso para a carteira {metricas.carteiraNome} na competência {competencia}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3 text-left">Empresa</th>
                    <th className="p-3 text-left">Tarefa</th>
                    <th className="p-3 text-left">Categoria</th>
                    <th className="p-3 text-left">Vencimento</th>
                    <th className="p-3 text-center">Dias em Atraso</th>
                    <th className="p-3 text-left">Analista</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-center w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {metricas.tarefasAtrasadasLista.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => abrirDetalheTarefa(item)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="p-3 font-semibold text-foreground max-w-[200px] truncate" title={item.empresa}>
                        {item.empresa}
                      </td>
                      <td className="p-3 font-medium text-foreground max-w-[220px] truncate" title={item.tarefa}>
                        {item.tarefa}
                      </td>
                      <td className="p-3">
                        <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium bg-muted">
                          {item.categoria || "Folha"}
                        </span>
                      </td>
                      <td className="p-3 tabular-nums font-mono text-muted-foreground">
                        {item.vencimento}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          {item.diasEmAtraso} dia(s)
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{item.analista}</td>
                      <td className="p-3">
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/5 px-2 py-0.5 text-[10px] font-medium text-rose-600">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {item.originalTarefa && (
                          <span className="p-1 hover:text-primary transition-colors inline-block" title="Ver detalhes">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7. INDICADORES COMPLEMENTARES DE PERFORMANCE E SLA */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Histórico de SLA x Retrabalho (Geral)
            </h3>
            <span className="text-xs text-muted-foreground">Últimos meses</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slaMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" name="SLA (%)" dataKey="sla" stroke="var(--chart-2, #10b981)" strokeWidth={2.5} dot />
                <Line type="monotone" name="Retrabalho (%)" dataKey="retrabalho" stroke="var(--chart-4, #f43f5e)" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-panel p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" /> Produtividade da Equipe de Analistas
            </h3>
            <span className="text-xs text-muted-foreground">Ranking operacional</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left uppercase text-muted-foreground font-semibold">
                  <th className="p-2">Colaborador</th>
                  <th className="p-2 text-center">Concluídas</th>
                  <th className="p-2 text-center">SLA Médio</th>
                  <th className="p-2 text-center">Erros</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rankingAnalistas.map((a) => (
                  <tr key={a.nome} className="hover:bg-muted/30 transition-colors">
                    <td className="p-2 font-medium">{a.nome}</td>
                    <td className="p-2 text-center tabular-nums font-semibold">{a.concluidas}</td>
                    <td className="p-2 text-center tabular-nums text-emerald-600 font-semibold">{a.sla}%</td>
                    <td className="p-2 text-center tabular-nums text-muted-foreground">{a.erros}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DIÁLOGO DE RASTREABILIDADE DE EMPRESAS */}
      <RastreabilidadeEmpresasDialog
        open={modalEmpresasAberto}
        onOpenChange={setModalEmpresasAberto}
        titulo={modalEmpresasTitulo}
        subtitulo={modalEmpresasSubtitulo}
        empresas={modalEmpresasLista}
      />

      {/* DIÁLOGO DE DETALHES DA TAREFA */}
      <DetalhesRotinaDialog
        tarefa={tarefaSelecionada}
        open={detalhesTarefaAberto}
        onOpenChange={setDetalhesTarefaAberto}
      />
    </div>
  );
}
