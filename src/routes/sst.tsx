import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import {
  Trash2,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Building2,
  Edit2,
  CheckCircle2,
  Briefcase,
  UserCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
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
import { NovoEventoSSTDialog } from "@/components/novo-evento-sst-dialog";
import { ImportarSSTDialog } from "@/components/importar-sst-dialog";
import { useRegSST, deleteRegSST, updateRegSST, type RegSST } from "@/lib/sst-store";
import { useEmpresas } from "@/lib/empresas-store";
import { useCadastros } from "@/lib/cadastros-store";
import {
  carteiraDaEmpresa,
  listarNomesCarteiras,
  normalizarCarteira,
} from "@/lib/carteiras-core";
import { cn } from "@/lib/utils";

// ─── Componente de célula com select inline ───────────────────────────────────
function InlineSelect({
  value,
  options,
  onChange,
  colorMap,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  colorMap?: Record<string, string>;
}) {
  const color = colorMap?.[value] ?? "";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-center text-xs font-bold",
        "cursor-pointer transition-all hover:border-border hover:bg-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40",
        color,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Componente de célula com input de texto inline ──────────────────────────
function InlineInput({
  value,
  onBlurSave,
  placeholder,
  type = "text",
}: {
  value: string;
  onBlurSave: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const [local, setLocal] = useState(value);
  const prevRef = useRef(value);

  // Sync when row changes
  if (prevRef.current !== value) {
    prevRef.current = value;
    setLocal(value);
  }

  return (
    <input
      type={type}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onBlurSave(local);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setLocal(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
      placeholder={placeholder ?? "—"}
      className={cn(
        "w-full min-w-[60px] rounded-md border border-transparent bg-transparent px-1 py-0.5 text-center text-xs",
        "transition-all hover:border-border hover:bg-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-background",
      )}
    />
  );
}

export const Route = createFileRoute("/sst")({
  head: () => ({
    meta: [
      { title: "SST — Saúde e Segurança do Trabalho | DP Control" },
      {
        name: "description",
        content: "Controle de programas LTCAT, PCMSO, PGR, LTIP, DIR, exames e grau de risco por empresa.",
      },
      { property: "og:title", content: "SST — DP Control" },
      { property: "og:description", content: "Matriz de controle de SST e programas ocupacionais por carteira." },
    ],
  }),
  component: SST,
});

function SST() {
  const { registros } = useRegSST();
  const { empresas } = useEmpresas();
  const { carteiras } = useCadastros();

  const [busca, setBusca] = useState("");
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>("todas");
  const [editingItem, setEditingItem] = useState<RegSST | null>(null);

  // Sincronizar todos os registros de SST combinando com as empresas cadastradas no sistema
  const registrosCompletos: RegSST[] = useMemo(() => {
    if (empresas.length > 0) {
      const mapaMatrix = new Map(registros.map((r) => [r.codigo || r.id, r]));
      return empresas.map((emp) => {
        const cod = emp.codigoDominio || emp.id;
        const mat = mapaMatrix.get(cod) || mapaMatrix.get(emp.nome);
        if (mat) {
          return {
            ...mat,
            codigo: cod,
            empresa: emp.nome,
            carteira: carteiraDaEmpresa(emp),
            analista: emp.analista || mat.analista || "Não atribuído",
            supervisor: emp.supervisor || mat.supervisor || "Não atribuído",
            qtdFunc: emp.funcionarios || mat.qtdFunc || 0,
          };
        }
        return {
          id: `sst-${emp.id || cod}`,
          codigo: cod,
          empresa: emp.nome,
          carteira: carteiraDaEmpresa(emp),
          analista: emp.analista || "Não atribuído",
          supervisor: emp.supervisor || "Não atribuído",
          sstNaMabit: "SIM",
          grauDeRisco: "1",
          qtdFunc: emp.funcionarios || 0,
          inicioContrato: "—",
          examesVencidos: "NÃO",
          possuiProgramas: "SIM",
          ltcat: "Indeterminado",
          pcmso: "—",
          pgr: "—",
          ltip: "—",
          dir: "—",
          linkProgramas: "",
          obsAnalista: "",
          obsCS: "",
        };
      });
    }
    return registros;
  }, [empresas, registros]);

  // Lista de carteiras disponíveis
  const carteirasDisponiveis = useMemo(
    () => listarNomesCarteiras(empresas, carteiras),
    [carteiras, empresas],
  );

  // Estatísticas dinâmicas — calculadas DEPOIS de filtradosPorCarteira (definido abaixo)
  // Serão referenciadas nos KPI cards usando filtradosPorCarteira

  // Registros filtrados apenas por carteira (alimenta os KPI cards e o painel de info)
  const filtradosPorCarteira = useMemo(() => {
    if (!carteiraFiltro || carteiraFiltro === "todas") return registrosCompletos;
    const filtroNorm = normalizarCarteira(carteiraFiltro);
    return registrosCompletos.filter((r) => normalizarCarteira(r.carteira) === filtroNorm);
  }, [registrosCompletos, carteiraFiltro]);

  // Filtragem combinada: carteira + busca (alimenta a tabela)
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return filtradosPorCarteira;

    // Com busca ativa, pesquisar apenas dentro da carteira selecionada
    return filtradosPorCarteira.filter((r) => {
      const cod = String(r.codigo ?? "").toLowerCase();
      const emp = String(r.empresa ?? "").toLowerCase();
      const ana = String(r.analista ?? "").toLowerCase();
      const sup = String(r.supervisor ?? "").toLowerCase();
      const obsA = String(r.obsAnalista ?? "").toLowerCase();
      const obsC = String(r.obsCS ?? "").toLowerCase();

      return (
        cod.includes(q) ||
        emp.includes(q) ||
        ana.includes(q) ||
        sup.includes(q) ||
        obsA.includes(q) ||
        obsC.includes(q)
      );
    });
  }, [filtradosPorCarteira, busca]);

  // KPI cards — sempre refletem a carteira ativa
  const totalEmpresas = filtradosPorCarteira.length;
  const sstNaMabit = filtradosPorCarteira.filter((r) => r.sstNaMabit === "SIM").length;
  const examesVencidos = filtradosPorCarteira.filter((r) => r.examesVencidos === "SIM").length;
  const comProgramas = filtradosPorCarteira.filter((r) => r.possuiProgramas === "SIM").length;

  // Dados da carteira selecionada em destaque
  const informacoesCarteira = useMemo(() => {
    const supUnicos = Array.from(new Set(filtradosPorCarteira.map((r) => r.supervisor).filter(Boolean)));
    const anaUnicos = Array.from(new Set(filtradosPorCarteira.map((r) => r.analista).filter(Boolean)));
    const totalVidas = filtradosPorCarteira.reduce((sum, r) => sum + (r.qtdFunc || 0), 0);
    if (carteiraFiltro === "todas") {
      return {
        nome: "Todas as Carteiras",
        supervisores: supUnicos,
        analistas: anaUnicos,
        totalEmpresas: filtradosPorCarteira.length,
        totalVidas,
      };
    }
    return {
      nome: carteiraFiltro,
      supervisores: supUnicos.length > 0 ? supUnicos : ["ADRIELLE"],
      analistas: anaUnicos.length > 0 ? anaUnicos : ["SIMEANE"],
      totalEmpresas: filtradosPorCarteira.length,
      totalVidas,
    };
  }, [carteiraFiltro, filtradosPorCarteira]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SST — Saúde e Segurança do Trabalho"
        description="Controle de programas (LTCAT, PCMSO, PGR, LTIP, DIR), exames e graus de risco por empresa"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ImportarSSTDialog />
            <NovoEventoSSTDialog />
          </div>
        }
      />

      {/* Cards de Resumo Operacional */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="surface-panel flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total de Empresas</p>
            <p className="text-2xl font-bold tabular-nums">{totalEmpresas}</p>
          </div>
        </div>

        <div className="surface-panel flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">SST na Mábit</p>
            <p className="text-2xl font-bold tabular-nums">{sstNaMabit}</p>
          </div>
        </div>

        <div className="surface-panel flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Com Exames Vencidos</p>
            <p className="text-2xl font-bold tabular-nums">{examesVencidos}</p>
          </div>
        </div>

        <div className="surface-panel flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Com Programas</p>
            <p className="text-2xl font-bold tabular-nums">{comProgramas}</p>
          </div>
        </div>
      </div>

      {/* Destaque da Carteira Selecionada, Supervisor e Analistas */}
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
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
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

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-warning" />
              <div>
                <span className="text-[10px] uppercase font-medium text-muted-foreground block">
                  Total Vidas / Func.
                </span>
                <span className="font-bold text-foreground tabular-nums">
                  {informacoesCarteira.totalVidas} funcionários
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Abas por Carteira */}
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
            Todas as Carteiras ({registrosCompletos.length})
          </button>
          {carteirasDisponiveis.map((cart) => {
            // cart já vem normalizado de listarNomesCarteiras
            const cartNorm = normalizarCarteira(cart);
            const qtd = registrosCompletos.filter((r) => normalizarCarteira(r.carteira) === cartNorm).length;
            const isAtiva = normalizarCarteira(carteiraFiltro) === cartNorm;
            return (
              <button
                key={cart}
                type="button"
                onClick={() => setCarteiraFiltro(cart)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs transition-all",
                  isAtiva
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
            placeholder="Pesquisar por código, empresa, analista ou observações..."
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
          onChange={(e) => setCarteiraFiltro(normalizarCarteira(e.target.value) === normalizarCarteira("todas") ? "todas" : normalizarCarteira(e.target.value))}
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

      {/* Tabela de Matriz SST */}
      <div className="surface-panel overflow-x-auto">
        <table className="w-full min-w-[1600px] text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/30 text-center font-bold text-[11px] uppercase tracking-wide text-foreground">
              <th rowSpan={2} className="p-2 border-r text-center w-14">Cód</th>
              <th rowSpan={2} className="p-2 border-r text-left min-w-[180px]">Empresa</th>
              <th rowSpan={2} className="p-2 border-r text-center">SST NA MÁBIT<br/><span className="text-[10px] font-normal text-muted-foreground">Sim/Não</span></th>
              <th rowSpan={2} className="p-2 border-r text-center">Grau de Risco</th>
              <th rowSpan={2} className="p-2 border-r text-center">QTD Func.</th>
              <th rowSpan={2} className="p-2 border-r text-center">Início do contrato</th>
              <th rowSpan={2} className="p-2 border-r text-center">Possui exames vencidos<br/><span className="text-[10px] font-normal text-muted-foreground">SIM/NÃO</span></th>
              <th rowSpan={2} className="p-2 border-r text-center">Possui programas<br/><span className="text-[10px] font-normal text-muted-foreground">SIM/NÃO</span></th>
              
              <th colSpan={6} className="p-2 border-r border-b text-center bg-muted/50 font-bold">
                Programas
              </th>
              
              <th rowSpan={2} className="p-2 border-r text-left min-w-[140px]">Obs.: Analista</th>
              <th rowSpan={2} className="p-2 border-r text-left min-w-[120px]">Obs.: CS</th>
              <th rowSpan={2} className="p-2 text-center w-16">Ações</th>
            </tr>
            <tr className="border-b bg-muted/40 text-center text-[10px] font-semibold text-muted-foreground">
              <th className="p-2 border-r">LTCAT<br/><span className="font-normal text-[9px]">Validade</span></th>
              <th className="p-2 border-r">PCMSO/PCMAT<br/><span className="font-normal text-[9px]">Validade</span></th>
              <th className="p-2 border-r">PGR<br/><span className="font-normal text-[9px]">Validade</span></th>
              <th className="p-2 border-r">LTIP<br/><span className="font-normal text-[9px]">Validade</span></th>
              <th className="p-2 border-r">DIR<br/><span className="font-normal text-[9px]">Validade</span></th>
              <th className="p-2 border-r">LINK</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r, idx) => {
              const save = (field: keyof RegSST, value: unknown) => {
                updateRegSST(r.id, { [field]: value } as Partial<RegSST>);
                toast.success(`Campo atualizado!`, { duration: 1500 });
              };

              return (
              <tr key={`${r.id}-${r.codigo}-${idx}`} className="border-b last:border-0 hover:bg-muted/30 align-middle group">
                <td className="p-2 font-semibold text-center tabular-nums border-r">{r.codigo || "—"}</td>
                <td className="p-2 font-bold text-foreground border-r">{r.empresa}</td>

                {/* SST na Mábit — Select inline */}
                <td className="p-1 text-center border-r">
                  <InlineSelect
                    value={r.sstNaMabit || "SIM"}
                    options={[
                      { value: "SIM", label: "SIM" },
                      { value: "NÃO", label: "NÃO" },
                    ]}
                    colorMap={{ SIM: "text-success", "NÃO": "text-destructive" }}
                    onChange={(v) => save("sstNaMabit", v)}
                  />
                </td>

                {/* Grau de Risco — Select inline */}
                <td className="p-1 text-center tabular-nums border-r">
                  <InlineSelect
                    value={r.grauDeRisco || "1"}
                    options={[
                      { value: "1", label: "1" },
                      { value: "2", label: "2" },
                      { value: "3", label: "3" },
                      { value: "4", label: "4" },
                    ]}
                    colorMap={{
                      "1": "text-success",
                      "2": "text-warning",
                      "3": "text-orange-500",
                      "4": "text-destructive",
                    }}
                    onChange={(v) => save("grauDeRisco", v)}
                  />
                </td>

                {/* Qtd Func — input inline */}
                <td className="p-1 text-center tabular-nums border-r">
                  <InlineInput
                    value={String(r.qtdFunc ?? 0)}
                    type="number"
                    onBlurSave={(v) => save("qtdFunc", Number(v))}
                  />
                </td>

                {/* Início Contrato — input inline */}
                <td className="p-1 text-center tabular-nums border-r">
                  <InlineInput
                    value={r.inicioContrato || ""}
                    placeholder="—"
                    onBlurSave={(v) => save("inicioContrato", v)}
                  />
                </td>

                {/* Exames Vencidos — Select inline */}
                <td className="p-1 text-center border-r">
                  <InlineSelect
                    value={r.examesVencidos || "NÃO"}
                    options={[
                      { value: "NÃO", label: "NÃO" },
                      { value: "SIM", label: "SIM" },
                      { value: "—", label: "—" },
                    ]}
                    colorMap={{ SIM: "text-destructive font-extrabold", "NÃO": "text-foreground" }}
                    onChange={(v) => save("examesVencidos", v)}
                  />
                </td>

                {/* Possui Programas — Select inline */}
                <td className="p-1 text-center border-r">
                  <InlineSelect
                    value={r.possuiProgramas || "SIM"}
                    options={[
                      { value: "SIM", label: "SIM" },
                      { value: "NÃO", label: "NÃO" },
                      { value: "—", label: "—" },
                    ]}
                    colorMap={{ SIM: "text-success", "NÃO": "text-destructive" }}
                    onChange={(v) => save("possuiProgramas", v)}
                  />
                </td>

                {/* Programas — inputs inline */}
                <td className="p-1 text-center border-r tabular-nums">
                  <InlineInput value={r.ltcat || ""} placeholder="—" onBlurSave={(v) => save("ltcat", v)} />
                </td>
                <td className="p-1 text-center border-r tabular-nums">
                  <InlineInput value={r.pcmso || ""} placeholder="—" onBlurSave={(v) => save("pcmso", v)} />
                </td>
                <td className="p-1 text-center border-r tabular-nums">
                  <InlineInput value={r.pgr || ""} placeholder="—" onBlurSave={(v) => save("pgr", v)} />
                </td>
                <td className="p-1 text-center border-r tabular-nums">
                  <InlineInput value={r.ltip || ""} placeholder="—" onBlurSave={(v) => save("ltip", v)} />
                </td>
                <td className="p-1 text-center border-r tabular-nums">
                  <InlineInput value={r.dir || ""} placeholder="—" onBlurSave={(v) => save("dir", v)} />
                </td>

                {/* Link Programas */}
                <td className="p-1 text-center border-r">
                  <div className="flex items-center gap-1">
                    <InlineInput
                      value={r.linkProgramas || ""}
                      placeholder="URL..."
                      onBlurSave={(v) => save("linkProgramas", v)}
                    />
                    {r.linkProgramas && (
                      <a
                        href={r.linkProgramas}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-primary hover:text-primary/80"
                        title="Abrir link"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </td>

                {/* Obs Analista — input inline */}
                <td className="p-1 border-r">
                  <InlineInput
                    value={r.obsAnalista || ""}
                    placeholder="Observação..."
                    onBlurSave={(v) => save("obsAnalista", v)}
                  />
                </td>

                {/* Obs CS — input inline */}
                <td className="p-1 border-r">
                  <InlineInput
                    value={r.obsCS || ""}
                    placeholder="Observação..."
                    onBlurSave={(v) => save("obsCS", v)}
                  />
                </td>

                {/* Ações */}
                <td className="p-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => setEditingItem(r)}
                      title="Editar em modal completo"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteRegSST(r.id)}
                      title="Excluir registro"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={17} className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum registro de SST encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição */}
      {editingItem && (
        <EditRegSSTDialog
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function EditRegSSTDialog({ item, onClose }: { item: RegSST; onClose: () => void }) {
  const [form, setForm] = useState<RegSST>(item);

  const set = <K extends keyof RegSST>(field: K, value: RegSST[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRegSST(item.id, form);
    toast.success("Registro de SST atualizado!");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Editar Registro SST — {item.empresa}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Empresa</Label>
              <Input
                value={form.empresa}
                onChange={(e) => set("empresa", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cód. Empresa</Label>
              <Input
                value={form.codigo}
                onChange={(e) => set("codigo", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">SST Na Mábit</Label>
              <Select value={form.sstNaMabit} onValueChange={(v) => set("sstNaMabit", v as "SIM" | "NÃO")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NÃO">NÃO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Grau de Risco</Label>
              <Select value={form.grauDeRisco} onValueChange={(v) => set("grauDeRisco", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Qtd. Funcionários</Label>
              <Input
                type="number"
                min={0}
                value={form.qtdFunc}
                onChange={(e) => set("qtdFunc", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Início do Contrato</Label>
              <Input
                value={form.inicioContrato}
                onChange={(e) => set("inicioContrato", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Possui Exames Vencidos</Label>
              <Select
                value={form.examesVencidos}
                onValueChange={(v) => set("examesVencidos", v as "SIM" | "NÃO" | "—")}
              >
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

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Possui Programas</Label>
              <Select
                value={form.possuiProgramas}
                onValueChange={(v) => set("possuiProgramas", v as "SIM" | "NÃO" | "—")}
              >
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
              Validade dos Programas
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">LTCAT</Label>
                <Input value={form.ltcat} onChange={(e) => set("ltcat", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">PCMSO/PCMAT</Label>
                <Input value={form.pcmso} onChange={(e) => set("pcmso", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">PGR</Label>
                <Input value={form.pgr} onChange={(e) => set("pgr", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">LTIP</Label>
                <Input value={form.ltip} onChange={(e) => set("ltip", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">DIR</Label>
                <Input value={form.dir} onChange={(e) => set("dir", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Link dos Programas</Label>
                <Input value={form.linkProgramas} onChange={(e) => set("linkProgramas", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Obs.: Analista</Label>
              <Input value={form.obsAnalista} onChange={(e) => set("obsAnalista", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Obs.: CS</Label>
              <Input value={form.obsCS} onChange={(e) => set("obsCS", e.target.value)} />
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
