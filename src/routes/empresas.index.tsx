import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Users,
  Building2,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  Filter,
  Download,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  canCreateCompany,
  canDeleteCompany,
  filtrarEmpresasPorEscopo,
  isNivelAdmin,
} from "@/lib/permissoes";
import { carteiraDaEmpresa } from "@/lib/carteiras-core";
import type { Empresa } from "@/lib/mock-data";
import { EmpresasExcluidas } from "@/components/empresas-excluidas";
import { NovaEmpresaDialog } from "@/components/nova-empresa-dialog";
import { ImportarEmpresasDialog } from "@/components/importar-empresas-dialog";
import { MudarCarteiraDialog } from "@/components/mudar-carteira-dialog";
import { exportarEmpresasParaExcel } from "@/lib/empresas-excel";

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
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState<number>(24);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [empresaParaMudarCarteira, setEmpresaParaMudarCarteira] = useState<Empresa | null>(null);
  const { empresas, empresasExcluidas } = useEmpresas();
  const { currentUser } = useAuth();

  const podeCadastrar = canCreateCompany(currentUser);
  const podeExcluir = canDeleteCompany(currentUser);
  const isAdmin = isNivelAdmin(currentUser.perfil);

  // Aplica escopo de visualização por perfil/carteira/grupo
  const empresasNoEscopo = filtrarEmpresasPorEscopo(empresas, currentUser);

  const handleCopy = (e: React.MouseEvent, texto: string, tipo: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(texto);
    setCopiedId(texto);
    toast.success(`${tipo} "${texto}" copiado para a área de transferência!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const lista = empresasNoEscopo.filter((e) => {
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

  const totalItens = lista.length;
  const totalPaginas = itensPorPagina === 0 ? 1 : Math.max(1, Math.ceil(totalItens / itensPorPagina));
  const paginaValida = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const indiceInicio = itensPorPagina === 0 ? 0 : (paginaValida - 1) * itensPorPagina;
  const indiceFim = itensPorPagina === 0 ? totalItens : Math.min(indiceInicio + itensPorPagina, totalItens);
  const empresasPaginadas = lista.slice(indiceInicio, indiceFim);

  const irParaPagina = (pag: number) => {
    const nova = Math.min(Math.max(1, pag), totalPaginas);
    setPaginaAtual(nova);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBuscaChange = (val: string) => {
    setBusca(val);
    setPaginaAtual(1);
  };

  const handleItensPorPaginaChange = (val: string) => {
    setItensPorPagina(Number(val));
    setPaginaAtual(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastro de Empresas"
        description="Ficha permanente, particularidades e histórico de cada cliente"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (empresasNoEscopo.length === 0) {
                  toast.error("Nenhuma empresa disponível no seu escopo para exportação.");
                  return;
                }
                exportarEmpresasParaExcel(empresasNoEscopo);
                toast.success(`${empresasNoEscopo.length} empresa(s) exportada(s) para Excel!`);
              }}
              className="gap-2 border-emerald-600/30 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 shadow-xs cursor-pointer"
            >
              <Download className="h-4 w-4" /> Exportar Excel
            </Button>
            {podeCadastrar && (
              <>
                <ImportarEmpresasDialog />
                <NovaEmpresaDialog />
              </>
            )}
          </div>
        }
      />

      {/* BANNER DE ESCOPO PARA USUÁRIOS COM RESTRIÇÃO */}
      {!isAdmin && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Filter className="h-4 w-4 shrink-0" />
            <span>
              Escopo Ativo ({currentUser.perfil}): Exibindo empresas vinculadas à sua carteira (
              <strong>{currentUser.carteira || "Atribuída"}</strong>) e atribuições diretas.
            </span>
          </div>
          <Badge variant="outline" className="bg-background text-[11px]">
            {empresasNoEscopo.length} de {empresas.length} empresas
          </Badge>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input
          placeholder="Buscar por código, nome, CNPJ ou analista..."
          value={busca}
          onChange={(e) => handleBuscaChange(e.target.value)}
          className="max-w-md"
        />
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Itens por página:</span>
            <Select value={String(itensPorPagina)} onValueChange={handleItensPorPaginaChange}>
              <SelectTrigger className="h-8 w-[95px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12" className="text-xs">12</SelectItem>
                <SelectItem value="24" className="text-xs">24</SelectItem>
                <SelectItem value="48" className="text-xs">48</SelectItem>
                <SelectItem value="96" className="text-xs">96</SelectItem>
                <SelectItem value="0" className="text-xs">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-l pl-3">
            {totalItens === 0 ? (
              <span>Nenhuma empresa</span>
            ) : itensPorPagina === 0 ? (
              <span>Total: <strong className="text-foreground">{totalItens}</strong> empresas</span>
            ) : (
              <span>
                Exibindo <strong className="text-foreground">{indiceInicio + 1}–{indiceFim}</strong> de <strong className="text-foreground">{totalItens}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="surface-panel flex flex-col items-center justify-center p-12 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold">Nenhuma empresa encontrada</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Nenhuma empresa corresponde aos critérios de busca ou ao seu escopo de acesso atual.
          </p>
          {podeCadastrar && (
            <div className="mt-4">
              <NovaEmpresaDialog />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {empresasPaginadas.map((e) => {
              const codDominio = e.codigoDominio || e.id;
              return (
                <div key={e.id} className="relative">
                  {podeExcluir && (
                    <div className="absolute right-2 top-2 z-10">
                      <ExcluirEmpresaButton empresa={e} />
                    </div>
                  )}
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
                      <div className={podeExcluir ? "mr-8" : ""}>
                        <StatusBadge status={e.status} />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-y-2.5 text-xs">
                      <Info label="Regime" value={e.regime} />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Carteira</p>
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            setEmpresaParaMudarCarteira(e);
                          }}
                          title={`Clique para mudar de carteira (${carteiraDaEmpresa(e)})`}
                          className="group/carteira-btn inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 -ml-1.5 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer border border-transparent hover:border-primary/30 max-w-full text-left"
                        >
                          <span className="truncate">{carteiraDaEmpresa(e) || "Sem Carteira"}</span>
                          <ArrowLeftRight className="h-3 w-3 text-muted-foreground group-hover/carteira-btn:text-primary transition-colors shrink-0" />
                        </button>
                      </div>
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

          {/* BARRA DE CONTROLES DE PAGINAÇÃO */}
          {itensPorPagina > 0 && totalPaginas > 1 && (
            <div className="surface-panel flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border">
              <p className="text-xs text-muted-foreground order-2 sm:order-1">
                Página <strong className="text-foreground">{paginaValida}</strong> de{" "}
                <strong className="text-foreground">{totalPaginas}</strong> ({totalItens} empresas no total)
              </p>

              <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => irParaPagina(1)}
                  disabled={paginaValida === 1}
                  title="Primeira Página"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 px-2.5 text-xs"
                  onClick={() => irParaPagina(paginaValida - 1)}
                  disabled={paginaValida === 1}
                  title="Página Anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden xs:inline">Anterior</span>
                </Button>

                {gerarNumerosPaginas(paginaValida, totalPaginas).map((num, i) =>
                  num === "..." ? (
                    <span key={`dots-${i}`} className="px-2 text-xs text-muted-foreground select-none">
                      …
                    </span>
                  ) : (
                    <Button
                      key={`page-${num}`}
                      variant={paginaValida === num ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs font-semibold"
                      onClick={() => irParaPagina(Number(num))}
                    >
                      {num}
                    </Button>
                  ),
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 px-2.5 text-xs"
                  onClick={() => irParaPagina(paginaValida + 1)}
                  disabled={paginaValida === totalPaginas}
                  title="Próxima Página"
                >
                  <span className="hidden xs:inline">Próxima</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => irParaPagina(totalPaginas)}
                  disabled={paginaValida === totalPaginas}
                  title="Última Página"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {podeExcluir && <EmpresasExcluidas empresas={empresasExcluidas} />}

      {/* DIALOG ÚNICO GLOBAL PARA OTIMIZAÇÃO DE MEMÓRIA */}
      <MudarCarteiraDialog
        empresa={empresaParaMudarCarteira}
        open={Boolean(empresaParaMudarCarteira)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEmpresaParaMudarCarteira(null);
        }}
      />
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
          className="rounded-md border bg-background/90 p-1.5 text-muted-foreground shadow-sm transition-colors hover:border-destructive/40 hover:text-destructive cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir empresa "{empresa.nome}"?</AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Tem certeza de que deseja excluir esta empresa? Esta operação poderá afetar históricos, tarefas e indicadores relacionados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
            onClick={() => {
              excluirEmpresa(empresa.id, currentUser?.nome || "Sistema");
              toast.success(`"${empresa.nome}" movida para Empresas Excluídas. Histórico preservado.`);
            }}
          >
            Confirmar Exclusão
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

function gerarNumerosPaginas(paginaAtual: number, totalPaginas: number): (number | string)[] {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }

  const paginas: (number | string)[] = [];
  const delta = 1;

  for (let i = 1; i <= totalPaginas; i++) {
    if (
      i === 1 ||
      i === totalPaginas ||
      (i >= paginaAtual - delta && i <= paginaAtual + delta)
    ) {
      paginas.push(i);
    } else if (paginas[paginas.length - 1] !== "...") {
      paginas.push("...");
    }
  }

  return paginas;
}
