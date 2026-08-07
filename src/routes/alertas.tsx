import { createFileRoute } from "@tanstack/react-router";
import { BellRing } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { alertas } from "@/lib/mock-data";

export const Route = createFileRoute("/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas Inteligentes — DP Control" },
      {
        name: "description",
        content: "Notificações de férias, ASO vencendo, certificado digital, procurações, FGTS, DCTFWeb e eSocial.",
      },
      { property: "og:title", content: "Alertas Inteligentes — DP Control" },
      { property: "og:description", content: "Central de alertas automáticos do Departamento Pessoal." },
    ],
  }),
  component: Alertas,
});

function Alertas() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas Inteligentes"
        description="Regras automáticas de vencimento, pendência e falta de movimentação"
      />

      <div className="space-y-3">
        {alertas.map((a) => (
          <div key={a.id} className="surface-panel flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <BellRing className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.titulo}</p>
              <p className="text-xs text-muted-foreground">{a.detalhe}</p>
            </div>
            <StatusBadge status={a.nivel} />
          </div>
        ))}
      </div>
    </div>
  );
}
