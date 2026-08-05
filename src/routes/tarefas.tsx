import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Paperclip } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { tarefas } from "@/lib/mock-data";

export const Route = createFileRoute("/tarefas")({
  head: () => ({
    meta: [
      { title: "Gestão de Tarefas — DP Control" },
      {
        name: "description",
        content: "Kanban, lista e cronograma das tarefas do DP com checklist obrigatório, prazos e horas.",
      },
      { property: "og:title", content: "Gestão de Tarefas — DP Control" },
      { property: "og:description", content: "Kanban operacional do Departamento Pessoal." },
    ],
  }),
  component: Tarefas,
});

const colunas = [
  { id: "backlog", nome: "Backlog" },
  { id: "fazendo", nome: "Em andamento" },
  { id: "revisao", nome: "Em revisão" },
  { id: "concluida", nome: "Concluída" },
] as const;

const visoes = ["Kanban", "Lista", "Cronograma"] as const;

function Tarefas() {
  const [visao, setVisao] = useState<(typeof visoes)[number]>("Kanban");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Tarefas"
        description="Checklists obrigatórios, prazos, horas previstas x gastas e recorrências"
        actions={
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
        }
      />

      {visao === "Kanban" && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {colunas.map((col) => (
            <div key={col.id} className="surface-panel flex flex-col gap-3 p-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide">{col.nome}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {tarefas.filter((t) => t.status === col.id).length}
                </span>
              </div>
              {tarefas
                .filter((t) => t.status === col.id)
                .map((t) => {
                  const feitos = t.checklist.filter((c) => c.feito).length;
                  return (
                    <div key={t.id} className="rounded-lg border bg-background p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{t.titulo}</p>
                        <StatusBadge status={t.prioridade} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{t.empresa}</p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(feitos / t.checklist.length) * 100}%` }}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" /> {feitos}/{t.checklist.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {t.horasGastas}h / {t.horasPrevistas}h
                        </span>
                        <span>{t.prazo}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      )}

      {visao === "Lista" && (
        <div className="surface-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="p-3 font-medium">Tarefa</th>
                <th className="p-3 font-medium">Empresa</th>
                <th className="p-3 font-medium">Responsável</th>
                <th className="p-3 font-medium">Departamento</th>
                <th className="p-3 font-medium">Prazo</th>
                <th className="p-3 font-medium">Horas</th>
                <th className="p-3 font-medium">Prioridade</th>
              </tr>
            </thead>
            <tbody>
              {tarefas.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-3 font-medium">{t.titulo}</td>
                  <td className="p-3">{t.empresa}</td>
                  <td className="p-3 text-muted-foreground">{t.responsavel}</td>
                  <td className="p-3 text-muted-foreground">{t.departamento}</td>
                  <td className="p-3 tabular-nums">{t.prazo}</td>
                  <td className="p-3 tabular-nums">
                    {t.horasGastas}h / {t.horasPrevistas}h
                  </td>
                  <td className="p-3">
                    <StatusBadge status={t.prioridade} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {visao === "Cronograma" && (
        <div className="surface-panel space-y-3 p-4">
          {tarefas.map((t) => {
            const inicio = Math.min(90, t.horasGastas * 8);
            const largura = Math.max(12, (t.horasPrevistas / 8) * 40);
            return (
              <div key={t.id} className="flex items-center gap-4">
                <span className="w-56 shrink-0 truncate text-xs font-medium">{t.titulo}</span>
                <div className="relative h-6 flex-1 rounded-md bg-muted">
                  <div
                    className="absolute top-0 h-6 rounded-md bg-primary/70"
                    style={{ left: `${inicio}px`, width: `${largura}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-[11px] text-muted-foreground">{t.prazo}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
