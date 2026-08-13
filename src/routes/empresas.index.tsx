import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Users, Building2, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEmpresas, excluirEmpresa } from "@/lib/empresas-store";
import { useAuth } from "@/lib/auth-store";
import { carteiraDaEmpresa } from "@/lib/carteiras-core";
import type { Empresa } from "@/lib/mock-data";
import { EmpresasExcluidas } from "@/components/empresas-excluidas";
import { NovaEmpresaDialog } from "@/components/nova-empresa-dialog";
import { ImportarEmpresasDialog } from "@/components/importar-empresas-dialog";


export const Route = createFileRoute("/empresas/")({
  head: () => ({
    meta: [
      { title: "Cadastro de Empresas — DP Control" },
      {
        name: "description",
        content:
          "Ficha completa de cada cliente: código do domínio, carteira, analista, certificado digital, riscos e particularidades da folha.",
      },
      { property: "og:title", content: "Cadastro de Empresas — DP Control" },
      { property: "og:description", content: "Fichas completas e particularidades operacionais por cliente." },
    ],
  }),
  component: Empresas,
});

function Empresas() {
  const [busca, setBusca] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { empresas } = useEmpresas();

  const handleCopy = (e: React.MouseEvent, texto: string, tipo: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(texto);
    setCopiedId(texto);
    toast.success(`${tipo} "${texto}" copiado para a área de transferência!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const lista = empresas.filter((e) => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    const cod = (e.codigoDominio || e.id || "").toLowerCase();
    return (
      e.nome.toLowerCase().includes(q) ||
      e.cnpj.includes(q) ||
      cod.includes(q) ||
      (e.carteira && e.carteira.toLowerCase().includes(q)) ||
      e.analista.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastro de Empresas"
        description="Ficha permanente, particularidades e histórico de cada cliente"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ImportarEmpresasDialog />
            <NovaEmpresaDialog />
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input
          placeholder="Buscar por código, nome, CNPJ ou analista..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-md"
        />
        <div className="text-xs text-muted-foreground">
          Total: <strong className="text-foreground">{empresas.length}</strong> empresas cadastradas
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="surface-panel flex flex-col items-center justify-center p-12 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold">Nenhuma empresa encontrada</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Nenhuma empresa corresponde aos critérios de busca ou nenhuma empresa foi cadastrada ainda.
          </p>
          <div className="mt-4">
            <NovaEmpresaDialog />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((e) => {
            const codDominio = e.codigoDominio || e.id;
            return (
              <div key={e.id} className="relative">
                <div className="absolute right-2 top-2 z-10">
                  <ExcluirEmpresaButton empresa={e} />
                </div>
                <Link
                  to="/empresas/$empresaId"
                  params={{ empresaId: e.id }}
                  className="surface-panel block p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="truncate text-sm font-semibold group-hover:text-primary transition-colors">
                          {e.nome}
                        </h2>
                      </div>

                      {/* Tag com Código do Domínio com botão de Copiar */}
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {codDominio && (
                          <button
                            type="button"
                            onClick={(ev) => handleCopy(ev, codDominio, "Código do Domínio")}
                            title="Clique para copiar o Código do Domínio"
                            className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 hover:border-primary/40 cursor-pointer"
                          >
                            <span>Cód. {codDominio}</span>
                            {copiedId === codDominio ? (
                              <Check className="h-3 w-3 text-success" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                            )}
                          </button>
                        )}

                        <span className="text-xs text-muted-foreground">{e.cnpj}</span>
                        {e.cnpj && (
                          <button
                            type="button"
                            onClick={(ev) => handleCopy(ev, e.cnpj, "CNPJ")}
                            title="Copiar CNPJ"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mr-8">
                      <StatusBadge status={e.status} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-y-2.5 text-xs">
                    <Info label="Regime" value={e.regime} />
                    <Info label="Carteira" value={carteiraDaEmpresa(e)} />
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
              </div>
            );
          })}
        </div>
      )}

      <EmpresasExcluidas empresas={empresasExcluidas} />
    </div>
  );
}

function ExcluirEmpresaButton({ empresa }: { empresa: Empresa }) {
  const { currentUser } = useAuth();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          title="Excluir empresa"
          className="rounded-md border bg-background/90 p-1.5 text-muted-foreground shadow-sm transition-colors hover:border-destructive/40 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta empresa será removida dos controles ativos, mas seu histórico será preservado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              excluirEmpresa(empresa.id, currentUser?.nome || "Sistema");
              toast.success(`"${empresa.nome}" movida para Empresas Excluídas. Histórico preservado.`);
            }}
          >
            Excluir empresa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate font-medium">{value || "—"}</p>
    </div>
  );
}
