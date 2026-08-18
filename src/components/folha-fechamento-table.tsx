import { useMemo, useState } from "react";
import {
  Check,
  Minus,
  Search,
  Slash,
  Briefcase,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  ChevronRight,
  Building2,
  BarChart2,
  Loader2,
  CloudCheck,
} from "lucide-react";

import {
  competencias,
  etapaStatusMeta,
  etapaStatusOrder,
  etapasChecklist,
  progressoTarefa,
  statusFolhaMeta,
  statusFolhaOrder,
  tiposPonto,
  type EtapaStatus,
  type FolhaTarefa,
  type StatusFolha,
} from "@/lib/folha-fechamento";
import {
  chaveFolha,
  etapasVazias,
  registroParaTarefa,
  useFolhaCompetencia,
  type RegistroFolha,
} from "@/lib/folha-db";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useEmpresas } from "@/lib/empresas-store";
import { useCadastros } from "@/lib/cadastros-store";
import {
  carteiraDaEmpresa,
  listarNomesCarteiras,
  pertenceACarteira,
} from "@/lib/carteiras-core";

// ─── Ícone do status da etapa ────────────────────────────────────────────
const etapaIcon: Record<EtapaStatus, typeof Check | null> = {
  pendente: null,
  andamento: Minus,
  concluido: Check,
  na: Slash,
};

// ─── Célula de etapa (checkbox ciclável) ─────────────────────────────────
function EtapaCell({ value, onChange }: { value: EtapaStatus; onChange: (v: EtapaStatus) => void }) {
  const meta = etapaStatusMeta[value];
  const Icon = etapaIcon[value];
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={value === "concluido"}
      title={`${meta.label} — clique para alterar`}
      aria-label={meta.label}
      onClick={() =>
        onChange(etapaStatusOrder[(etapaStatusOrder.indexOf(value) + 1) % etapaStatusOrder.length]!)
      }
      className={cn(
        "mx-auto flex h-6 w-6 items-center justify-center rounded-[5px] border-2 transition-all active:scale-90",
        value === "concluido" && "border-success bg-success/15 text-success",
        value === "andamento" && "border-warning bg-warning/10 text-warning",
        value === "na" && "border-muted-foreground/30 bg-muted text-muted-foreground",
        value === "pendente" && "border-border bg-background text-transparent hover:border-primary/50",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" strokeWidth={3} /> : <Check className="h-4 w-4" strokeWidth={3} />}
    </button>
  );
}

// ─── Painel lateral: situação da empresa ─────────────────────────────────
function SituacaoEmpresaPanel({
  tarefa,
  onClose,
}: {
  tarefa: FolhaTarefa;
  onClose: () => void;
}) {
  const p = progressoTarefa(tarefa);
  const statusMeta = statusFolhaMeta[tarefa.status];

  const StatusIcon = {
    concluida: CheckCircle2,
    conferencia: BarChart2,
    andamento: Clock,
    aguardando: AlertTriangle,
    nao_iniciada: Ban,
  }[tarefa.status];

  const statusColor = {
    concluida: "text-success",
    conferencia: "text-primary",
    andamento: "text-info",
    aguardando: "text-warning",
    nao_iniciada: "text-muted-foreground",
  }[tarefa.status];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-background shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-start justify-between border-b bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cód. {tarefa.codigo} · {tarefa.competencia}
            </p>
            <h2 className="text-base font-bold leading-tight text-foreground">{tarefa.empresa}</h2>
            <p className="text-xs text-muted-foreground">{tarefa.carteira} · {tarefa.responsavel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Status geral */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("flex items-center gap-2 font-semibold text-sm", statusColor)}>
            <StatusIcon className="h-4 w-4" />
            {statusMeta.label}
          </div>
          <span className="text-xs font-bold tabular-nums text-foreground">
            {p.pct}% concluído
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              p.pct === 100 ? "bg-success" : p.pct >= 70 ? "bg-primary" : p.pct >= 40 ? "bg-warning" : "bg-destructive",
            )}
            style={{ width: `${p.pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {p.feitas} de {p.total} etapas concluídas
        </p>
      </div>

      {/* Etapas detalhadas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Situação das Obrigações
        </p>
        {etapasChecklist.map((etapa) => {
          const status = tarefa.etapas[etapa.key];
          const meta = etapaStatusMeta[status];
          const Icon = etapaIcon[status];

          return (
            <div
              key={etapa.key}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3 transition-colors",
                status === "concluido" && "border-success/30 bg-success/5",
                status === "andamento" && "border-warning/30 bg-warning/5",
                status === "na" && "border-border bg-muted/30",
                status === "pendente" && "border-border bg-background",
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-2",
                    status === "concluido" && "border-success bg-success/15 text-success",
                    status === "andamento" && "border-warning bg-warning/10 text-warning",
                    status === "na" && "border-muted-foreground/30 bg-muted text-muted-foreground",
                    status === "pendente" && "border-border bg-background text-transparent",
                  )}
                >
                  {Icon ? <Icon className="h-3 w-3" strokeWidth={3} /> : <Check className="h-3 w-3" strokeWidth={3} />}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{etapa.label}</p>
                  {etapa.obrigatorio && (
                    <span className="text-[10px] text-destructive font-medium">Obrigatório</span>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  status === "concluido" && "text-success border-success/30 bg-success/10",
                  status === "andamento" && "text-warning border-warning/30 bg-warning/10",
                  status === "na" && "text-muted-foreground border-border bg-muted",
                  status === "pendente" && "text-muted-foreground border-border bg-background",
                )}
              >
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Rodapé */}
      <div className="border-t bg-muted/20 p-4 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Tipo de Ponto</span>
          <span className="font-medium">{tarefa.tipoPonto || "—"}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Empregados</span>
          <span className="font-medium tabular-nums">{tarefa.empregados}</span>
        </div>
        {tarefa.aprendizes > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Aprendizes</span>
            <span className="font-medium tabular-nums">{tarefa.aprendizes}</span>
          </div>
        )}
        {tarefa.dataPublicacao && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Publicação</span>
            <span className="font-medium tabular-nums">{tarefa.dataPublicacao}</span>
          </div>
        )}
        {tarefa.observacoes && (
          <div className="mt-2 rounded-md border bg-background p-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Observações</p>
            <p className="text-xs text-foreground">{tarefa.observacoes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tabela principal ───────────────────────────────────────────────────
export function FolhaFechamentoTable() {
  const { empresas } = useEmpresas();
  const { carteiras } = useCadastros();

  const [competencia, setCompetencia] = useState(competencias[1]!);
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>("todas");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | StatusFolha>("todos");
  const [responsavel, setResponsavel] = useState("todos");
  const [busca, setBusca] = useState("");
  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState<string | null>(null);

  const { registros, carregando, estado, erro, pendentes, setEtapa, setMeta } =
    useFolhaCompetencia(competencia);

  // Protege dados: aguarda a gravação antes de trocar de competência/carteira.
  const trocarCompetencia = (valor: string) => {
    if (pendentes > 0) return;
    setCompetencia(valor);
  };

  // Linhas da competência: empresas ativas + andamento salvo no banco
  const daCompetencia: RegistroFolha[] = useMemo(() => {
    return empresas.map((emp) => {
      const chave = chaveFolha(emp.id, competencia);
      const salvo = registros.get(chave);
      return {
        empresaId: emp.id,
        codigoDominio: emp.codigoDominio || emp.id,
        empresaNome: emp.nome,
        competencia,
        carteira: carteiraDaEmpresa(emp),
        responsavel: emp.analista || emp.responsavel || "Não atribuído",
        status: salvo?.status ?? "nao_iniciada",
        tipoPonto: salvo?.tipoPonto ?? "—",
        aprendizes: salvo?.aprendizes ?? 0,
        empregados: salvo?.empregados ?? emp.funcionarios ?? 0,
        dataPublicacao: salvo?.dataPublicacao ?? "",
        observacoes: salvo?.observacoes ?? "",
        etapas: salvo?.etapas ?? etapasVazias(),
      } satisfies RegistroFolha;
    });
  }, [empresas, competencia, registros]);

  const carteirasDisponiveis = useMemo(
    () => listarNomesCarteiras(empresas, carteiras),
    [carteiras, empresas],
  );

  const filtradas = daCompetencia.filter((t) => {
    if (!pertenceACarteira(t.carteira, carteiraFiltro)) return false;
    if (statusFiltro !== "todos" && t.status !== statusFiltro) return false;
    if (responsavel !== "todos" && t.responsavel !== responsavel) return false;

    const q = busca.trim().toLowerCase();
    if (q) {
      const cod = String(t.codigoDominio ?? "").toLowerCase();
      const emp = String(t.empresaNome ?? "").toLowerCase();
      const resp = String(t.responsavel ?? "").toLowerCase();
      if (!cod.includes(q) && !emp.includes(q) && !resp.includes(q)) return false;
    }
    return true;
  });

  // Cards de status — calculados a partir do que está salvo no banco
  const resumo = statusFolhaOrder.map((s) => ({
    status: s,
    total: daCompetencia.filter(
      (t) => pertenceACarteira(t.carteira, carteiraFiltro) && t.status === s,
    ).length,
  }));

  const selecionada = empresaSelecionadaId
    ? daCompetencia.find((t) => t.empresaId === empresaSelecionadaId)
    : undefined;

  const feedback =
    estado === "salvando" || pendentes > 0
      ? { label: "Salvando...", className: "text-warning border-warning/40 bg-warning/10" }
      : estado === "erro"
        ? { label: erro ? `Erro ao salvar: ${erro}` : "Erro ao salvar", className: "text-destructive border-destructive/40 bg-destructive/10" }
        : estado === "salvo"
          ? { label: "Salvo", className: "text-success border-success/40 bg-success/10" }
          : null;

  return (
    <>
      {/* Overlay + painel lateral da empresa */}
      {selecionada && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setEmpresaSelecionadaId(null)}
          />
          <SituacaoEmpresaPanel
            tarefa={registroParaTarefa(selecionada)}
            onClose={() => setEmpresaSelecionadaId(null)}
          />
        </>
      )}

      <div className="space-y-4">
        {/* Abas por Carteira */}
        <div className="surface-panel p-2.5">
          <div className="flex items-center gap-2 mb-2 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <Briefcase className="h-3.5 w-3.5 text-primary" />
            <span>Filtrar e Separar por Carteira</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCarteiraFiltro("todas")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                carteiraFiltro === "todas"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              Todas as Carteiras ({daCompetencia.length})
            </button>
            {carteirasDisponiveis.map((cart) => {
              const qtd = daCompetencia.filter((t) => pertenceACarteira(t.carteira, cart)).length;
              return (
                <button
                  key={cart}
                  type="button"
                  onClick={() => setCarteiraFiltro(cart)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs transition-all",
                    carteiraFiltro === cart
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {cart} ({qtd})
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards de resumo de status — calculados sobre os dados salvos */}
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {resumo.map((r) => (
            <button
              key={r.status}
              onClick={() => setStatusFiltro(statusFiltro === r.status ? "todos" : r.status)}
              className={cn(
                "surface-panel p-3 text-left transition-colors hover:border-primary/40",
                statusFiltro === r.status && "border-primary",
              )}
            >
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {statusFolhaMeta[r.status]?.label ?? r.status}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{r.total}</p>
            </button>
          ))}
        </div>

        {/* Barra de filtros */}
        <div className="surface-panel flex flex-wrap items-center gap-2 p-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por código ou empresa"
              className="pl-8"
            />
          </div>
          <select
            value={carteiraFiltro}
            onChange={(e) => setCarteiraFiltro(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm font-medium"
          >
            <option value="todas">Todas as Carteiras</option>
            {carteirasDisponiveis.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={competencia}
            onChange={(e) => trocarCompetencia(e.target.value)}
            disabled={pendentes > 0}
            title={pendentes > 0 ? "Aguarde a gravação das alterações" : undefined}
            className="h-9 rounded-md border bg-background px-2 text-sm disabled:opacity-60"
          >
            {competencias.map((c) => (
              <option key={c} value={c}>
                Competência {c}
              </option>
            ))}
          </select>
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value as "todos" | StatusFolha)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="todos">Todos os status</option>
            {statusFolhaOrder.map((s) => (
              <option key={s} value={s}>
                {statusFolhaMeta[s]?.label ?? s}
              </option>
            ))}
          </select>

          {/* Feedback discreto do salvamento automático */}
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold",
              feedback?.className ?? "text-muted-foreground border-border bg-muted/40",
            )}
          >
            {estado === "salvando" || pendentes > 0 ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : estado === "erro" ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <CloudCheck className="h-3.5 w-3.5" />
            )}
            {feedback?.label ?? (carregando ? "Carregando andamento..." : "Salvamento automático")}
          </span>
        </div>

        {/* Tabela principal */}
        <div className="surface-panel overflow-x-auto">
          <table className="w-full min-w-[1400px] text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="p-2 font-medium">Cód.</th>
                <th className="p-2 font-medium">
                  Empresa
                  <span className="ml-1 text-[9px] font-normal normal-case text-muted-foreground/70">
                    (clique para ver situação)
                  </span>
                </th>

                {etapasChecklist.map((e) => (
                  <th key={e.key} className="p-2 text-center font-medium">
                    <span className="block max-w-16 leading-tight">{e.label}</span>
                  </th>
                ))}
                <th className="p-2 text-center font-medium">Tipo de Ponto</th>
                <th className="p-2 text-center font-medium">Qtd. Aprendiz</th>
                <th className="p-2 text-center font-medium">Qtd. Empregados</th>
                <th className="p-2 font-medium">Progresso</th>
                <th className="p-2 font-medium">Data da Publicação</th>
                <th className="p-2 font-medium">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((t) => {
                const p = progressoTarefa(registroParaTarefa(t));

                return (
                  <tr
                    key={`${t.empresaId}-${t.competencia}`}
                    className="border-b last:border-0 align-middle hover:bg-muted/40 group"
                  >
                    <td className="p-2 font-semibold tabular-nums text-muted-foreground">
                      {t.codigoDominio}
                    </td>

                    {/* Nome da empresa — clicável */}
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => setEmpresaSelecionadaId(t.empresaId)}
                        className="flex items-center gap-1 font-medium text-left text-foreground hover:text-primary transition-colors group/btn"
                        title="Ver situação das obrigações"
                      >
                        <span className="underline-offset-2 group-hover/btn:underline">
                          {t.empresaNome}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      </button>
                    </td>

                    {/* Checkboxes das etapas — salvos no banco por empresa + competência */}
                    {etapasChecklist.map((e) => (
                      <td key={e.key} className="p-2">
                        <EtapaCell
                          value={t.etapas[e.key]}
                          onChange={(v) => setEtapa(t, e.key, v)}
                        />
                      </td>
                    ))}

                    <td className="p-2 text-center">
                      <select
                        value={t.tipoPonto}
                        onChange={(ev) => setMeta(t, { tipoPonto: ev.target.value })}
                        className="h-7 rounded-md border bg-background px-1 text-xs"
                      >
                        {tiposPonto.map((tp) => (
                          <option key={tp} value={tp}>
                            {tp}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={t.aprendizes}
                        onChange={(ev) => setMeta(t, { aprendizes: Number(ev.target.value) })}
                        className="h-7 w-14 rounded-md border bg-background px-1 text-center text-xs tabular-nums"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={t.empregados}
                        onChange={(ev) => setMeta(t, { empregados: Number(ev.target.value) })}
                        className="h-7 w-16 rounded-md border bg-background px-1 text-center text-xs tabular-nums"
                      />
                    </td>
                    <td className="p-2">
                      <div className="w-28">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              p.pct === 100 ? "bg-success" : p.pct >= 50 ? "bg-warning" : "bg-destructive",
                            )}
                            style={{ width: `${p.pct}%` }}
                          />
                        </div>
                        <p className="mt-1 whitespace-nowrap text-[10px] text-muted-foreground">
                          {p.feitas} de {p.total} etapas — {p.pct}%
                        </p>
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap text-xs">
                      <input
                        type="text"
                        value={t.dataPublicacao}
                        placeholder="DD/MM/AAAA"
                        onChange={(ev) => setMeta(t, { dataPublicacao: ev.target.value })}
                        className="h-7 w-24 rounded-md border bg-background px-1.5 text-center text-xs tabular-nums transition-colors hover:border-primary focus:border-primary focus:outline-none"
                        title="Clique para editar a Data da Publicação"
                      />
                    </td>
                    <td className="p-2">
                      <Dialog>
                        <DialogTrigger className="rounded-md border px-2 py-1 text-[11px] hover:bg-muted">
                          {t.observacoes ? "Ver" : "Add"}
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {t.codigoDominio} — {t.empresaNome} · {t.competencia}
                            </DialogTitle>
                          </DialogHeader>
                          <Textarea
                            value={t.observacoes}
                            onChange={(ev) => setMeta(t, { observacoes: ev.target.value })}
                            placeholder="Observações da competência"
                            rows={5}
                          />
                          <p className="text-xs text-muted-foreground">
                            Carteira: {t.carteira || "Geral"} · Responsável: {t.responsavel} · Progresso:{" "}
                            {p.feitas}/{p.total} ({p.pct}%)
                          </p>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={19} className="p-6 text-center text-sm text-muted-foreground">
                    {carregando
                      ? "Carregando andamento da competência..."
                      : "Nenhuma folha encontrada para os filtros selecionados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
          {etapaStatusOrder.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <EtapaCell value={s} onChange={() => {}} />
              {etapaStatusMeta[s].label}
            </span>
          ))}
          <span>
            Cada marcação é salva no banco por empresa e competência · o status e os cards são
            recalculados automaticamente.
          </span>
        </div>
      </div>
    </>
  );
}

