import { useMemo, useState } from "react";
import { Briefcase, Building2, Check, Edit2, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEmpresas } from "@/lib/empresas-store";
import { useCadastros } from "@/lib/cadastros-store";
import { useGrupos } from "@/lib/grupos-store";
import {
  useParticularidades,
  salvarParticularidade,
  type RegParticularidade,
} from "@/lib/particularidades-store";
import {
  carteiraDaEmpresa,
  empresasDaCarteira,
  listarNomesCarteiras,
  TODAS_CARTEIRAS,
} from "@/lib/carteiras-core";
import { cn } from "@/lib/utils";

type LinhaParticularidade = {
  empresaId: string;
  codigo: string;
  empresa: string;
  carteira: string;
  analista: string;
  supervisor: string;
  grupos: string;
  informacoes: string;
  folhaPagamento: string;
  observacao: string;
};

export function ParticularidadesCliente() {
  const { empresas } = useEmpresas();
  const { carteiras } = useCadastros();
  const { grupos } = useGrupos();
  const { registros } = useParticularidades();

  const [busca, setBusca] = useState("");
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>(TODAS_CARTEIRAS);
  const [editando, setEditando] = useState<LinhaParticularidade | null>(null);

  const carteirasDisponiveis = useMemo(
    () => listarNomesCarteiras(empresas, carteiras),
    [empresas, carteiras],
  );

  const porEmpresa = useMemo(() => {
    const mapa = new Map<string, RegParticularidade>();
    for (const r of registros) mapa.set(r.empresaId, r);
    return mapa;
  }, [registros]);

  const grupoDaEmpresa = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const g of grupos) for (const id of g.empresaIds ?? []) mapa.set(id, g.nome);
    return mapa;
  }, [grupos]);

  // Fonte única: empresas ATIVAS da carteira selecionada
  const linhas: LinhaParticularidade[] = useMemo(() => {
    return empresasDaCarteira(empresas, carteiraFiltro).map((emp) => {
      const reg = porEmpresa.get(emp.id);
      return {
        empresaId: emp.id,
        codigo: emp.codigoDominio || emp.id,
        empresa: emp.nome,
        carteira: carteiraDaEmpresa(emp),
        analista: emp.analista || "—",
        supervisor: emp.supervisor || "—",
        grupos: reg?.grupos || grupoDaEmpresa.get(emp.id) || "—",
        informacoes: reg?.informacoes || "",
        folhaPagamento: reg?.folhaPagamento || emp.particularidades?.fechamento || "",
        observacao: reg?.observacao || "",
      };
    });
  }, [empresas, carteiraFiltro, porEmpresa, grupoDaEmpresa]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return linhas;
    return linhas.filter((l) =>
      [l.codigo, l.empresa, l.grupos, l.informacoes, l.folhaPagamento, l.observacao, l.analista]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [linhas, busca]);

  const totalPorCarteira = (cart: string) => empresasDaCarteira(empresas, cart).length;

  const salvarEdicao = () => {
    if (!editando) return;
    salvarParticularidade(editando.empresaId, {
      grupos: editando.grupos === "—" ? "" : editando.grupos,
      informacoes: editando.informacoes,
      folhaPagamento: editando.folhaPagamento,
      observacao: editando.observacao,
    });
    toast.success(`Particularidades de "${editando.empresa}" salvas.`);
    setEditando(null);
  };

  return (
    <div className="space-y-6">
      {/* Destaque e abas por carteira */}
      <div className="surface-panel space-y-3 rounded-xl border bg-card/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Carteira em Destaque
              </p>
              <h3 className="text-base font-bold">
                {carteiraFiltro === TODAS_CARTEIRAS ? "Todas as Carteiras" : carteiraFiltro}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Building2 className="h-4 w-4 text-success" />
            <span className="font-bold tabular-nums">{linhas.length} empresas</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setCarteiraFiltro(TODAS_CARTEIRAS)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              carteiraFiltro === TODAS_CARTEIRAS
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Todas as Carteiras ({empresas.length})
          </button>
          {carteirasDisponiveis.map((cart) => (
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
              {cart} ({totalPorCarteira(cart)})
            </button>
          ))}
        </div>
      </div>

      {/* Busca */}
      <div className="surface-panel flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por código, empresa, grupo ou informação..."
            className="pl-8 pr-8"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
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
          <option value={TODAS_CARTEIRAS}>Todas as Carteiras</option>
          {carteirasDisponiveis.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="surface-panel overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/30 text-[11px] font-bold uppercase tracking-wide">
              <th className="w-14 border-r p-2 text-center">Cód.</th>
              <th className="min-w-[220px] border-r p-2 text-left">Empresas</th>
              <th className="min-w-[150px] border-r p-2 text-left">Grupos</th>
              <th className="min-w-[280px] border-r p-2 text-left">Informações</th>
              <th className="min-w-[220px] border-r p-2 text-left">Folha de Pagamento</th>
              <th className="min-w-[200px] border-r p-2 text-left">Observação</th>
              <th className="w-16 p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Nenhuma empresa nesta carteira.
                </td>
              </tr>
            )}
            {filtradas.map((l) => (
              <tr key={l.empresaId} className="border-b last:border-0 align-top hover:bg-muted/40">
                <td className="border-r p-2 text-center font-bold tabular-nums">{l.codigo}</td>
                <td className="border-r p-2">
                  <p className="font-bold">{l.empresa}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {l.carteira} · {l.analista}
                  </p>
                </td>
                <td className="border-r p-2">{l.grupos || "—"}</td>
                <td className="border-r p-2 whitespace-pre-wrap">{l.informacoes || "—"}</td>
                <td className="border-r p-2 whitespace-pre-wrap">{l.folhaPagamento || "—"}</td>
                <td className="border-r p-2 whitespace-pre-wrap">{l.observacao || "—"}</td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => setEditando(l)}
                    title="Editar particularidades"
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edição */}
      {editando && (
        <div className="surface-panel space-y-3 p-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Editando particularidades
              </p>
              <h3 className="text-sm font-bold">{editando.empresa}</h3>
            </div>
            <button
              type="button"
              onClick={() => setEditando(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Grupos</label>
              <Input
                value={editando.grupos === "—" ? "" : editando.grupos}
                onChange={(e) => setEditando({ ...editando, grupos: e.target.value })}
                placeholder="Grupo ou classificação"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Folha de Pagamento</label>
              <Textarea
                rows={2}
                value={editando.folhaPagamento}
                onChange={(e) => setEditando({ ...editando, folhaPagamento: e.target.value })}
                placeholder="Informação específica da folha"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium">Informações</label>
              <Textarea
                rows={3}
                value={editando.informacoes}
                onChange={(e) => setEditando({ ...editando, informacoes: e.target.value })}
                placeholder="Particularidade ou informação relevante do cliente"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium">Observação</label>
              <Textarea
                rows={2}
                value={editando.observacao}
                onChange={(e) => setEditando({ ...editando, observacao: e.target.value })}
                placeholder="Observações complementares"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" className="text-xs" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button className="gap-1.5 text-xs" onClick={salvarEdicao}>
              <Check className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
