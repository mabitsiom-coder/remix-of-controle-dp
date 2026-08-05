import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { eventosSST } from "@/lib/mock-data";

export const Route = createFileRoute("/sst")({
  head: () => ({
    meta: [
      { title: "SST — Saúde e Segurança do Trabalho | DP Control" },
      {
        name: "description",
        content: "Controle de ASOs, S-2210, S-2220, S-2240, PCMSO, PGR e LTCAT com painel de vencimentos.",
      },
      { property: "og:title", content: "SST — DP Control" },
      { property: "og:description", content: "Painel de vencimentos de ASOs e documentos de SST." },
    ],
  }),
  component: SST,
});

function SST() {
  const vencidos = eventosSST.filter((e) => e.diasRestantes < 0);
  const criticos = eventosSST.filter((e) => e.diasRestantes >= 0 && e.diasRestantes <= 7);
  const proximos = eventosSST.filter((e) => e.diasRestantes > 7);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SST — Saúde e Segurança do Trabalho"
        description="ASOs, eventos S-2210 / S-2220 / S-2240 e documentos PCMSO, PGR e LTCAT"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Resumo label="Vencidos" qtd={vencidos.length} cor="text-destructive" />
        <Resumo label="Vencem em até 7 dias" qtd={criticos.length} cor="text-warning" />
        <Resumo label="Próximos" qtd={proximos.length} cor="text-info" />
        <Resumo label="Clínicas parceiras" qtd={3} cor="text-success" />
      </div>

      <Bloco titulo="Vencidos" itens={vencidos} />
      <Bloco titulo="Críticos (até 7 dias)" itens={criticos} />
      <Bloco titulo="Próximos vencimentos" itens={proximos} />
    </div>
  );
}

function Resumo({ label, qtd, cor }: { label: string; qtd: number; cor: string }) {
  return (
    <div className="surface-panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${cor}`}>{qtd}</p>
    </div>
  );
}

function Bloco({ titulo, itens }: { titulo: string; itens: typeof eventosSST }) {
  if (itens.length === 0) return null;
  return (
    <div className="surface-panel overflow-x-auto">
      <h2 className="border-b p-3 text-sm font-semibold">{titulo}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="p-3 font-medium">Empresa</th>
            <th className="p-3 font-medium">Colaborador</th>
            <th className="p-3 font-medium">Tipo</th>
            <th className="p-3 font-medium">Evento</th>
            <th className="p-3 font-medium">Clínica / Responsável</th>
            <th className="p-3 font-medium">Vencimento</th>
            <th className="p-3 font-medium">Situação</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((e) => (
            <tr key={e.id} className="border-b last:border-0 hover:bg-muted/40">
              <td className="p-3 font-medium">{e.empresa}</td>
              <td className="p-3">{e.colaborador}</td>
              <td className="p-3">{e.tipo}</td>
              <td className="p-3 text-muted-foreground">{e.evento}</td>
              <td className="p-3 text-muted-foreground">{e.clinica}</td>
              <td className="p-3 tabular-nums">{e.vencimento}</td>
              <td className="p-3">
                <span
                  className={
                    e.diasRestantes < 0
                      ? "text-xs font-semibold text-destructive"
                      : e.diasRestantes <= 7
                        ? "text-xs font-semibold text-warning"
                        : "text-xs text-muted-foreground"
                  }
                >
                  {e.diasRestantes < 0
                    ? `Vencido há ${Math.abs(e.diasRestantes)} dias`
                    : `Faltam ${e.diasRestantes} dias`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
