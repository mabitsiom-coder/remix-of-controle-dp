import { useMemo, useState, useRef, useEffect } from "react";
import {
  Briefcase,
  Building2,
  Check,
  Edit2,
  Search,
  X,
  Clock,
  Sparkles,
  Maximize2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEmpresas } from "@/lib/empresas-store";
import { useCadastros } from "@/lib/cadastros-store";
import { useGrupos } from "@/lib/grupos-store";
import { useAuth } from "@/lib/auth-store";
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
  atualizadoPor?: string | undefined;
  atualizadoEm?: string | undefined;
};

type EditableCellProps = {
  value: string;
  placeholder?: string | undefined;
  multiline?: boolean | undefined;
  onSave: (val: string) => void;
  saving?: boolean | undefined;
  tooltipText?: string | undefined;
  onExpand?: (() => void) | undefined;
};

function InlineEditableCell({
  value,
  placeholder = "Clique para adicionar...",
  multiline = false,
  onSave,
  saving = false,
  tooltipText,
  onExpand,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleBlur = () => {
    setEditing(false);
    if (tempValue !== value) {
      onSave(tempValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setTempValue(value);
      setEditing(false);
    } else if (e.key === "Enter" && (!multiline || e.ctrlKey)) {
      e.preventDefault();
      setEditing(false);
      if (tempValue !== value) {
        onSave(tempValue);
      }
    }
  };

  if (editing) {
    return (
      <div className="relative w-full">
        {multiline ? (
          <Textarea
            ref={inputRef as any}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            rows={2}
            className="w-full text-xs p-1.5 min-h-[44px] bg-background border-primary shadow-xs focus:ring-1 focus:ring-primary"
            placeholder={placeholder}
          />
        ) : (
          <Input
            ref={inputRef as any}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-7 text-xs px-1.5 py-0.5 bg-background border-primary shadow-xs focus:ring-1 focus:ring-primary"
            placeholder={placeholder}
          />
        )}
        <div className="absolute right-1 bottom-1 text-[9px] text-muted-foreground bg-background/90 px-1 rounded pointer-events-none">
          {multiline ? "Ctrl+Enter ou clique fora" : "Enter salva"}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={() => setEditing(true)}
            className="group relative w-full cursor-pointer rounded px-1.5 py-1 transition-all hover:bg-primary/5 hover:border-primary/30 border border-transparent min-h-[28px] flex items-center justify-between"
          >
            <div className="flex-1 pr-4 overflow-hidden">
              {value ? (
                <span className="text-xs line-clamp-2 text-foreground/90 whitespace-pre-wrap">
                  {value}
                </span>
              ) : (
                <span className="text-[11px] italic text-muted-foreground/60">
                  {placeholder}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {saving && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              {onExpand && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand();
                  }}
                  className="p-0.5 hover:text-primary rounded"
                  title="Expandir texto completo"
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
              )}
              <Edit2 className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          </div>
        </TooltipTrigger>
        {tooltipText && (
          <TooltipContent side="top" className="text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{tooltipText}</span>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export function ParticularidadesCliente() {
  const { empresas } = useEmpresas();
  const { carteiras } = useCadastros();
  const { grupos } = useGrupos();
  const { registros } = useParticularidades();
  const { currentUser } = useAuth();

  const [busca, setBusca] = useState("");
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>(TODAS_CARTEIRAS);
  const [modalEdicao, setModalEdicao] = useState<LinhaParticularidade | null>(null);
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});

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
      const isSemMov = emp.tipo === "sem-movimento";
      return {
        empresaId: emp.id,
        codigo: emp.codigoDominio || emp.id,
        empresa: emp.nome,
        carteira: carteiraDaEmpresa(emp),
        analista: emp.analista || "—",
        supervisor: emp.supervisor || "—",
        grupos: reg?.grupos || grupoDaEmpresa.get(emp.id) || "—",
        informacoes: reg?.informacoes || "",
        folhaPagamento: isSemMov ? "Sem Movimento" : (reg?.folhaPagamento || emp.particularidades?.fechamento || ""),
        observacao: reg?.observacao || "",
        atualizadoPor: reg?.atualizadoPor,
        atualizadoEm: reg?.atualizadoEm,
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

  const salvarCampoInline = (empresaId: string, campo: string, valor: string, empresaNome: string) => {
    setSavingRows((prev) => ({ ...prev, [empresaId]: true }));
    try {
      const usuarioLogado = currentUser.nome || "Analista DP";
      salvarParticularidade(
        empresaId,
        {
          [campo]: valor,
        },
        usuarioLogado
      );
      toast.success(`Alteração salva com sucesso em "${empresaNome}".`, { duration: 2000 });
    } catch {
      toast.error("Não foi possível salvar a alteração. Tente novamente.");
    } finally {
      setTimeout(() => {
        setSavingRows((prev) => ({ ...prev, [empresaId]: false }));
      }, 500);
    }
  };

  const salvarModalEdicao = () => {
    if (!modalEdicao) return;
    const usuarioLogado = currentUser.nome || "Analista DP";
    salvarParticularidade(
      modalEdicao.empresaId,
      {
        grupos: modalEdicao.grupos === "—" ? "" : modalEdicao.grupos,
        informacoes: modalEdicao.informacoes,
        folhaPagamento: modalEdicao.folhaPagamento,
        observacao: modalEdicao.observacao,
      },
      usuarioLogado
    );
    toast.success(`Particularidades de "${modalEdicao.empresa}" salvas com sucesso!`);
    setModalEdicao(null);
  };

  return (
    <div className="space-y-6">
      {/* Destaque e abas por carteira */}
      <div className="surface-panel space-y-3 rounded-xl border bg-card/60 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Carteira em Destaque
              </p>
              <h3 className="text-base font-bold text-foreground">
                {carteiraFiltro === TODAS_CARTEIRAS ? "Todas as Carteiras" : carteiraFiltro}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 font-semibold text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Edição direta na célula ativada
            </span>
            <div className="flex items-center gap-1 font-bold text-foreground">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span className="tabular-nums">{linhas.length} empresas</span>
            </div>
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

      {/* Busca e Seletor */}
      <div className="surface-panel flex flex-wrap items-center gap-2 p-3 shadow-sm">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por código, empresa, grupo, analista ou informação..."
            className="pl-8 pr-8 text-xs"
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
          className="h-9 rounded-md border bg-background px-2 text-xs font-medium focus:ring-1 focus:ring-primary"
        >
          <option value={TODAS_CARTEIRAS}>Todas as Carteiras</option>
          {carteirasDisponiveis.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela Estilo Planilha com Edição Direta */}
      <div className="surface-panel overflow-x-auto shadow-sm">
        <table className="w-full min-w-[1250px] border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/40 text-[11px] font-bold uppercase tracking-wide text-foreground">
              <th className="w-14 border-r p-2 text-center">Cód.</th>
              <th className="min-w-[210px] border-r p-2 text-left">Empresas</th>
              <th className="min-w-[140px] border-r p-2 text-left">Grupos</th>
              <th className="min-w-[280px] border-r p-2 text-left">
                Informações <span className="text-[10px] font-normal text-muted-foreground lowercase">(clique para editar)</span>
              </th>
              <th className="min-w-[240px] border-r p-2 text-left">
                Folha de Pagamento <span className="text-[10px] font-normal text-muted-foreground lowercase">(clique para editar)</span>
              </th>
              <th className="min-w-[220px] border-r p-2 text-left">
                Observação <span className="text-[10px] font-normal text-muted-foreground lowercase">(clique para editar)</span>
              </th>
              <th className="w-16 p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Nenhuma empresa encontrada com os filtros selecionados.
                </td>
              </tr>
            )}
            {filtradas.map((l) => {
              const tooltipInfo = l.atualizadoEm
                ? `Última atualização: ${l.atualizadoEm} por ${l.atualizadoPor || "Sistema"}`
                : undefined;

              return (
                <tr key={l.empresaId} className="align-top hover:bg-muted/30 transition-colors">
                  <td className="border-r p-2 text-center font-bold tabular-nums text-muted-foreground">
                    {l.codigo}
                  </td>
                  <td className="border-r p-2">
                    <p className="font-bold text-foreground">{l.empresa}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {l.carteira} · {l.analista}
                    </p>
                  </td>
                  <td className="border-r p-1.5">
                    <InlineEditableCell
                      value={l.grupos === "—" ? "" : l.grupos}
                      placeholder="—"
                      onSave={(val) => salvarCampoInline(l.empresaId, "grupos", val, l.empresa)}
                      saving={savingRows[l.empresaId]}
                      tooltipText={tooltipInfo}
                    />
                  </td>
                  <td className="border-r p-1.5">
                    <InlineEditableCell
                      value={l.informacoes}
                      placeholder="Particularidades gerais..."
                      multiline
                      onSave={(val) => salvarCampoInline(l.empresaId, "informacoes", val, l.empresa)}
                      saving={savingRows[l.empresaId]}
                      tooltipText={tooltipInfo}
                      onExpand={() => setModalEdicao(l)}
                    />
                  </td>
                  <td className="border-r p-1.5">
                    <InlineEditableCell
                      value={l.folhaPagamento}
                      placeholder="Instrução de folha..."
                      multiline
                      onSave={(val) => salvarCampoInline(l.empresaId, "folhaPagamento", val, l.empresa)}
                      saving={savingRows[l.empresaId]}
                      tooltipText={tooltipInfo}
                      onExpand={() => setModalEdicao(l)}
                    />
                  </td>
                  <td className="border-r p-1.5">
                    <InlineEditableCell
                      value={l.observacao}
                      placeholder="Observação..."
                      multiline
                      onSave={(val) => salvarCampoInline(l.empresaId, "observacao", val, l.empresa)}
                      saving={savingRows[l.empresaId]}
                      tooltipText={tooltipInfo}
                      onExpand={() => setModalEdicao(l)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => setModalEdicao(l)}
                      title="Editar particularidades completas"
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição Ampliada */}
      {modalEdicao && (
        <Dialog open={Boolean(modalEdicao)} onOpenChange={(open) => !open && setModalEdicao(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Particularidades — {modalEdicao.empresa}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {modalEdicao.carteira} · Analista: {modalEdicao.analista}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Grupos</label>
                <Input
                  value={modalEdicao.grupos === "—" ? "" : modalEdicao.grupos}
                  onChange={(e) => setModalEdicao({ ...modalEdicao, grupos: e.target.value })}
                  placeholder="Grupo ou classificação..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Informações Gerais (Regras Específicas / Fechamento)
                </label>
                <Textarea
                  rows={3}
                  value={modalEdicao.informacoes}
                  onChange={(e) => setModalEdicao({ ...modalEdicao, informacoes: e.target.value })}
                  placeholder="Informações específicas e procedimentos da empresa..."
                  className="text-xs font-normal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Folha de Pagamento (Prazos e Particularidades de Folha)
                </label>
                <Textarea
                  rows={2}
                  value={modalEdicao.folhaPagamento}
                  onChange={(e) => setModalEdicao({ ...modalEdicao, folhaPagamento: e.target.value })}
                  placeholder="Ex: Fechamento padrão até dia 20 de cada mês..."
                  className="text-xs font-normal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Observações Adicionais
                </label>
                <Textarea
                  rows={3}
                  value={modalEdicao.observacao}
                  onChange={(e) => setModalEdicao({ ...modalEdicao, observacao: e.target.value })}
                  placeholder="Observações complementares..."
                  className="text-xs font-normal"
                />
              </div>
            </div>

            {modalEdicao.atualizadoEm && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 border-t pt-2">
                <Clock className="h-3 w-3" />
                Última atualização: {modalEdicao.atualizadoEm} por {modalEdicao.atualizadoPor || "Sistema"}
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setModalEdicao(null)} className="text-xs">
                Cancelar
              </Button>
              <Button size="sm" onClick={salvarModalEdicao} className="text-xs gap-1.5">
                <Check className="h-4 w-4" /> Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
