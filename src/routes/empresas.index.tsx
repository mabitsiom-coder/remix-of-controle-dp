import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Plus, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { empresas } from "@/lib/mock-data";

export const Route = createFileRoute("/empresas/")({
  head: () => ({
    meta: [
      { title: "Cadastro de Empresas — DP Control" },
      {
        name: "description",
        content:
          "Ficha completa de cada cliente: carteira, analista, certificado digital, riscos e particularidades da folha.",
      },
      { property: "og:title", content: "Cadastro de Empresas — DP Control" },
      { property: "og:description", content: "Fichas completas e particularidades operacionais por cliente." },
    ],
  }),
  component: Empresas,
});

function Empresas() {
  const [busca, setBusca] = useState("");
  const lista = empresas.filter(
    (e) =>
      e.nome.toLowerCase().includes(busca.toLowerCase()) ||
      e.cnpj.includes(busca) ||
      e.analista.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastro de Empresas"
        description="Ficha permanente, particularidades e histórico de cada cliente"
        actions={
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> Nova empresa
          </Button>
        }
      />

      <Input
        placeholder="Buscar por nome, CNPJ ou analista..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="max-w-md"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lista.map((e) => (
          <Link
            key={e.id}
            to="/empresas/$empresaId"
            params={{ empresaId: e.id }}
            className="surface-panel block p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{e.nome}</h2>
                <p className="text-xs text-muted-foreground">{e.cnpj}</p>
              </div>
              <StatusBadge status={e.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
              <Info label="Regime" value={e.regime} />
              <Info label="Carteira" value={e.carteira} />
              <Info label="Analista" value={e.analista} />
              <Info label="Supervisor" value={e.supervisor} />
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {e.funcionarios} funcionários
              </span>
              {e.diasSemRevisao > 30 ? (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" /> {e.diasSemRevisao} dias sem revisão
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Revisado há {e.diasSemRevisao} dias</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate font-medium">{value}</p>
    </div>
  );
}
