import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Checkbox } from "@/components/ui/checkbox";
import { checklistsModelo, tarefas } from "@/lib/mock-data";

export const Route = createFileRoute("/checklists")({
  head: () => ({
    meta: [
      { title: "Checklist Operacional — DP Control" },
      {
        name: "description",
        content: "Checklists inteligentes de folha, férias, rescisão, admissão, 13º, SST, FGTS e DCTFWeb.",
      },
      { property: "og:title", content: "Checklist Operacional — DP Control" },
      { property: "og:description", content: "Itens obrigatórios bloqueiam a conclusão da tarefa." },
    ],
  }),
  component: Checklists,
});

function Checklists() {
  const tarefa = tarefas[0];
  const [itens, setItens] = useState(tarefa?.checklist ?? []);
  const bloqueado = itens.some((i) => i.obrigatorio && !i.feito);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checklist Operacional"
        description="Modelos personalizáveis por rotina · itens obrigatórios impedem a conclusão"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-panel p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold">Modelos de checklist</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {checklistsModelo.map((c) => (
              <div key={c.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{c.nome}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {c.itens} itens · {c.obrigatorios} obrigatórios
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">Aplicado em {c.uso} empresas</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel p-4">
          <h2 className="text-sm font-semibold">Checklist em execução</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {tarefa ? `${tarefa.titulo} — ${tarefa.empresa}` : "Nenhuma tarefa em execução"}
          </p>
          <div className="mt-4 space-y-3">
            {itens.map((item, idx) => (
              <label key={item.item} className="flex items-start gap-2.5 text-sm">
                <Checkbox
                  checked={item.feito}
                  onCheckedChange={(v) =>
                    setItens((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, feito: v === true } : p)),
                    )
                  }
                />
                <span className={item.feito ? "text-muted-foreground line-through" : ""}>
                  {item.item}
                  {item.obrigatorio && (
                    <span className="ml-1 text-[10px] font-semibold uppercase text-destructive">
                      obrigatório
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>

          <button
            disabled={bloqueado}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bloqueado && <Lock className="h-4 w-4" />}
            {bloqueado ? "Conclua os itens obrigatórios" : "Concluir tarefa"}
          </button>
        </div>
      </div>
    </div>
  );
}
