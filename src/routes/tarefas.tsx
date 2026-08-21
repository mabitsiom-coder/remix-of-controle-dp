import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Clock,
  Paperclip,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  Circle,
  Repeat,
  Info,
  ListChecks,
  Search,
  Filter,
  Download,
  Calendar,
  Sparkles,
  CheckSquare,
  Square,
  AlertTriangle,
  User,
  Tag,
  CalendarDays,
  Sun,
  Layers,
  ArrowRight,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NovaTarefaDialog } from "@/components/nova-tarefa-dialog";
import {
  ImportarRotinasDialog,
  downloadModeloXLSX,
} from "@/components/importar-rotinas-dialog";
import { DetalhesRotinaDialog } from "@/components/detalhes-rotina-dialog";
import {
  useTarefas,
  deleteTarefa,
  updateTarefa,
  toggleChecklistItem,
} from "@/lib/tarefas-store";
import type { Tarefa } from "@/lib/mock-data";

export const Route = createFileRoute("/tarefas")({
  head: () => ({
    meta: [
      { title: "Rotinas — Departamento Pessoal" },
      {
        name: "description",
        content:
          "Gestão de rotinas diárias e mensais do Departamento Pessoal com checklists marcáveis, kanban e importação Excel.",
      },
      { property: "og:title", content: "Rotinas — Departamento Pessoal" },
      {
        property: "og:description",
        content: "Submenus de rotinas diárias e mensais com checklists interativos.",
      },
    ],
  }),
  component: Tarefas,
});

type SubmenuRotinas = "diaria" | "mensal" | "todas";

const colunas = [
  { id: "backlog" as const, nome: "Backlog" },
  { id: "fazendo" as const, nome: "Em andamento" },
  { id: "revisao" as const, nome: "Em revisão" },
  { id: "concluida" as const, nome: "Concluída" },
];

const visoes = ["Checklist", "Kanban", "Lista", "Cronograma"] as const;

const PRIORIDADE_COR: Record<string, string> = {
  baixa: "bg-emerald-500/80",
  media: "bg-amber-500/80",
  alta: "bg-orange-500/80",
  critica: "bg-rose-600",
};

function TarefaCard({
  tarefa,
  onMover,
  onAbrirDetalhes,
}: {
  tarefa: Tarefa;
  onMover: (id: string, status: Tarefa["status"]) => void;
  onAbrirDetalhes: (t: Tarefa) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const checklist = tarefa.checklist ?? [];
  const feitos = checklist.filter((c) => c.feito).length;
  const pct =
    checklist.length > 0
      ? Math.round((feitos / checklist.length) * 100)
      : 0;

  const proxStatus: Record<Tarefa["status"], Tarefa["status"]> = {
    backlog: "fazendo",
    fazendo: "revisao",
    revisao: "concluida",
    concluida: "backlog",
  };
  const labelProx: Record<Tarefa["status"], string> = {
    backlog: "→ Iniciar",
    fazendo: "→ Revisar",
    revisao: "→ Concluir",
    concluida: "↺ Reabrir",
  };

  return (
    <div className="rounded-xl border bg-background shadow-2xs hover:shadow-sm transition-all group/card">
      {/* barra de prioridade */}
      <div
        className={`h-1 w-full rounded-t-xl ${PRIORIDADE_COR[tarefa.prioridade] ?? "bg-muted"}`}
      />

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm font-medium leading-tight cursor-pointer hover:text-primary transition-colors"
            onClick={() => onAbrirDetalhes(tarefa)}
          >
            {tarefa.titulo}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <StatusBadge status={tarefa.prioridade} />
            <button
              onClick={() => onAbrirDetalhes(tarefa)}
              className="p-1 text-muted-foreground hover:text-primary transition-colors rounded"
              title="Ver detalhes da rotina"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => deleteTarefa(tarefa.id)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
              title="Excluir rotina"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tags de Categoria & Periodicidade */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tarefa.categoria && (
            <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {tarefa.categoria}
            </span>
          )}
          {tarefa.periodicidade && (
            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <Repeat className="h-2.5 w-2.5" /> {tarefa.periodicidade}
            </span>
          )}
        </div>

        {tarefa.descricao && (
          <p className="text-[11px] text-muted-foreground line-clamp-2">
            {tarefa.descricao}
          </p>
        )}

        {/* progress bar */}
        {checklist.length > 0 && (
          <div
            className="cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
            title="Clique para expandir checklist"
          >
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>{feitos}/{checklist.length} itens ({pct}%)</span>
              <span className="text-[9px] hover:text-primary">
                {expanded ? "recolher" : "ver itens"}
              </span>
            </div>
          </div>
        )}

        {/* checklist expandido */}
        {expanded && checklist.length > 0 && (
          <ul className="space-y-1 border-t pt-2 max-h-32 overflow-y-auto">
            {checklist.map((c, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => toggleChecklistItem(tarefa.id, idx)}
              >
                {c.feito ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                <span
                  className={`text-xs truncate ${c.feito ? "line-through text-muted-foreground" : ""}`}
                >
                  {c.item}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* meta info */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground border-t pt-2">
          {checklist.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {feitos}/{checklist.length}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {tarefa.horasGastas ?? 0}h / {tarefa.horasPrevistas ?? 1}h
          </span>
          {tarefa.prazo && <span>📅 {tarefa.prazo}</span>}
        </div>

        {/* mover coluna */}
        <Button
          size="sm"
          variant="ghost"
          className="w-full h-7 text-[11px] border border-dashed hover:border-primary hover:text-primary"
          onClick={() => onMover(tarefa.id, proxStatus[tarefa.status])}
        >
          <GripVertical className="h-3 w-3 mr-1" />
          {labelProx[tarefa.status]}
        </Button>
      </div>
    </div>
  );
}

function Tarefas() {
  // Submenu ativo: 'diaria' | 'mensal' | 'todas'
  const [submenu, setSubmenu] = useState<SubmenuRotinas>("diaria");
  const [visao, setVisao] = useState<(typeof visoes)[number]>("Checklist");
  const [rotinaSelecionada, setRotinaSelecionada] = useState<Tarefa | null>(null);
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const { tarefas } = useTarefas();

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroCat, setFiltroCat] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todas");
  const [novoItemTexto, setNovoItemTexto] = useState<{ [tarefaId: string]: string }>({});

  const handleMover = (id: string, novoStatus: Tarefa["status"]) => {
    updateTarefa(id, { status: novoStatus });
  };

  const abrirDetalhes = (tarefa: Tarefa) => {
    setRotinaSelecionada(tarefa);
    setDetalhesAberto(true);
  };

  // Contagens para os cards de submenu
  const contagensSubmenu = useMemo(() => {
    const rotinasDiarias = tarefas.filter(
      (t) => t.periodicidade === "Diária" || (!t.periodicidade && t.categoria === "Folha")
    );
    const rotinasMensais = tarefas.filter((t) => t.periodicidade === "Mensal");

    const itensDiariosTotal = rotinasDiarias.reduce(
      (acc, t) => acc + (t.checklist?.length || 0),
      0
    );
    const itensDiariosFeitos = rotinasDiarias.reduce(
      (acc, t) => acc + (t.checklist?.filter((c) => c.feito).length || 0),
      0
    );

    const itensMensaisTotal = rotinasMensais.reduce(
      (acc, t) => acc + (t.checklist?.length || 0),
      0
    );
    const itensMensaisFeitos = rotinasMensais.reduce(
      (acc, t) => acc + (t.checklist?.filter((c) => c.feito).length || 0),
      0
    );

    return {
      diariasQtd: rotinasDiarias.length,
      diariasConcluidas: rotinasDiarias.filter((t) => t.status === "concluida").length,
      diariasPct:
        itensDiariosTotal > 0
          ? Math.round((itensDiariosFeitos / itensDiariosTotal) * 100)
          : rotinasDiarias.length > 0
          ? Math.round(
              (rotinasDiarias.filter((t) => t.status === "concluida").length /
                rotinasDiarias.length) *
                100
            )
          : 0,
      mensaisQtd: rotinasMensais.length,
      mensaisConcluidas: rotinasMensais.filter((t) => t.status === "concluida").length,
      mensaisPct:
        itensMensaisTotal > 0
          ? Math.round((itensMensaisFeitos / itensMensaisTotal) * 100)
          : rotinasMensais.length > 0
          ? Math.round(
              (rotinasMensais.filter((t) => t.status === "concluida").length /
                rotinasMensais.length) *
                100
            )
          : 0,
      totalQtd: tarefas.length,
    };
  }, [tarefas]);

  // Categorias presentes
  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    tarefas.forEach((t) => {
      if (t.categoria) set.add(t.categoria);
    });
    return Array.from(set);
  }, [tarefas]);

  // Filtragem estrita baseada no Submenu selecionado + filtros adicionais
  const tarefasFiltradas = useMemo(() => {
    return tarefas.filter((t) => {
      // Filtro de Submenu
      if (submenu === "diaria") {
        const isDiaria = t.periodicidade === "Diária" || (!t.periodicidade && t.categoria === "Folha");
        if (!isDiaria) return false;
      } else if (submenu === "mensal") {
        const isMensal = t.periodicidade === "Mensal";
        if (!isMensal) return false;
      }

      // Filtro de Busca
      const matchBusca =
        !busca ||
        t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        (t.descricao && t.descricao.toLowerCase().includes(busca.toLowerCase())) ||
        (t.responsavel && t.responsavel.toLowerCase().includes(busca.toLowerCase()));

      // Filtro de Categoria
      const matchCat =
        filtroCat === "todas" || t.categoria?.toLowerCase() === filtroCat.toLowerCase();

      // Filtro de Status
      const matchStatus =
        filtroStatus === "todas" ||
        (filtroStatus === "pendente" && t.status !== "concluida") ||
        (filtroStatus === "concluida" && t.status === "concluida");

      return matchBusca && matchCat && matchStatus;
    });
  }, [tarefas, submenu, busca, filtroCat, filtroStatus]);

  // Cálculos de progresso da visualização atual
  const totaisVisualizacao = useMemo(() => {
    let totalItens = 0;
    let itensFeitos = 0;
    let tarefasConcluidas = 0;

    tarefasFiltradas.forEach((t) => {
      const lista = t.checklist || [];
      totalItens += lista.length;
      itensFeitos += lista.filter((c) => c.feito).length;
      if (t.status === "concluida" || (lista.length > 0 && lista.every((c) => c.feito))) {
        tarefasConcluidas++;
      }
    });

    const pctGeral =
      totalItens > 0
        ? Math.round((itensFeitos / totalItens) * 100)
        : tarefasFiltradas.length > 0
        ? Math.round((tarefasConcluidas / tarefasFiltradas.length) * 100)
        : 0;

    return {
      totalTarefas: tarefasFiltradas.length,
      tarefasConcluidas,
      totalItens,
      itensFeitos,
      itensPendentes: totalItens - itensFeitos,
      pctGeral,
    };
  }, [tarefasFiltradas]);

  const handleAdicionarItemChecklist = (tarefaId: string) => {
    const texto = (novoItemTexto[tarefaId] || "").trim();
    if (!texto) return;

    const t = tarefas.find((item) => item.id === tarefaId);
    if (!t) return;

    const checklistAtual = t.checklist || [];
    const novoChecklist = [
      ...checklistAtual,
      { item: texto, feito: false, obrigatorio: false },
    ];

    updateTarefa(tarefaId, { checklist: novoChecklist });
    setNovoItemTexto((prev) => ({ ...prev, [tarefaId]: "" }));
  };

  const handleMarcarTodosItens = (tarefa: Tarefa, feito: boolean) => {
    const checklistAtual = tarefa.checklist || [];
    if (checklistAtual.length === 0) return;

    const novoChecklist = checklistAtual.map((c) => ({ ...c, feito }));
    updateTarefa(tarefa.id, {
      checklist: novoChecklist,
      status: feito ? "concluida" : "fazendo",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          submenu === "diaria"
            ? "Rotinas Diárias"
            : submenu === "mensal"
            ? "Rotinas Mensais"
            : "Todas as Rotinas"
        }
        description={
          submenu === "diaria"
            ? "Acompanhamento exclusivo das rotinas e checklists executados diariamente pelo DP"
            : submenu === "mensal"
            ? "Acompanhamento exclusivo das rotinas e fechamentos executados mensalmente pelo DP"
            : "Visão consolidada de todas as rotinas diárias, mensais e periódicas do setor"
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border p-1 bg-background">
              {visoes.map((v) => (
                <button
                  key={v}
                  onClick={() => setVisao(v)}
                  className={
                    visao === v
                      ? "rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-xs"
                      : "rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  }
                >
                  {v}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadModeloXLSX}
              className="gap-1.5 text-xs border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
              title="Baixar planilha modelo de rotinas e checklists (.xlsx)"
            >
              <Download className="h-3.5 w-3.5" />
              Modelo XLSX
            </Button>
            <ImportarRotinasDialog />
            <NovaTarefaDialog
              defaultStatus="backlog"
            />
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* ---- CARDS DE SUBMENU: DIÁRIA / MENSAL / TODAS ---- */}
      {/* ========================================================================= */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Card Submenu: Diária */}
        <button
          type="button"
          onClick={() => setSubmenu("diaria")}
          className={`surface-panel relative flex flex-col justify-between p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            submenu === "diaria"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
              : "border-border hover:border-primary/40 hover:bg-muted/30"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  submenu === "diaria"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <Sun className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Rotinas Diárias</h3>
                <p className="text-[11px] text-muted-foreground">
                  Checklist e tarefas do dia a dia
                </p>
              </div>
            </div>
            {submenu === "diaria" && (
              <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 border border-primary/20">
                Ativo
              </span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t flex items-end justify-between">
            <div>
              <span className="text-2xl font-black tabular-nums text-foreground">
                {contagensSubmenu.diariasQtd}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">rotinas</span>
            </div>
            <div className="text-right">
              <span
                className={`text-sm font-bold tabular-nums ${
                  contagensSubmenu.diariasPct === 100
                    ? "text-emerald-600"
                    : contagensSubmenu.diariasPct >= 50
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {contagensSubmenu.diariasPct}%
              </span>
              <p className="text-[10px] text-muted-foreground">concluído</p>
            </div>
          </div>
        </button>

        {/* Card Submenu: Mensal */}
        <button
          type="button"
          onClick={() => setSubmenu("mensal")}
          className={`surface-panel relative flex flex-col justify-between p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            submenu === "mensal"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
              : "border-border hover:border-primary/40 hover:bg-muted/30"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  submenu === "mensal"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <CalendarDays className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Rotinas Mensais</h3>
                <p className="text-[11px] text-muted-foreground">
                  Fechamentos e obrigações do mês
                </p>
              </div>
            </div>
            {submenu === "mensal" && (
              <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 border border-primary/20">
                Ativo
              </span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t flex items-end justify-between">
            <div>
              <span className="text-2xl font-black tabular-nums text-foreground">
                {contagensSubmenu.mensaisQtd}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">rotinas</span>
            </div>
            <div className="text-right">
              <span
                className={`text-sm font-bold tabular-nums ${
                  contagensSubmenu.mensaisPct === 100
                    ? "text-emerald-600"
                    : contagensSubmenu.mensaisPct >= 50
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {contagensSubmenu.mensaisPct}%
              </span>
              <p className="text-[10px] text-muted-foreground">concluído</p>
            </div>
          </div>
        </button>

        {/* Card Submenu: Todas as Rotinas */}
        <button
          type="button"
          onClick={() => setSubmenu("todas")}
          className={`surface-panel relative flex flex-col justify-between p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            submenu === "todas"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
              : "border-border hover:border-primary/40 hover:bg-muted/30"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  submenu === "todas"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <Layers className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Todas as Rotinas</h3>
                <p className="text-[11px] text-muted-foreground">
                  Visão consolidada do setor
                </p>
              </div>
            </div>
            {submenu === "todas" && (
              <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 border border-primary/20">
                Ativo
              </span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t flex items-end justify-between">
            <div>
              <span className="text-2xl font-black tabular-nums text-foreground">
                {contagensSubmenu.totalQtd}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">rotinas no total</span>
            </div>
            <div className="text-right flex items-center gap-1 text-xs font-semibold text-primary">
              <span>Explorar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ---- BARRA DE FILTROS & BUSCA ---- */}
      {/* ========================================================================= */}
      <div className="surface-panel flex flex-wrap items-center gap-3 p-3 text-xs">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Buscar em rotinas ${submenu === "diaria" ? "diárias" : submenu === "mensal" ? "mensais" : "gerais"}...`}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {categoriasDisponiveis.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground">Categoria:</span>
            <select
              value={filtroCat}
              onChange={(e) => setFiltroCat(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="todas">Todas as categorias</option>
              {categoriasDisponiveis.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="font-semibold text-muted-foreground">Status:</span>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            <option value="todas">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="concluida">Concluídas</option>
          </select>
        </div>

        <div className="ml-auto text-xs font-semibold text-muted-foreground">
          {tarefasFiltradas.length} rotina(s) exibida(s)
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ---- VISAO 1: CHECKLIST INTERATIVO ---- */}
      {/* ========================================================================= */}
      {visao === "Checklist" && (
        <div className="space-y-4">
          {/* Card de Progresso do Submenu */}
          <div className="surface-panel rounded-2xl border bg-gradient-to-r from-card via-card to-primary/5 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ListChecks className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Checklist de Rotinas {submenu === "diaria" ? "Diárias" : submenu === "mensal" ? "Mensais" : "Consolidadas"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Marque as etapas executadas diretamente nos checkboxes abaixo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="rounded-lg border bg-background px-3 py-1 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Tarefas</p>
                  <p className="font-bold tabular-nums text-foreground">{totaisVisualizacao.totalTarefas}</p>
                </div>
                <div className="rounded-lg border bg-background px-3 py-1 text-center">
                  <p className="text-[10px] text-success uppercase font-bold">Feitos</p>
                  <p className="font-bold tabular-nums text-success">{totaisVisualizacao.itensFeitos}</p>
                </div>
                <div className="rounded-lg border bg-background px-3 py-1 text-center">
                  <p className="text-[10px] text-amber-600 uppercase font-bold">Pendentes</p>
                  <p className="font-bold tabular-nums text-amber-600">{totaisVisualizacao.itensPendentes}</p>
                </div>
                <div className="rounded-lg bg-primary/10 px-3.5 py-1 text-center">
                  <p className="text-[10px] text-primary uppercase font-bold">Conclusão</p>
                  <p className="font-black tabular-nums text-primary text-base">{totaisVisualizacao.pctGeral}%</p>
                </div>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                  style={{ width: `${totaisVisualizacao.pctGeral}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grid de Tarefas com Checklist Marcável */}
          {tarefasFiltradas.length === 0 ? (
            <div className="surface-panel flex flex-col items-center justify-center p-12 text-center gap-3">
              <ListChecks className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">
                Nenhuma rotina {submenu === "diaria" ? "diária" : submenu === "mensal" ? "mensal" : ""} encontrada com os filtros atuais.
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Cadastre uma nova rotina ou importe sua lista a partir de um arquivo Excel (.xlsx).
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadModeloXLSX}
                  className="gap-1.5 text-xs"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar Modelo XLSX
                </Button>
                <ImportarRotinasDialog />
                <NovaTarefaDialog />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tarefasFiltradas.map((tarefa) => {
                const checklist = tarefa.checklist || [];
                const feitos = checklist.filter((c) => c.feito).length;
                const total = checklist.length;
                const pct = total > 0 ? Math.round((feitos / total) * 100) : tarefa.status === "concluida" ? 100 : 0;
                const isConcluida = tarefa.status === "concluida" || (total > 0 && feitos === total);

                return (
                  <div
                    key={tarefa.id}
                    className={`surface-panel rounded-xl border flex flex-col justify-between transition-all ${
                      isConcluida
                        ? "border-emerald-500/30 bg-emerald-500/5 shadow-2xs"
                        : "hover:border-primary/40 shadow-xs"
                    }`}
                  >
                    {/* Topo do Card */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3
                            className={`text-sm font-bold leading-tight cursor-pointer hover:text-primary transition-colors ${
                              isConcluida ? "line-through text-muted-foreground" : "text-foreground"
                            }`}
                            onClick={() => abrirDetalhes(tarefa)}
                          >
                            {tarefa.titulo}
                          </h3>
                          {tarefa.descricao && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {tarefa.descricao}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <StatusBadge status={tarefa.prioridade} />
                          <button
                            onClick={() => deleteTarefa(tarefa.id)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                            title="Excluir tarefa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Badges de Meta */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {tarefa.periodicidade && (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-bold text-primary">
                            <Repeat className="h-3 w-3" /> {tarefa.periodicidade}
                          </span>
                        )}
                        {tarefa.categoria && (
                          <span className="rounded bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                            {tarefa.categoria}
                          </span>
                        )}
                        {tarefa.responsavel && (
                          <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-0.5 text-muted-foreground">
                            <User className="h-3 w-3" /> {tarefa.responsavel}
                          </span>
                        )}
                        {tarefa.prazo && (
                          <span className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            📅 {tarefa.prazo}
                          </span>
                        )}
                      </div>

                      {/* Barra de Progresso da Tarefa */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {total > 0
                              ? `${feitos} de ${total} etapas concluídas`
                              : isConcluida
                              ? "Tarefa Concluída"
                              : "Sem checklist"}
                          </span>
                          <span
                            className={`font-bold tabular-nums text-xs ${
                              pct === 100
                                ? "text-emerald-600"
                                : pct >= 50
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/70">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              pct === 100 ? "bg-emerald-500" : "bg-primary"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Lista de Checklist Marcável */}
                      <div className="border-t pt-2.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Checklist da Rotina
                          </span>
                          {total > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMarcarTodosItens(tarefa, feitos < total)}
                              className="text-[10px] font-semibold text-primary hover:underline"
                            >
                              {feitos < total ? "Marcar todos" : "Desmarcar todos"}
                            </button>
                          )}
                        </div>

                        {checklist.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic py-1">
                            Nenhuma etapa cadastrada no checklist.
                          </p>
                        ) : (
                          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {checklist.map((item, idx) => (
                              <li
                                key={idx}
                                onClick={() => toggleChecklistItem(tarefa.id, idx)}
                                className={`flex items-start gap-2.5 rounded-lg border p-2 text-xs transition-colors cursor-pointer select-none ${
                                  item.feito
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-muted-foreground"
                                    : "bg-background hover:bg-muted/40 border-border text-foreground font-medium"
                                }`}
                              >
                                <span className="mt-0.5 shrink-0">
                                  {item.feito ? (
                                    <CheckSquare className="h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <Square className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                  )}
                                </span>
                                <span
                                  className={`flex-1 leading-snug ${
                                    item.feito ? "line-through text-muted-foreground font-normal" : ""
                                  }`}
                                >
                                  {item.item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Adicionar novo item rápido ao checklist */}
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <Input
                            placeholder="Adicionar etapa..."
                            value={novoItemTexto[tarefa.id] || ""}
                            onChange={(e) =>
                              setNovoItemTexto((prev) => ({
                                ...prev,
                                [tarefa.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAdicionarItemChecklist(tarefa.id);
                              }
                            }}
                            className="h-7 text-xs"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAdicionarItemChecklist(tarefa.id)}
                            className="h-7 px-2.5 text-xs font-semibold"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Rodapé do Card */}
                    <div className="border-t bg-muted/20 p-3 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant={isConcluida ? "outline" : "default"}
                        className={`h-7 text-xs font-semibold gap-1.5 ${
                          isConcluida
                            ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                        onClick={() => {
                          const novoStatus = isConcluida ? "fazendo" : "concluida";
                          updateTarefa(tarefa.id, { status: novoStatus });
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isConcluida ? "Concluída" : "Finalizar Rotina"}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirDetalhes(tarefa)}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---- VISAO 2: KANBAN ---- */}
      {/* ========================================================================= */}
      {visao === "Kanban" && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {colunas.map((col) => {
            const cards = tarefasFiltradas.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="surface-panel flex flex-col gap-3 p-3 min-h-[200px]"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wide">
                    {col.nome}
                  </h2>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {cards.length}
                    </span>
                    <NovaTarefaDialog
                      defaultStatus={col.id}
                      trigger={
                        <button
                          className="rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title={`Nova rotina em ${col.nome}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      }
                    />
                  </div>
                </div>

                {cards.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-6 text-center">
                    <p className="text-[11px] text-muted-foreground">
                      Nenhuma rotina aqui
                    </p>
                    <NovaTarefaDialog
                      defaultStatus={col.id}
                      trigger={
                        <button className="text-[11px] text-primary hover:underline">
                          + Adicionar
                        </button>
                      }
                    />
                  </div>
                )}

                {cards.map((t) => (
                  <TarefaCard
                    key={t.id}
                    tarefa={t}
                    onMover={handleMover}
                    onAbrirDetalhes={abrirDetalhes}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---- VISAO 3: LISTA ---- */}
      {/* ========================================================================= */}
      {visao === "Lista" && (
        <div className="surface-panel overflow-x-auto shadow-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <p className="text-xs text-muted-foreground font-medium">
              {tarefasFiltradas.length} rotina(s) {submenu === "diaria" ? "diárias" : submenu === "mensal" ? "mensais" : ""} cadastrada(s)
            </p>
            <div className="flex items-center gap-2">
              <ImportarRotinasDialog />
              <NovaTarefaDialog />
            </div>
          </div>
          {tarefasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
              <p className="text-sm text-muted-foreground">
                Nenhuma rotina cadastrada neste filtro.
              </p>
              <div className="flex items-center gap-2">
                <ImportarRotinasDialog />
                <NovaTarefaDialog />
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground bg-muted/20">
                  <th className="p-3 font-medium">Rotina</th>
                  <th className="p-3 font-medium">Periodicidade</th>
                  <th className="p-3 font-medium">Categoria</th>
                  <th className="p-3 font-medium">Data-base / Prazo</th>
                  <th className="p-3 font-medium">Checklist</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Prioridade</th>
                  <th className="p-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {tarefasFiltradas.map((t) => {
                  const check = t.checklist || [];
                  const feitos = check.filter((c) => c.feito).length;
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => abrirDetalhes(t)}
                    >
                      <td className="p-3 font-medium max-w-[240px]">
                        <div className="truncate font-semibold">{t.titulo}</div>
                        {t.descricao && (
                          <p className="text-xs text-muted-foreground truncate font-normal">
                            {t.descricao}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        {t.periodicidade ? (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            <Repeat className="h-3 w-3" /> {t.periodicidade}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Pontual</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <span className="rounded-full border px-2 py-0.5 text-xs">
                          {t.categoria ?? "Folha"}
                        </span>
                      </td>
                      <td className="p-3 tabular-nums font-mono text-xs">{t.prazo}</td>
                      <td className="p-3">
                        {check.length > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                            <CheckSquare className="h-3 w-3 text-primary" /> {feitos}/{check.length}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="rounded-full border px-2 py-0.5 text-[11px] capitalize">
                          {t.status === "fazendo"
                            ? "Em andamento"
                            : t.status === "revisao"
                            ? "Em revisão"
                            : t.status === "concluida"
                            ? "Concluída"
                            : "Backlog"}
                        </span>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={t.prioridade} />
                      </td>
                      <td
                        className="p-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => deleteTarefa(t.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                          title="Excluir rotina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---- VISAO 4: CRONOGRAMA ---- */}
      {/* ========================================================================= */}
      {visao === "Cronograma" && (
        <div className="surface-panel space-y-3 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-medium">
              {tarefasFiltradas.length} rotina(s)
            </p>
            <div className="flex items-center gap-2">
              <ImportarRotinasDialog />
              <NovaTarefaDialog />
            </div>
          </div>
          {tarefasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <p className="text-sm text-muted-foreground">
                Nenhuma rotina cadastrada.
              </p>
              <div className="flex items-center gap-2">
                <ImportarRotinasDialog />
                <NovaTarefaDialog />
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {tarefasFiltradas.map((t) => {
                const checklist = t.checklist ?? [];
                const feitos = checklist.filter((c) => c.feito).length;
                const pct =
                  checklist.length > 0
                    ? Math.round((feitos / checklist.length) * 100)
                    : t.status === "concluida"
                    ? 100
                    : 0;

                return (
                  <div
                    key={t.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between cursor-pointer hover:bg-muted/20 px-2 rounded-lg transition-colors"
                    onClick={() => abrirDetalhes(t)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{t.titulo}</p>
                        {t.periodicidade && (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-medium text-primary">
                            <Repeat className="h-2.5 w-2.5" /> {t.periodicidade}
                          </span>
                        )}
                        <StatusBadge status={t.prioridade} />
                      </div>
                      {t.descricao && (
                        <p className="text-xs text-muted-foreground truncate">{t.descricao}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 sm:w-64">
                      <div className="w-full">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                          <span>Progresso</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhes da Rotina */}
      {rotinaSelecionada && (
        <DetalhesRotinaDialog
          tarefa={rotinaSelecionada}
          open={detalhesAberto}
          onOpenChange={setDetalhesAberto}
        />
      )}
    </div>
  );
}
