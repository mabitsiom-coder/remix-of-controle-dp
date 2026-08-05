import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { empresas, type Empresa } from "@/lib/mock-data";

export const Route = createFileRoute("/empresas/$empresaId")({
  loader: ({ params }): { empresa: Empresa } => {
    const empresa = empresas.find((e) => e.id === params.empresaId);
    if (!empresa) throw notFound();
    return { empresa };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Empresa não encontrada — DP Control" }, { name: "robots", content: "noindex" }] };
    }
    const t = `${loaderData.empresa.nome} — Ficha do cliente`;
    return {
      meta: [
        { title: t },
        { name: "description", content: `Ficha, particularidades e histórico de ${loaderData.empresa.nome}.` },
        { property: "og:title", content: t },
        { property: "og:description", content: `Particularidades operacionais de ${loaderData.empresa.nome}.` },
      ],
    };
  },
  component: EmpresaDetalhe,
  errorComponent: () => <p className="text-sm text-muted-foreground">Não foi possível carregar a empresa.</p>,
  notFoundComponent: () => <p className="text-sm text-muted-foreground">Empresa não encontrada.</p>,
});

function EmpresaDetalhe() {
  const { empresa } = Route.useLoaderData();
  const p = empresa.particularidades;
  const desatualizada = empresa.diasSemRevisao > 30;

  return (
    <div className="space-y-6">
      <Link to="/empresas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Empresas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{empresa.nome}</h1>
            <StatusBadge status={empresa.status} />
            <StatusBadge status={empresa.risco} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {empresa.cnpj} · {empresa.regime} · {empresa.funcionarios} funcionários
          </p>
        </div>
        <Button variant="outline">Registrar revisão</Button>
      </div>

      {desatualizada && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Particularidades sem revisão há {empresa.diasSemRevisao} dias
            </p>
            <p className="text-xs text-muted-foreground">
              Última atualização em {empresa.ultimaRevisao}. Revisões são exigidas a cada 30 dias.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="cadastro">
        <TabsList>
          <TabsTrigger value="cadastro">Dados cadastrais</TabsTrigger>
          <TabsTrigger value="particularidades">Particularidades</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastro" className="mt-4">
          <div className="surface-panel grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <Campo label="Responsável" value={empresa.responsavel} />
            <Campo label="Contador" value={empresa.contador} />
            <Campo label="Carteira" value={empresa.carteira} />
            <Campo label="Analista" value={empresa.analista} />
            <Campo label="Supervisor" value={empresa.supervisor} />
            <Campo label="Regime tributário" value={empresa.regime} />
            <Campo label="Convênio / Sindicato" value={empresa.convenio} />
            <Campo label="Certificado digital" value={empresa.certificadoDigital} />
            <Campo label="Procuração" value={empresa.procuracao} />
            <Campo label="Nível de risco" value={empresa.risco} />
            <Campo label="Funcionários" value={String(empresa.funcionarios)} />
            <Campo label="Última revisão" value={empresa.ultimaRevisao} />
          </div>
        </TabsContent>

        <TabsContent value="particularidades" className="mt-4 space-y-4">
          <div className="surface-panel grid gap-4 p-5 sm:grid-cols-2">
            <Campo label="Forma de fechamento da folha" value={p.fechamento} />
            <Campo label="Forma de envio" value={p.envio} />
            <Campo label="Fluxo de aprovação" value={p.fluxoAprovacao} />
            <Campo
              label="Dupla conferência"
              value={p.duplaConferencia ? "Obrigatória" : "Não exigida"}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-panel p-5">
              <h3 className="mb-3 text-sm font-semibold">Rubricas personalizadas</h3>
              <ul className="space-y-2">
                {p.rubricas.map((r) => (
                  <li key={r} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface-panel p-5">
              <h3 className="mb-3 text-sm font-semibold">Eventos e regras próprias</h3>
              <ul className="space-y-2">
                {p.eventos.map((r) => (
                  <li key={r} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="surface-panel p-5">
            <h3 className="mb-2 text-sm font-semibold">Informações importantes</h3>
            <p className="text-sm text-muted-foreground">{p.observacoes}</p>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <div className="surface-panel divide-y p-2">
            {empresa.historico.map((h, i) => (
              <div key={i} className="flex items-start gap-4 p-3">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{h.data}</span>
                <div>
                  <p className="text-sm">{h.descricao}</p>
                  <p className="text-xs text-muted-foreground">por {h.usuario}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium capitalize-none">{value}</p>
    </div>
  );
}
