import { createFileRoute } from "@tanstack/react-router";
import { FileSearch, Sparkles, Wand2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Assistente IA de DP — DP Control" },
      {
        name: "description",
        content: "Assistente especializado em Departamento Pessoal: leitura de documentos, inconsistências e planos de ação.",
      },
      { property: "og:title", content: "Assistente IA de DP — DP Control" },
      { property: "og:description", content: "IA que analisa folhas, ASOs, XMLs e sugere correções." },
    ],
  }),
  component: Assistente,
});

const capacidades = [
  "Analisar PDFs, XMLs e planilhas",
  "Detectar inconsistências entre competências",
  "Identificar documentos vencidos",
  "Gerar checklists automaticamente",
  "Gerar tarefas e planos de ação",
  "Consultar particularidades da empresa",
  "Explicar erros encontrados",
  "Gerar relatórios executivos",
];

function Assistente() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistente IA de Departamento Pessoal"
        description="Especialista interno em eSocial, folha, SST e obrigações acessórias"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-panel flex min-h-[420px] flex-col p-4 lg:col-span-2">
          <div className="flex-1 space-y-4 overflow-y-auto">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="rounded-xl rounded-tl-none border bg-muted/40 p-3 text-sm">
                Olá, Paulo. Encontrei 3 pontos de atenção na competência 07/2026: a
                Metalúrgica Andrade está com base de periculosidade divergente, a Rede Bom Preço
                tem um ASO vencido há 2 dias e a DCTFWeb 06/2026 da Transportes Vale está em atraso.
                Quer que eu gere as tarefas corretivas?
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t pt-4">
            <Input placeholder="Pergunte algo ou envie um documento para análise..." />
            <Button>Enviar</Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Interface de demonstração — a conexão com o modelo de IA será habilitada na próxima etapa.
          </p>
        </div>

        <div className="space-y-4">
          <div className="surface-panel p-4">
            <h2 className="text-sm font-semibold">O que o assistente faz</h2>
            <ul className="mt-3 space-y-2">
              {capacidades.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="surface-panel p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FileSearch className="h-4 w-4" /> Análise de documentos
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Envie folhas, recibos, ASOs, XMLs do eSocial ou relatórios para conferência automática.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
