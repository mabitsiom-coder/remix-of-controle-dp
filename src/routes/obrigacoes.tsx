import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileDown, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { NovaObrigacaoDialog } from "@/components/nova-obrigacao-dialog";
import { useObrigacoes, deleteObrigacao } from "@/lib/obrigacoes-store";

export const Route = createFileRoute("/obrigacoes")({
  head: () => ({
    meta: [
      { title: "Gestão de Obrigações — DP Control" },
      {
        name: "description",
        content: "Acompanhe eSocial, FGTS Digital, DCTFWeb, MIT, EFD-Reinf e SST com prazos e protocolos.",
      },
      { property: "og:title", content: "Gestão de Obrigações — DP Control" },
      { property: "og:description", content: "Painel de obrigações acessórias do DP com alertas de atraso." },
    ],
  }),
  component: Obrigacoes,
});

const tipos = ["Todos", "eSocial", "DCTFWeb", "FGTS Digital", "EFD-Reinf", "MIT", "SST (S-2220)"];

function Obrigacoes() {
  const [filtro, setFiltro] = useState("Todos");
  const { obrigacoes } = useObrigacoes();
  const lista = filtro === "Todos" ? obrigacoes : obrigacoes.filter((o) => o.tipo === filtro);

  const resumo = [
    { label: "Transmitidas", qtd: obrigacoes.filter((o) => o.status === "transmitido").length, cor: "text-success" },
    { label: "Pendentes", qtd: obrigacoes.filter((o) => o.status === "pendente").length, cor: "text-warning" },
    { label: "Com erro", qtd: obrigacoes.filter((o) => o.status === "erro").length, cor: "text-destructive" },
    { label: "Em atraso", qtd: obrigacoes.filter((o) => o.status === "atrasado").length, cor: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Obrigações"
        description="eSocial, FGTS Digital, DCTFWeb, MIT, EFD-Reinf e SST"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <FileDown className="mr-1.5 h-4 w-4" /> Exportar
            </Button>
            <NovaObrigacaoDialog />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {resumo.map((r) => (
          <div key={r.label} className="surface-panel p-4">
            <p className="text-xs text-muted-foreground">{r.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${r.cor}`}>{r.qtd}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {tipos.map((t) => (
          <button
            key={t}
            onClick={() => setFiltro(t)}
            className={
              filtro === t
                ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                : "rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="surface-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="p-3 font-medium">Empresa</th>
              <th className="p-3 font-medium">Obrigação</th>
              <th className="p-3 font-medium">Competência</th>
              <th className="p-3 font-medium">Prazo</th>
              <th className="p-3 font-medium">Responsável</th>
              <th className="p-3 font-medium">Protocolo</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="p-3 font-medium">{o.empresa}</td>
                <td className="p-3">{o.tipo}</td>
                <td className="p-3 tabular-nums">{o.competencia}</td>
                <td className="p-3 tabular-nums">{o.prazo || "—"}</td>
                <td className="p-3 text-muted-foreground">{o.responsavel || "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">{o.protocolo ?? "—"}</td>
                <td className="p-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteObrigacao(o.id)}
                    aria-label="Excluir obrigação"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                  Nenhuma obrigação cadastrada. Use o botão <strong>Nova Obrigação</strong> para inserir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
