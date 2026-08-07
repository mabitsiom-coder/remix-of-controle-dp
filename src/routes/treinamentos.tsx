import { createFileRoute } from "@tanstack/react-router";
import { FileText, GitBranch, PlayCircle, ScrollText } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { treinamentos } from "@/lib/mock-data";

export const Route = createFileRoute("/treinamentos")({
  head: () => ({
    meta: [
      { title: "Treinamentos — DP Control" },
      {
        name: "description",
        content: "Biblioteca interna de vídeos, POPs, fluxogramas e procedimentos com controle por colaborador.",
      },
      { property: "og:title", content: "Treinamentos — DP Control" },
      { property: "og:description", content: "Capacitação contínua da equipe de Departamento Pessoal." },
    ],
  }),
  component: Treinamentos,
});

const icones: Record<string, typeof FileText> = {
  Vídeo: PlayCircle,
  POP: ScrollText,
  PDF: FileText,
  Fluxograma: GitBranch,
  Procedimento: ScrollText,
};

function Treinamentos() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Treinamentos"
        description="Biblioteca interna · vídeos, POPs, normas e fluxogramas com controle de conclusão"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {treinamentos.map((t) => {
          const Icone = icones[t.tipo] ?? FileText;
          const pct = Math.round((t.concluidoPor / t.total) * 100);
          return (
            <div key={t.id} className="surface-panel p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{t.titulo}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.tipo} · {t.duracao}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Conclusão da equipe</span>
                  <span>
                    {t.concluidoPor}/{t.total}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
