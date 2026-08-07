import { useMemo, useState } from "react";
import { Check, Minus, Search, Slash } from "lucide-react";

import {
  competencias,
  etapaStatusMeta,
  etapaStatusOrder,
  etapasChecklist,
  folhaTarefasSeed,
  obrigatoriasOk,
  progressoTarefa,
  statusFolhaMeta,
  statusFolhaOrder,
  tiposPonto,
  type EtapaKey,
  type EtapaStatus,
  type FolhaTarefa,
  type StatusFolha,
} from "@/lib/folha-fechamento";
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

const etapaIcon: Record<EtapaStatus, typeof Check | null> = {
  pendente: null,
  andamento: Minus,
  concluido: Check,
  na: Slash,
};

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
        "mx-auto flex h-6 w-6 items-center justify-center rounded-[5px] border-2 transition-colors",
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

export function FolhaFechamentoTable() {
  const [tarefas, setTarefas] = useState<FolhaTarefa[]>(folhaTarefasSeed);
  const [competencia, setCompetencia] = useState(competencias[1]!);
  const [statusFiltro, setStatusFiltro] = useState<"todos" | StatusFolha>("todos");
  const [responsavel, setResponsavel] = useState("todos");
  const [busca, setBusca] = useState("");

  const update = (id: string, patch: Partial<FolhaTarefa>) =>
    setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const setEtapa = (t: FolhaTarefa, key: EtapaKey, v: EtapaStatus) =>
    update(t.id, { etapas: { ...t.etapas, [key]: v } });

  const daCompetencia = tarefas.filter((t) => t.competencia === competencia);
  const responsaveis = useMemo(
    () => Array.from(new Set(tarefas.map((t) => t.responsavel))).sort(),
    [tarefas],
  );

  const filtradas = daCompetencia.filter((t) => {
    if (statusFiltro !== "todos" && t.status !== statusFiltro) return false;
    if (responsavel !== "todos" && t.responsavel !== responsavel) return false;
    const q = busca.trim().toLowerCase();
    if (q && !t.empresa.toLowerCase().includes(q) && !t.codigo.includes(q)) return false;
    return true;
  });

  const resumo = statusFolhaOrder.map((s) => ({
    status: s,
    total: daCompetencia.filter((t) => t.status === s).length,
  }));

  return (
    <div className="space-y-4">
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
              {statusFolhaMeta[r.status].label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{r.total}</p>
          </button>
        ))}
      </div>

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
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as "todos" | StatusFolha)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="todos">Todos os status</option>
          {statusFolhaOrder.map((s) => (
            <option key={s} value={s}>
              {statusFolhaMeta[s].label}
            </option>
          ))}
        </select>
        <select
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="todos">Todos os responsáveis</option>
          {responsaveis.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="surface-panel overflow-x-auto">
        <table className="w-full min-w-[1400px] text-sm">
          <thead>
            <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="p-2 font-medium">Cód.</th>
              <th className="p-2 font-medium">Empresa</th>
              <th className="p-2 font-medium">Grupo</th>
              {etapasChecklist.map((e) => (
                <th key={e.key} className="p-2 text-center font-medium">
                  <span className="block max-w-16 leading-tight">{e.label}</span>
                </th>
              ))}
              <th className="p-2 text-center font-medium">Tipo de Ponto</th>
              <th className="p-2 text-center font-medium">Qtd. Aprendiz</th>
              <th className="p-2 text-center font-medium">Qtd. Empregados</th>
              <th className="p-2 font-medium">Progresso</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium">Data</th>
              <th className="p-2 font-medium">Obs.</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((t) => {
              const p = progressoTarefa(t);
              const sugerir = obrigatoriasOk(t) && t.status !== "concluida";
              return (
                <tr key={t.id} className="border-b last:border-0 align-middle hover:bg-muted/40">
                  <td className="p-2 font-semibold tabular-nums">{t.codigo}</td>
                  <td className="p-2 font-medium">{t.empresa}</td>
                  <td className="p-2 text-xs text-muted-foreground">{t.grupo}</td>
                  {etapasChecklist.map((e) => (
                    <td key={e.key} className="p-2">
                      <EtapaCell value={t.etapas[e.key]} onChange={(v) => setEtapa(t, e.key, v)} />
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    <select
                      value={t.tipoPonto}
                      onChange={(ev) => update(t.id, { tipoPonto: ev.target.value })}
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
                      onChange={(ev) => update(t.id, { aprendizes: Number(ev.target.value) })}
                      className="h-7 w-14 rounded-md border bg-background px-1 text-center text-xs tabular-nums"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min={0}
                      value={t.empregados}
                      onChange={(ev) => update(t.id, { empregados: Number(ev.target.value) })}
                      className="h-7 w-16 rounded-md border bg-background px-1 text-center text-xs tabular-nums"
                    />
                  </td>
                  <td className="p-2">
                    <div className="w-28">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
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
                  <td className="p-2">
                    <select
                      value={t.status}
                      onChange={(ev) =>
                        update(t.id, {
                          status: ev.target.value as StatusFolha,
                          dataConclusao:
                            ev.target.value === "concluida" && !t.dataConclusao
                              ? new Date().toLocaleDateString("pt-BR")
                              : t.dataConclusao,
                        })
                      }
                      className={cn(
                        "h-7 rounded-full border px-2 text-[11px] font-medium",
                        statusFolhaMeta[t.status].className,
                      )}
                    >
                      {statusFolhaOrder.map((s) => (
                        <option key={s} value={s} className="bg-background text-foreground">
                          {statusFolhaMeta[s].label}
                        </option>
                      ))}
                    </select>
                    {sugerir && (
                      <button
                        onClick={() =>
                          update(t.id, {
                            status: "concluida",
                            dataConclusao: t.dataConclusao || new Date().toLocaleDateString("pt-BR"),
                          })
                        }
                        className="mt-1 block text-[10px] font-medium text-success underline-offset-2 hover:underline"
                      >
                        Marcar como concluída
                      </button>
                    )}
                  </td>
                  <td className="p-2 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                    {t.dataConclusao || "—"}
                  </td>
                  <td className="p-2">
                    <Dialog>
                      <DialogTrigger className="rounded-md border px-2 py-1 text-[11px] hover:bg-muted">
                        {t.observacoes ? "Ver" : "Add"}
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {t.codigo} — {t.empresa} · {t.competencia}
                          </DialogTitle>
                        </DialogHeader>
                        <Textarea
                          value={t.observacoes}
                          onChange={(ev) => update(t.id, { observacoes: ev.target.value })}
                          placeholder="Observações da competência"
                          rows={5}
                        />
                        <p className="text-xs text-muted-foreground">
                          Responsável: {t.responsavel} · Progresso: {p.feitas}/{p.total} ({p.pct}%)
                        </p>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              );
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={20} className="p-6 text-center text-sm text-muted-foreground">
                  Nenhuma folha encontrada para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        {etapaStatusOrder.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", etapaStatusMeta[s].dot)} />
            {etapaStatusMeta[s].label}
          </span>
        ))}
        <span>Clique na marcação para alternar o estado.</span>
      </div>
    </div>
  );
}
