import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { NovaTarefaDialog } from "@/components/nova-tarefa-dialog";
import { ImportarRotinasDialog } from "@/components/importar-rotinas-dialog";
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
      { title: "Gestão de Rotinas — DP Control" },
      {
        name: "description",
        content:
          "Kanban, lista e cronograma das rotinas do DP com periodicidade automática, checklists e importação Excel.",
      },
      { property: "og:title", content: "Gestão de Rotinas — DP Control" },
      {
        property: "og:description",
        content: "Kanban operacional e rotinas do Departamento Pessoal.",
      },
    ],
  }),
  component: Tarefas,
});

const colunas = [
  { id: "backlog" as const, nome: "Backlog" },
  { id: "fazendo" as const, nome: "Em andamento" },
  { id: "revisao" as const, nome: "Em revisão" },
  { id: "concluida" as const, nome: "Concluída" },
];

const visoes = ["Kanban", "Lista", "Cronograma"] as const;

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
  const [visao, setVisao] = useState<(typeof visoes)[number]>("Kanban");
  const [rotinaSelecionada, setRotinaSelecionada] = useState<Tarefa | null>(null);
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const { tarefas } = useTarefas();

  const handleMover = (id: string, novoStatus: Tarefa["status"]) => {
    updateTarefa(id, { status: novoStatus });
  };

  const abrirDetalhes = (tarefa: Tarefa) => {
    setRotinaSelecionada(tarefa);
    setDetalhesAberto(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Rotinas"
        description="Rotinas operacionais compartilhadas, prazos, periodicidade e checklists"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border p-1 bg-background">
              {visoes.map((v) => (
                <button
                  key={v}
                  onClick={() => setVisao(v)}
                  className={
                    visao === v
                      ? "rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                      : "rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  }
                >
                  {v}
                </button>
              ))}
            </div>
            <ImportarRotinasDialog />
            <NovaTarefaDialog />
          </div>
        }
      />

      {/* ---- KANBAN ---- */}
      {visao === "Kanban" && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {colunas.map((col) => {
            const cards = tarefas.filter((t) => t.status === col.id);
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

      {/* ---- LISTA ---- */}
      {visao === "Lista" && (
        <div className="surface-panel overflow-x-auto shadow-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <p className="text-xs text-muted-foreground font-medium">
              {tarefas.length} rotina(s) cadastrada(s)
            </p>
            <div className="flex items-center gap-2">
              <ImportarRotinasDialog />
              <NovaTarefaDialog />
            </div>
          </div>
          {tarefas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
              <p className="text-sm text-muted-foreground">
                Nenhuma rotina cadastrada ainda.
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
                  <th className="p-3 font-medium">Horas</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Prioridade</th>
                  <th className="p-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {tarefas.map((t) => (
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
                    <td className="p-3 tabular-nums text-xs">
                      {t.horasGastas ?? 0}h / {t.horasPrevistas ?? 1}h
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ---- CRONOGRAMA ---- */}
      {visao === "Cronograma" && (
        <div className="surface-panel space-y-3 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-medium">
              {tarefas.length} rotina(s)
            </p>
            <div className="flex items-center gap-2">
              <ImportarRotinasDialog />
              <NovaTarefaDialog />
            </div>
          </div>
          {tarefas.length === 0 ? (
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
            tarefas.map((t) => {
              const inicio = Math.min(90, (t.horasGastas ?? 0) * 8);
              const largura = Math.max(12, ((t.horasPrevistas ?? 1) / 8) * 40);
              return (
                <div
                  key={t.id}
                  onClick={() => abrirDetalhes(t)}
                  className="flex items-center gap-4 hover:bg-muted/20 p-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="w-56 shrink-0 truncate">
                    <span className="text-xs font-medium">{t.titulo}</span>
                    {t.periodicidade && (
                      <span className="ml-1.5 text-[10px] text-primary font-normal">
                        ({t.periodicidade})
                      </span>
                    )}
                  </div>
                  <div className="relative h-6 flex-1 rounded-md bg-muted">
                    <div
                      className={`absolute top-0 h-6 rounded-md ${PRIORIDADE_COR[t.prioridade] ?? "bg-primary/70"}`}
                      style={{ left: `${inicio}px`, width: `${largura}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                    {t.prazo}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal de Detalhes e Edição da Rotina */}
      <DetalhesRotinaDialog
        tarefa={rotinaSelecionada}
        open={detalhesAberto}
        onOpenChange={setDetalhesAberto}
      />
    </div>
  );
}
