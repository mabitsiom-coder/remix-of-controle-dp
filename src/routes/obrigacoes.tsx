import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  FileDown,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  UserCheck,
  User,
  Users,
  Edit2,
  Check,
  X,
  FileCheck,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NovaObrigacaoDialog } from "@/components/nova-obrigacao-dialog";
import { NovaDCTFWebDialog } from "@/components/nova-dctfweb-dialog";
import { NovaEspelhoDebitoDialog } from "@/components/novo-espelho-debito-dialog";
import { useObrigacoes, deleteObrigacao } from "@/lib/obrigacoes-store";
import { useRegDCTFWeb, deleteDCTFWeb, updateDCTFWeb, type RegDCTFWeb } from "@/lib/dctfweb-store";
import {
  useRegEspelhoDebito,
  deleteEspelhoDebito,
  updateEspelhoDebito,
  type RegEspelhoDebito,
} from "@/lib/espelho-debito-store";
import { useEmpresas } from "@/lib/empresas-store";
import { useCadastros } from "@/lib/cadastros-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/obrigacoes")({
  head: () => ({
    meta: [
      { title: "Gestão de Obrigações — DP Control" },
      {
        name: "description",
        content: "Acompanhe eSocial, FGTS Digital, DCTFWeb, Espelho de Débito, MIT, EFD-Reinf e SST.",
      },
      { property: "og:title", content: "Gestão de Obrigações — DP Control" },
      { property: "og:description", content: "Painel de obrigações acessórias do DP com espelho de débito." },
    ],
  }),
  component: Obrigacoes,
});

const tiposObriga = [
  "Todos",
  "DCTFWeb",
  "Espelho de Débito",
  "eSocial",
  "FGTS Digital",
  "EFD-Reinf",
  "MIT",
  "SST (S-2220)",
];

function Obrigacoes() {
  const [filtroTipo, setFiltroTipo] = useState("Espelho de Débito");
  const { obrigacoes = [] } = useObrigacoes() || {};
  const { registros: dctfRegistros = [] } = useRegDCTFWeb() || {};
  const { registros: debitoRegistros = [] } = useRegEspelhoDebito() || {};
  const { empresas = [] } = useEmpresas() || {};
  const { carteiras = [] } = useCadastros() || {};

  const [busca, setBusca] = useState("");
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>("todas");
  const [editingDCTF, setEditingDCTF] = useState<RegDCTFWeb | null>(null);
  const [editingDebito, setEditingDebito] = useState<RegEspelhoDebito | null>(null);

  // Sincronizar todos os registros de DCTFWeb com as empresas
  const dctfCompletos: RegDCTFWeb[] = useMemo(() => {
    const listEmp = (empresas || []).filter(Boolean);
    const listDctf = (dctfRegistros || []).filter(Boolean);
    if (listEmp.length > 0) {
      const mapa = new Map(listDctf.map((r) => [r.codigo || r.id, r]));
      return listEmp.map((emp, index) => {
        const cod = emp.codigoDominio || emp.id || String(index + 1);
        const mat = mapa.get(cod) || mapa.get(emp.nome);
        if (mat) {
          return {
            ...mat,
            ord: mat.ord || index + 1,
            codigo: cod,
            empresa: emp.nome || mat.empresa || "Empresa Sem Nome",
            cnpj: emp.cnpj || mat.cnpj || "",
            carteira: emp.carteira || mat.carteira || "RH - G - 01",
            analista: emp.analista || mat.analista || "Não atribuído",
            supervisor: emp.supervisor || mat.supervisor || "Não atribuído",
          };
        }
        return {
          id: `dctf-${cod}`,
          ord: index + 1,
          codigo: cod,
          empresa: emp.nome || "Empresa Sem Nome",
          cnpj: emp.cnpj || "",
          carteira: emp.carteira || "RH - G - 01",
          analista: emp.analista || "Não atribuído",
          supervisor: emp.supervisor || "Não atribuído",
          tipo: emp.tipo === "sem-movimento" ? "S/M" : "C/M",
          reinf: "SIM",
          eSocial: "SIM",
          nfCprb: "❌",
          nfRetInss: "❌",
          nfRetCsrf: "❌",
          transmissaoPublicacao: "PUBLICADO NA MTZ",
          reciboDocSalvo: "PUBLICADO NA MTZ",
          conferidoAnalista: "CONFERIDO",
          revisadoSupervisao: "PENDENTE",
          observacao: "",
        };
      });
    }
    return listDctf;
  }, [empresas, dctfRegistros]);

  // Sincronizar todos os registros de Espelho de Débito com as empresas
  const debitoCompletos: RegEspelhoDebito[] = useMemo(() => {
    const listEmp = (empresas || []).filter(Boolean);
    const listDebito = (debitoRegistros || []).filter(Boolean);
    if (listEmp.length > 0) {
      const mapa = new Map(listDebito.map((r) => [r.codigo || r.id, r]));
      return listEmp.map((emp, index) => {
        const cod = emp.codigoDominio || emp.id || String(index + 1);
        const mat = mapa.get(cod) || mapa.get(emp.nome);
        if (mat) {
          return {
            ...mat,
            ord: mat.ord || index + 1,
            codigo: cod,
            empresa: emp.nome || mat.empresa || "Empresa Sem Nome",
            cnpjCpf: emp.cnpj || mat.cnpjCpf || "",
            carteira: emp.carteira || mat.carteira || "RH - G - 01",
            analista: emp.analista || mat.analista || "Não atribuído",
            supervisor: emp.supervisor || mat.supervisor || "Não atribuído",
          };
        }
        return {
          id: `deb-${cod}`,
          ord: index + 1,
          codigo: cod,
          empresa: emp.nome || "Empresa Sem Nome",
          cnpjCpf: emp.cnpj || "",
          carteira: emp.carteira || "RH - G - 01",
          analista: emp.analista || "Não atribuído",
          supervisor: emp.supervisor || "Não atribuído",
          tipo: emp.tipo === "sem-movimento" ? "S/M" : "C/M",
          debitos: "—",
          omissao: "NÃO",
          enviadoCliente: "—",
          obsAnalistaSolicitacao: "—",
          obsAnalistaData: "—",
          obsCsFerramenta: "—",
          obsCsData: "—",
        };
      });
    }
    return listDebito;
  }, [empresas, debitoRegistros]);

  // Lista de carteiras disponíveis
  const carteirasDisponiveis = useMemo(() => {
    const listCart = (carteiras || []).filter(Boolean);
    const listEmp = (empresas || []).filter(Boolean);
    const set = new Set([
      ...listCart.map((c) => c?.nome).filter(Boolean),
      ...listEmp.map((e) => e?.carteira).filter(Boolean),
    ]);
    return Array.from(set).sort();
  }, [carteiras, empresas]);

  // Filtragem DCTFWeb
  const dctfFiltrados = useMemo(() => {
    return (dctfCompletos || []).filter((r) => {
      if (!r) return false;
      const q = busca.trim().toLowerCase();
      if (q) {
        const cod = String(r.codigo ?? "").toLowerCase();
        const emp = String(r.empresa ?? "").toLowerCase();
        const cnpj = String(r.cnpj ?? "").toLowerCase();
        const ana = String(r.analista ?? "").toLowerCase();
        const sup = String(r.supervisor ?? "").toLowerCase();
        return (
          cod.includes(q) ||
          emp.includes(q) ||
          cnpj.includes(q) ||
          ana.includes(q) ||
          sup.includes(q)
        );
      }
      const cart = String(r.carteira || "Sem Carteira");
      if (carteiraFiltro !== "todas" && cart !== carteiraFiltro) return false;
      return true;
    });
  }, [dctfCompletos, busca, carteiraFiltro]);

  // Filtragem Espelho de Débito
  const debitoFiltrados = useMemo(() => {
    return (debitoCompletos || []).filter((r) => {
      if (!r) return false;
      const q = busca.trim().toLowerCase();
      if (q) {
        const cod = String(r.codigo ?? "").toLowerCase();
        const emp = String(r.empresa ?? "").toLowerCase();
        const cnpj = String(r.cnpjCpf ?? "").toLowerCase();
        const deb = String(r.debitos ?? "").toLowerCase();
        const ana = String(r.analista ?? "").toLowerCase();
        const sup = String(r.supervisor ?? "").toLowerCase();
        const obsCs = String(r.obsCsData ?? "").toLowerCase();
        return (
          cod.includes(q) ||
          emp.includes(q) ||
          cnpj.includes(q) ||
          deb.includes(q) ||
          ana.includes(q) ||
          sup.includes(q) ||
          obsCs.includes(q)
        );
      }
      const cart = String(r.carteira || "Sem Carteira");
      if (carteiraFiltro !== "todas" && cart !== carteiraFiltro) return false;
      return true;
    });
  }, [debitoCompletos, busca, carteiraFiltro]);

  // Dados da carteira em destaque
  const informacoesCarteira = useMemo(() => {
    const listaAlvo = (filtroTipo === "DCTFWeb" ? dctfCompletos : debitoCompletos) || [];
    if (carteiraFiltro === "todas") {
      const supUnicos = Array.from(new Set(listaAlvo.map((r) => r?.supervisor).filter(Boolean)));
      const anaUnicos = Array.from(new Set(listaAlvo.map((r) => r?.analista).filter(Boolean)));
      return {
        nome: "Todas as Carteiras",
        supervisores: supUnicos as string[],
        analistas: anaUnicos as string[],
        totalEmpresas: listaAlvo.length,
      };
    }
    const daCarteira = listaAlvo.filter((r) => r && (r.carteira || "Sem Carteira") === carteiraFiltro);
    const supUnicos = Array.from(new Set(daCarteira.map((r) => r?.supervisor).filter(Boolean)));
    const anaUnicos = Array.from(new Set(daCarteira.map((r) => r?.analista).filter(Boolean)));
    return {
      nome: carteiraFiltro,
      supervisores: supUnicos.length > 0 ? (supUnicos as string[]) : ["ADRIELLE"],
      analistas: anaUnicos.length > 0 ? (anaUnicos as string[]) : ["SIMEANE"],
      totalEmpresas: daCarteira.length,
    };
  }, [carteiraFiltro, filtroTipo, dctfCompletos, debitoCompletos]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Obrigações"
        description="eSocial, FGTS Digital, DCTFWeb, Espelho de Débito, MIT, EFD-Reinf e SST"
        actions={
          <div className="flex gap-2">
            {filtroTipo === "DCTFWeb" ? (
              <NovaDCTFWebDialog />
            ) : filtroTipo === "Espelho de Débito" ? (
              <NovaEspelhoDebitoDialog />
            ) : (
              <NovaObrigacaoDialog />
            )}
          </div>
        }
      />

      {/* Filtros de Tipos de Obrigação */}
      <div className="flex flex-wrap gap-2">
        {tiposObriga.map((t) => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            className={
              filtroTipo === t
                ? "rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all"
                : "rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* RENDERIZAÇÃO: ESPELHO DE DÉBITO */}
      {filtroTipo === "Espelho de Débito" ? (
        <div className="space-y-6">
          {/* Cards de Resumo Espelho de Débito */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="surface-panel flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Empresas</p>
                <p className="text-2xl font-bold tabular-nums">{informacoesCarteira.totalEmpresas}</p>
              </div>
            </div>

            <div className="surface-panel flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Com Débitos / Omissão</p>
                <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {debitoCompletos.filter((r) => r.omissao === "SIM" || (r.debitos && r.debitos !== "—")).length}
                </p>
              </div>
            </div>

            <div className="surface-panel flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Enviados ao Cliente</p>
                <p className="text-2xl font-bold tabular-nums text-success">
                  {debitoCompletos.filter((r) => r.enviadoCliente === "SIM").length}
                </p>
              </div>
            </div>

            <div className="surface-panel flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Com Solicitação (Analista)</p>
                <p className="text-2xl font-bold tabular-nums">
                  {debitoCompletos.filter((r) => r.obsAnalistaSolicitacao && r.obsAnalistaSolicitacao !== "—").length}
                </p>
              </div>
            </div>
          </div>

          {/* Destaque da Carteira Selecionada */}
          <div className="surface-panel p-4 rounded-xl border bg-card/60 backdrop-blur space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Carteira em Destaque
                  </p>
                  <h3 className="text-base font-bold text-foreground">
                    {informacoesCarteira.nome}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <div>
                    <span className="text-[10px] uppercase font-medium text-muted-foreground block">
                      Supervisor(a)
                    </span>
                    <span className="font-bold text-foreground">
                      {informacoesCarteira.supervisores.join(", ") || "Não atribuído"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-info" />
                  <div>
                    <span className="text-[10px] uppercase font-medium text-muted-foreground block">
                      Analista(s)
                    </span>
                    <span className="font-bold text-foreground">
                      {informacoesCarteira.analistas.join(", ") || "Não atribuído"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-success" />
                  <div>
                    <span className="text-[10px] uppercase font-medium text-muted-foreground block">
                      Empresas Vinc.
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {informacoesCarteira.totalEmpresas} empresas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Abas de Seleção de Carteiras */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setCarteiraFiltro("todas")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  carteiraFiltro === "todas"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                Todas as Carteiras ({debitoCompletos.length})
              </button>
              {carteirasDisponiveis.map((cart) => {
                const qtd = debitoCompletos.filter((r) => (r.carteira || "Sem Carteira") === cart).length;
                return (
                  <button
                    key={cart}
                    type="button"
                    onClick={() => setCarteiraFiltro(cart)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs transition-all",
                      carteiraFiltro === cart
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {cart} ({qtd})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="surface-panel flex flex-wrap items-center gap-2 p-3">
            <div className="relative min-w-60 flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar por código, empresa, CNPJ, débitos ou observações..."
                className="pl-8 pr-8"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Limpar pesquisa"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={carteiraFiltro}
              onChange={(e) => setCarteiraFiltro(e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm font-medium"
            >
              <option value="todas">Todas as Carteiras</option>
              {carteirasDisponiveis.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Tabela Planilha Espelho de Débito */}
          <div className="surface-panel overflow-x-auto">
            <table className="w-full min-w-[1600px] text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 text-center font-bold text-[11px] uppercase tracking-wide text-foreground">
                  <th rowSpan={2} className="p-2 border-r text-center w-12">ORD.</th>
                  <th rowSpan={2} className="p-2 border-r text-center w-14">CÓD.</th>
                  <th rowSpan={2} className="p-2 border-r text-left min-w-[220px]">EMPRESA</th>
                  <th rowSpan={2} className="p-2 border-r text-center min-w-[140px]">CNPJ/CPF</th>
                  <th rowSpan={2} className="p-2 border-r text-center w-14">TIPO</th>
                  <th rowSpan={2} className="p-2 border-r text-center min-w-[260px]">DÉBITOS</th>
                  <th rowSpan={2} className="p-2 border-r text-center w-16">OMISSÃO</th>
                  
                  <th colSpan={1} className="p-2 border-r border-b text-center bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold">
                    ENVIADO AO CLIENTE
                  </th>
                  <th colSpan={2} className="p-2 border-r border-b text-center bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold">
                    OBS. ANALISTA<br/><span className="text-[9px] font-normal">16/07/2026</span>
                  </th>
                  <th colSpan={2} className="p-2 border-r border-b text-center bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                    OBS. CS<br/><span className="text-[9px] font-normal">00/00/2026</span>
                  </th>

                  <th rowSpan={2} className="p-2 text-center w-16">AÇÕES</th>
                </tr>
                <tr className="border-b bg-muted/40 text-center text-[10px] font-semibold text-muted-foreground">
                  <th className="p-2 border-r">SIM/NÃO</th>
                  <th className="p-2 border-r">SOLICITAÇÃO</th>
                  <th className="p-2 border-r">DATA</th>
                  <th className="p-2 border-r">FERRAMENTA</th>
                  <th className="p-2 border-r">DATA</th>
                </tr>
              </thead>
              <tbody>
                {debitoFiltrados.map((r, idx) => {
                  const temDebitoOuOmissao = r.omissao === "SIM" || (r.debitos && r.debitos !== "—");
                  return (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40 align-middle">
                      <td className="p-2 text-center tabular-nums border-r text-muted-foreground">{r.ord || idx + 1}</td>
                      <td className="p-2 font-bold text-center tabular-nums border-r">{r.codigo || "—"}</td>
                      <td className={cn(
                        "p-2 font-bold border-r transition-colors",
                        temDebitoOuOmissao ? "bg-amber-300 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100" : "text-foreground"
                      )}>
                        {r.empresa}
                      </td>
                      <td className="p-2 text-center tabular-nums border-r text-muted-foreground">{r.cnpjCpf || "—"}</td>
                      <td className="p-2 text-center font-bold border-r">{r.tipo || "C/M"}</td>
                      
                      <td className="p-2 border-r text-center font-semibold text-foreground max-w-md break-words">
                        {r.debitos || "—"}
                      </td>

                      <td className="p-2 text-center font-bold border-r">
                        <span className={r.omissao === "SIM" ? "text-destructive font-extrabold" : "text-foreground"}>
                          {r.omissao}
                        </span>
                      </td>

                      <td className="p-2 text-center font-bold border-r">
                        <span className={r.enviadoCliente === "SIM" ? "text-success font-extrabold" : "text-muted-foreground"}>
                          {r.enviadoCliente}
                        </span>
                      </td>

                      {/* OBS. ANALISTA */}
                      <td className="p-2 text-center border-r font-semibold tabular-nums">
                        {r.obsAnalistaSolicitacao || "—"}
                      </td>
                      <td className="p-2 text-center border-r tabular-nums text-muted-foreground">
                        {r.obsAnalistaData || "—"}
                      </td>

                      {/* OBS. CS */}
                      <td className="p-2 text-center border-r text-muted-foreground">
                        {r.obsCsFerramenta || "—"}
                      </td>
                      <td className="p-2 text-center border-r font-bold text-foreground">
                        {r.obsCsData || "—"}
                      </td>

                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => setEditingDebito(r)}
                            title="Editar Espelho de Débito"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteEspelhoDebito(r.id)}
                            title="Excluir Espelho de Débito"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {debitoFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-sm text-muted-foreground">
                      Nenhum registro de Espelho de Débito encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1">
            <span>
              Mostrando <strong>{debitoFiltrados.length}</strong> de <strong>{debitoCompletos.length}</strong> empresas de Espelho de Débito
            </span>
          </div>
        </div>
      ) : filtroTipo === "DCTFWeb" ? (
        /* RENDERIZAÇÃO: DCTFWEB */
        <div className="space-y-6">
          {/* Cards de Resumo DCTFWeb */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="surface-panel flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Empresas</p>
                <p className="text-2xl font-bold tabular-nums">{informacoesCarteira.totalEmpresas}</p>
              </div>
            </div>

            <div className="surface-panel flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conferidos (Analista)</p>
                <p className="text-2xl font-bold tabular-nums text-success">
                  {dctfCompletos.filter((r) => r.conferidoAnalista === "CONFERIDO").length}
                </p>
              </div>
            </div>

            <div className="surface-panel flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revisados (Supervisão)</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {dctfCompletos.filter((r) => r.revisadoSupervisao === "REVISADO").length}
                </p>
              </div>
            </div>

            <div className="surface-panel flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Com Movimento (C/M)</p>
                <p className="text-2xl font-bold tabular-nums">
                  {dctfCompletos.filter((r) => r.tipo === "C/M").length}
                </p>
              </div>
            </div>
          </div>

          {/* Destaque da Carteira Selecionada */}
          <div className="surface-panel p-4 rounded-xl border bg-card/60 backdrop-blur space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Carteira em Destaque
                  </p>
                  <h3 className="text-base font-bold text-foreground">
                    {informacoesCarteira.nome}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <div>
                    <span className="text-[10px] uppercase font-medium text-muted-foreground block">
                      Supervisor(a)
                    </span>
                    <span className="font-bold text-foreground">
                      {informacoesCarteira.supervisores.join(", ") || "Não atribuído"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-info" />
                  <div>
                    <span className="text-[10px] uppercase font-medium text-muted-foreground block">
                      Analista(s)
                    </span>
                    <span className="font-bold text-foreground">
                      {informacoesCarteira.analistas.join(", ") || "Não atribuído"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-success" />
                  <div>
                    <span className="text-[10px] uppercase font-medium text-muted-foreground block">
                      Empresas Vinc.
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {informacoesCarteira.totalEmpresas} empresas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Abas de Seleção de Carteiras */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setCarteiraFiltro("todas")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  carteiraFiltro === "todas"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                Todas as Carteiras ({dctfCompletos.length})
              </button>
              {carteirasDisponiveis.map((cart) => {
                const qtd = dctfCompletos.filter((r) => (r.carteira || "Sem Carteira") === cart).length;
                return (
                  <button
                    key={cart}
                    type="button"
                    onClick={() => setCarteiraFiltro(cart)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs transition-all",
                      carteiraFiltro === cart
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {cart} ({qtd})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="surface-panel flex flex-wrap items-center gap-2 p-3">
            <div className="relative min-w-60 flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar por código, empresa, CNPJ ou analista..."
                className="pl-8 pr-8"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Limpar pesquisa"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={carteiraFiltro}
              onChange={(e) => setCarteiraFiltro(e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm font-medium"
            >
              <option value="todas">Todas as Carteiras</option>
              {carteirasDisponiveis.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Tabela Planilha DCTFWeb */}
          <div className="surface-panel overflow-x-auto">
            <table className="w-full min-w-[1600px] text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 text-center font-bold text-[11px] uppercase tracking-wide text-foreground">
                  <th rowSpan={2} className="p-2 border-r text-center w-12">ORD</th>
                  <th rowSpan={2} className="p-2 border-r text-center w-14">CÓD.</th>
                  <th rowSpan={2} className="p-2 border-r text-left min-w-[200px]">EMPRESA</th>
                  <th rowSpan={2} className="p-2 border-r text-center min-w-[140px]">CNPJ</th>
                  <th rowSpan={2} className="p-2 border-r text-center w-14">TIPO</th>
                  <th rowSpan={2} className="p-2 border-r text-center w-16">REINF</th>
                  <th rowSpan={2} className="p-2 border-r text-center w-16">eSocial</th>
                  
                  <th colSpan={3} className="p-2 border-r border-b text-center bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold">
                    NOTA FISCAL
                  </th>
                  <th colSpan={1} className="p-2 border-r border-b text-center bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold">
                    PRAZO (Competência)
                  </th>
                  <th colSpan={1} className="p-2 border-r border-b text-center bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                    DOC. SALVO
                  </th>
                  <th colSpan={2} className="p-2 border-r border-b text-center bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold">
                    DARF PREVIDENCIÁRIO
                  </th>

                  <th rowSpan={2} className="p-2 border-r text-left min-w-[150px]">OBSERVAÇÃO</th>
                  <th rowSpan={2} className="p-2 text-center w-16">AÇÕES</th>
                </tr>
                <tr className="border-b bg-muted/40 text-center text-[10px] font-semibold text-muted-foreground">
                  <th className="p-2 border-r">CPRB</th>
                  <th className="p-2 border-r">RET. INSS</th>
                  <th className="p-2 border-r">RET. CSRF</th>
                  <th className="p-2 border-r">TRANSMISSÃO / PUBLICAÇÃO</th>
                  <th className="p-2 border-r">RECIBO</th>
                  <th className="p-2 border-r">CONFERIDO (Analista)</th>
                  <th className="p-2 border-r">REVISADO (Supervisão)</th>
                </tr>
              </thead>
              <tbody>
                {dctfFiltrados.map((r, idx) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40 align-middle">
                    <td className="p-2 text-center tabular-nums border-r text-muted-foreground">{r.ord || idx + 1}</td>
                    <td className="p-2 font-bold text-center tabular-nums border-r">{r.codigo || "—"}</td>
                    <td className="p-2 font-bold text-foreground border-r">{r.empresa}</td>
                    <td className="p-2 text-center tabular-nums border-r text-muted-foreground">{r.cnpj || "—"}</td>
                    <td className="p-2 text-center font-bold border-r">{r.tipo || "C/M"}</td>
                    
                    <td className="p-2 text-center font-bold border-r">
                      <span className={r.reinf === "SIM" ? "text-success font-extrabold" : "text-destructive"}>
                        {r.reinf}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold border-r">
                      <span className={r.eSocial === "SIM" ? "text-success font-extrabold" : "text-destructive"}>
                        {r.eSocial}
                      </span>
                    </td>

                    <td className="p-2 text-center border-r font-bold text-destructive">{r.nfCprb}</td>
                    <td className="p-2 text-center border-r font-bold text-destructive">{r.nfRetInss}</td>
                    <td className="p-2 text-center border-r font-bold text-destructive">{r.nfRetCsrf}</td>

                    <td className="p-2 text-center border-r tabular-nums font-semibold">
                      {r.transmissaoPublicacao || "—"}
                    </td>

                    <td className="p-2 text-center border-r tabular-nums font-semibold">
                      {r.reciboDocSalvo || "—"}
                    </td>

                    <td className="p-2 text-center border-r font-bold">
                      <span className={r.conferidoAnalista === "CONFERIDO" ? "text-success" : "text-destructive"}>
                        {r.conferidoAnalista}
                      </span>
                    </td>
                    <td className="p-2 text-center border-r font-bold">
                      <span className={r.revisadoSupervisao === "REVISADO" ? "text-success" : "text-destructive"}>
                        {r.revisadoSupervisao}
                      </span>
                    </td>

                    <td className="p-2 border-r text-muted-foreground">{r.observacao || "—"}</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => setEditingDCTF(r)}
                          title="Editar DCTFWeb"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteDCTFWeb(r.id)}
                          title="Excluir DCTFWeb"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Outras obrigações padrão */
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
              {obrigacoes
                .filter((o) => filtroTipo === "Todos" || o.tipo === filtroTipo)
                .map((o) => (
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
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Edição DCTFWeb */}
      {editingDCTF && (
        <EditDCTFWebDialog
          item={editingDCTF}
          onClose={() => setEditingDCTF(null)}
        />
      )}

      {/* Modal de Edição Espelho de Débito */}
      {editingDebito && (
        <EditEspelhoDebitoDialog
          item={editingDebito}
          onClose={() => setEditingDebito(null)}
        />
      )}
    </div>
  );
}

function EditDCTFWebDialog({ item, onClose }: { item: RegDCTFWeb; onClose: () => void }) {
  const [form, setForm] = useState<RegDCTFWeb>(item);
  const set = <K extends keyof RegDCTFWeb>(field: K, value: RegDCTFWeb[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDCTFWeb(item.id, form);
    toast.success("DCTFWeb atualizada com sucesso!");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Editar DCTFWeb — {item.empresa}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ORD</Label>
              <Input
                type="number"
                min={1}
                value={form.ord}
                onChange={(e) => set("ord", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Empresa</Label>
              <Input value={form.empresa} onChange={(e) => set("empresa", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cód. Domínio</Label>
              <Input value={form.codigo} onChange={(e) => set("codigo", e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2 border-t pt-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" className="gap-1.5 text-xs">
              <CheckCircle2 className="h-4 w-4" /> Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditEspelhoDebitoDialog({ item, onClose }: { item: RegEspelhoDebito; onClose: () => void }) {
  const [form, setForm] = useState<RegEspelhoDebito>(item);
  const set = <K extends keyof RegEspelhoDebito>(field: K, value: RegEspelhoDebito[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEspelhoDebito(item.id, form);
    toast.success("Espelho de Débito atualizado!");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Editar Espelho de Débito — {item.empresa}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ORD.</Label>
              <Input
                type="number"
                min={1}
                value={form.ord}
                onChange={(e) => set("ord", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Empresa</Label>
              <Input value={form.empresa} onChange={(e) => set("empresa", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cód. Domínio</Label>
              <Input value={form.codigo} onChange={(e) => set("codigo", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">CNPJ / CPF</Label>
              <Input value={form.cnpjCpf} onChange={(e) => set("cnpjCpf", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo", v as "C/M" | "S/M")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C/M">C/M (Com Movimento)</SelectItem>
                  <SelectItem value="S/M">S/M (Sem Movimento)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Omissão</Label>
              <Select value={form.omissao} onValueChange={(v) => set("omissao", v as "SIM" | "NÃO" | "—")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NÃO">NÃO</SelectItem>
                  <SelectItem value="—">—</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Débitos</Label>
              <Input value={form.debitos} onChange={(e) => set("debitos", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Enviado Ao Cliente</Label>
              <Select value={form.enviadoCliente} onValueChange={(v) => set("enviadoCliente", v as "SIM" | "NÃO" | "—")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NÃO">NÃO</SelectItem>
                  <SelectItem value="—">—</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Obs. Analista
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Solicitação</Label>
                <Input
                  value={form.obsAnalistaSolicitacao}
                  onChange={(e) => set("obsAnalistaSolicitacao", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Data</Label>
                <Input
                  value={form.obsAnalistaData}
                  onChange={(e) => set("obsAnalistaData", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Obs. CS
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Ferramenta</Label>
                <Input
                  value={form.obsCsFerramenta}
                  onChange={(e) => set("obsCsFerramenta", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Data / Status CS</Label>
                <Input
                  value={form.obsCsData}
                  onChange={(e) => set("obsCsData", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t pt-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" className="gap-1.5 text-xs">
              <CheckCircle2 className="h-4 w-4" /> Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
