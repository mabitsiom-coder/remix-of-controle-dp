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
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { NovaTarefaDialog } from "@/components/nova-tarefa-dialog";
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
      { title: "Gestão de Tarefas — DP Control" },
      {
        name: "description",
        content:
          "Kanban, lista e cronograma das tarefas do DP com checklist obrigatório, prazos e horas.",
      },
      { property: "og:title", content: "Gestão de Tarefas — DP Control" },
      {
        property: "og:description",
        content: "Kanban operacional do Departamento Pessoal.",
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
}: {
  tarefa: Tarefa;
  onMover: (id: string, status: Tarefa["status"]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const feitos = tarefa.checklist.filter((c) => c.feito).length;
  const pct =
    tarefa.checklist.length > 0
      ? Math.round((feitos / tarefa.checklist.length) * 100)
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
    <div className="rounded-xl border bg-background shadow-sm hover:shadow-md transition-shadow">
      {/* barra de prioridade */}
      <div
        className={`h-1 w-full rounded-t-xl ${PRIORIDADE_COR[tarefa.prioridade] ?? "bg-muted"}`}
      />

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm font-medium leading-tight cursor-pointer hover:text-primary"
            onClick={() => setExpanded((v) => !v)}
          >
            {tarefa.titulo}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <StatusBadge status={tarefa.prioridade} />
            <button
              onClick={() => deleteTarefa(tarefa.id)}
              className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
              title="Excluir tarefa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {tarefa.empresa && tarefa.empresa !== "geral" && (
          <p className="text-[11px] text-muted-foreground truncate">{tarefa.empresa}</p>
        )}

        {/* progress bar */}
        {tarefa.checklist.length > 0 && (
          <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {feitos}/{tarefa.checklist.length} itens ({pct}%)
            </p>
          </div>
        )}

        {/* checklist expandido */}
        {expanded && tarefa.checklist.length > 0 && (
          <ul className="space-y-1 border-t pt-2">
            {tarefa.checklist.map((c, idx) => (
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
                  className={`text-xs ${c.feito ? "line-through text-muted-foreground" : ""}`}
                >
                  {c.item}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* meta info */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground border-t pt-2">
          <span className="flex items-center gap-1">
            <Paperclip className="h-3 w-3" />
            {feitos}/{tarefa.checklist.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {tarefa.horasGastas}h / {tarefa.horasPrevistas}h
          </span>
          {tarefa.prazo && <span>📅 {tarefa.prazo}</span>}
          {tarefa.responsavel && (
            <span className="ml-auto font-medium text-foreground truncate max-w-[80px]">
              {tarefa.responsavel.split(" ")[0]}
            </span>
          )}
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
  const { tarefas } = useTarefas();

  const handleMover = (id: string, novoStatus: Tarefa["status"]) => {
    updateTarefa(id, { status: novoStatus });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Tarefas"
        description="Checklists obrigatórios, prazos, horas previstas x gastas e recorrências"
        actions={
          <div className="flex items-center gap-2">
            <NovaTarefaDialog />
            <div className="flex items-center gap-1 rounded-lg border p-1">
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
                          title={`Nova tarefa em ${col.nome}`}
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
                      Nenhuma tarefa aqui
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
                  <TarefaCard key={t.id} tarefa={t} onMover={handleMover} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ---- LISTA ---- */}
      {visao === "Lista" && (
        <div className="surface-panel overflow-x-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <p className="text-xs text-muted-foreground">
              {tarefas.length} tarefa(s)
            </p>
            <NovaTarefaDialog />
          </div>
          {tarefas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa cadastrada ainda.
              </p>
              <NovaTarefaDialog />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3 font-medium">Tarefa</th>
                  <th className="p-3 font-medium">Empresa</th>
                  <th className="p-3 font-medium">Responsável</th>
                  <th className="p-3 font-medium">Depto</th>
                  <th className="p-3 font-medium">Prazo</th>
                  <th className="p-3 font-medium">Horas</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Prioridade</th>
                  <th className="p-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {tarefas.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b last:border-0 hover:bg-muted/40"
                  >
                    <td className="p-3 font-medium max-w-[200px] truncate">
                      {t.titulo}
                    </td>
                    <td className="p-3 text-muted-foreground">{t.empresa}</td>
                    <td className="p-3 text-muted-foreground">{t.responsavel}</td>
                    <td className="p-3 text-muted-foreground">{t.departamento}</td>
                    <td className="p-3 tabular-nums">{t.prazo}</td>
                    <td className="p-3 tabular-nums">
                      {t.horasGastas}h / {t.horasPrevistas}h
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
                    <td className="p-3">
                      <button
                        onClick={() => deleteTarefa(t.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Excluir"
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
        <div className="surface-panel space-y-3 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">
              {tarefas.length} tarefa(s)
            </p>
            <NovaTarefaDialog />
          </div>
          {tarefas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa cadastrada.
              </p>
              <NovaTarefaDialog />
            </div>
          ) : (
            tarefas.map((t) => {
              const inicio = Math.min(90, t.horasGastas * 8);
              const largura = Math.max(12, (t.horasPrevistas / 8) * 40);
              return (
                <div key={t.id} className="flex items-center gap-4">
                  <span className="w-56 shrink-0 truncate text-xs font-medium">
                    {t.titulo}
                  </span>
                  <div className="relative h-6 flex-1 rounded-md bg-muted">
                    <div
                      className={`absolute top-0 h-6 rounded-md ${PRIORIDADE_COR[t.prioridade] ?? "bg-primary/70"}`}
                      style={{ left: `${inicio}px`, width: `${largura}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-[11px] text-muted-foreground">
                    {t.prazo}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
