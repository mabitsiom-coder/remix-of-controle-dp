import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, User, Users, Building2, Activity, Ban } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { FolhaFechamentoTable } from "@/components/folha-fechamento-table";
import { etapasFolha, folhas } from "@/lib/mock-data";
import { useEmpresas } from "@/lib/empresas-store";


export const Route = createFileRoute("/folha")({
  head: () => ({
    meta: [
      { title: "Folha de Pagamento — DP Control" },
      {
        name: "description",
        content: "Pipeline da folha: recebimento, conferência, processamento, revisão, publicação e entrega.",
      },
      { property: "og:title", content: "Folha de Pagamento — DP Control" },
      { property: "og:description", content: "Controle de aprovação e versões da folha por competência." },
    ],
  }),
  component: FolhaPage,
});

function FolhaPage() {
  const { empresas } = useEmpresas();
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>("todas");

  const empresasFiltradas = useMemo(
    () => empresasDaCarteira(empresas, carteiraFiltro),
    [empresas, carteiraFiltro],
  );

  const totalEmpresas = empresasFiltradas.length;
  const comMovimento = empresasFiltradas.filter(
    (e) => e.tipo === "com-movimento" || !e.tipo || e.tipo === "domestico-pf",
  ).length;
  const semMovimento = empresasFiltradas.filter((e) => e.tipo === "sem-movimento").length;
  const totalFuncionarios = empresasFiltradas.reduce((acc, e) => acc + (e.funcionarios || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Folha de Pagamento"
        description="Tarefas de fechamento por empresa e competência · pipeline operacional"
      />


      {/* Cards de KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-panel flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Empresas Cadastradas</p>
            <p className="text-2xl font-bold tabular-nums">{totalEmpresas}</p>
          </div>
        </div>

        <div className="surface-panel flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Com Movimento</p>
            <p className="text-2xl font-bold tabular-nums">{comMovimento}</p>
          </div>
        </div>

        <div className="surface-panel flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <Ban className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sem Movimento</p>
            <p className="text-2xl font-bold tabular-nums">{semMovimento}</p>
          </div>
        </div>

        <div className="surface-panel flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total de Funcionários</p>
            <p className="text-2xl font-bold tabular-nums">{totalFuncionarios}</p>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Controle de fechamento por competência</h2>
        <FolhaFechamentoTable />
      </section>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">

        {etapasFolha.map((etapa) => {
          const itens = folhas.filter((f) => f.etapa === etapa);
          return (
            <div key={etapa} className="surface-panel flex flex-col gap-3 p-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide">{etapa}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {itens.length}
                </span>
              </div>
              <div className="space-y-2">
                {itens.map((f) => (
                  <div key={f.id} className="rounded-lg border bg-background p-3">
                    <p className="text-sm font-medium leading-tight">{f.empresa}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Competência {f.competencia}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${f.progresso}%` }} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {f.responsavel}
                      </span>
                      {f.duplaConferencia && (
                        <span className="flex items-center gap-1 text-warning">
                          <ShieldCheck className="h-3 w-3" /> dupla conferência
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {itens.length === 0 && (
                  <p className="rounded-lg border border-dashed p-3 text-center text-[11px] text-muted-foreground">
                    Sem folhas nesta etapa
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface-panel overflow-x-auto">
        <h2 className="border-b p-3 text-sm font-semibold">Controle de aprovação</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="p-3 font-medium">Empresa</th>
              <th className="p-3 font-medium">Competência</th>
              <th className="p-3 font-medium">Etapa</th>
              <th className="p-3 font-medium">Responsável</th>
              <th className="p-3 font-medium">Revisor</th>
              <th className="p-3 font-medium">Supervisor</th>
              <th className="p-3 font-medium">Progresso</th>
            </tr>
          </thead>
          <tbody>
            {folhas.map((f) => (
              <tr key={f.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="p-3 font-medium">{f.empresa}</td>
                <td className="p-3 tabular-nums">{f.competencia}</td>
                <td className="p-3">{f.etapa}</td>
                <td className="p-3 text-muted-foreground">{f.responsavel}</td>
                <td className="p-3 text-muted-foreground">{f.revisor}</td>
                <td className="p-3 text-muted-foreground">{f.supervisor}</td>
                <td className="p-3 tabular-nums">{f.progresso}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
