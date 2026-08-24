import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Briefcase,
  Building2,
  Users,
  UserCheck,
  ShieldAlert,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEmpresas } from "@/lib/empresas-store";
import { useCadastros } from "@/lib/cadastros-store";
import { useAuth } from "@/lib/auth-store";
import { canChangePortfolio } from "@/lib/permissoes";

export const Route = createFileRoute("/carteiras")({
  head: () => ({
    meta: [
      { title: "Visão por Carteiras — DP Control" },
      {
        name: "description",
        content: "Distribuição de empresas, analistas e supervisores por carteira de atendimento.",
      },
    ],
  }),
  component: CarteirasPage,
});

function CarteirasPage() {
  const { empresas } = useEmpresas();
  const { carteiras } = useCadastros();
  const { currentUser } = useAuth();
  const podeGerenciarCarteiras = canChangePortfolio(currentUser);

  const [busca, setBusca] = useState("");
  const [carteiraSelecionada, setCarteiraSelecionada] = useState<string | null>(null);

  const isOperacional = !podeGerenciarCarteiras;

  // Analistas visualizam exclusivamente a sua carteira
  const todasCarteirasNomes = isOperacional
    ? Array.from(new Set([...empresas.map((e) => e.carteira), currentUser.carteira].filter(Boolean) as string[]))
    : Array.from(new Set([...carteiras.map((c) => c.nome), ...empresas.map((e) => e.carteira)].filter(Boolean) as string[]));

  // Agrupar dados por carteira
  const carteirasAgrupadas = todasCarteirasNomes.map((nomeCarteira) => {
    const infoStore = carteiras.find((c) => c.nome === nomeCarteira);
    const empresasDaCarteira = empresas.filter(
      (e) =>
        e.carteira === nomeCarteira &&
        (busca === "" ||
          e.nome.toLowerCase().includes(busca.toLowerCase()) ||
          e.cnpj.includes(busca) ||
          e.analista.toLowerCase().includes(busca.toLowerCase()) ||
          e.supervisor.toLowerCase().includes(busca.toLowerCase())),
    );

    const totalEmpresasGeral = empresas.filter((e) => e.carteira === nomeCarteira).length;
    const totalFuncionarios = empresasDaCarteira.reduce((sum, e) => sum + (e.funcionarios || 0), 0);

    const analistasUnicos = Array.from(
      new Set(empresas.filter((e) => e.carteira === nomeCarteira).map((e) => e.analista)),
    ).filter(Boolean);

    const supervisoresUnicos = Array.from(
      new Set(empresas.filter((e) => e.carteira === nomeCarteira).map((e) => e.supervisor)),
    ).filter(Boolean);

    const ativas = empresasDaCarteira.filter((e) => e.status === "ativa").length;
    const atencao = empresasDaCarteira.filter((e) => e.status === "atencao").length;
    const atraso = empresasDaCarteira.filter((e) => e.status === "atraso").length;

    return {
      nome: nomeCarteira,
      descricao: infoStore?.descricao || "Carteira operacional de atendimento",
      categoria: infoStore?.categoria || "Geral",
      totalEmpresasGeral,
      empresas: empresasDaCarteira,
      totalFuncionarios,
      analistas: analistasUnicos,
      supervisores: supervisoresUnicos,
      ativas,
      atencao,
      atraso,
    };
  });

  const carteirasFiltradas = carteiraSelecionada
    ? carteirasAgrupadas.filter((c) => c.nome === carteiraSelecionada)
    : carteirasAgrupadas;

  // Escopo dos KPIs: respeita a carteira selecionada
  const empresasEscopo = carteiraSelecionada
    ? empresas.filter((e) => e.carteira === carteiraSelecionada)
    : empresas;
  const kpiCarteiras = carteiraSelecionada ? 1 : todasCarteirasNomes.length;
  const kpiVidas = empresasEscopo.reduce((sum, e) => sum + (e.funcionarios || 0), 0);
  const kpiAnalistas = Array.from(new Set(empresasEscopo.map((e) => e.analista).filter(Boolean))).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carteiras"
        description="Distribuição operacional de empresas, equipe e capacidade por carteira"
        actions={
          podeGerenciarCarteiras ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" className="gap-1.5 text-xs shadow-sm">
                <Link to="/cadastros">
                  <Briefcase className="h-4 w-4" /> Gerenciar Equipe & Carteiras
                </Link>
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* KPI SUMÁRIO */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {carteiraSelecionada ? "Carteira Selecionada" : "Total de Carteiras"}
            </p>
            <p className="text-xl font-bold">{carteiraSelecionada ?? kpiCarteiras}</p>
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Empresas Atendidas</p>
            <p className="text-xl font-bold">{empresasEscopo.length}</p>
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total de Vidas / Func.</p>
            <p className="text-xl font-bold">{kpiVidas.toLocaleString("pt-BR")}</p>
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Analistas Ativos</p>
            <p className="text-xl font-bold">{kpiAnalistas}</p>
          </div>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empresa, CNPJ, analista ou supervisor na carteira..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={carteiraSelecionada === null ? "default" : "outline"}
            size="sm"
            onClick={() => setCarteiraSelecionada(null)}
            className="text-xs h-8"
          >
            Todas ({todasCarteirasNomes.length})
          </Button>
          {todasCarteirasNomes.map((c) => (
            <Button
              key={c}
              variant={carteiraSelecionada === c ? "default" : "outline"}
              size="sm"
              onClick={() => setCarteiraSelecionada(carteiraSelecionada === c ? null : c)}
              className="text-xs h-8"
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* LISTA DE CARTEIRAS */}
      <div className="space-y-6">
        {carteirasFiltradas.map((c) => (
          <CarteiraCard key={c.nome} carteira={c} />
        ))}
      </div>
    </div>
  );
}

function CarteiraCard({
  carteira,
}: {
  carteira: {
    nome: string;
    descricao: string;
    categoria: string;
    totalEmpresasGeral: number;
    empresas: any[];
    totalFuncionarios: number;
    analistas: string[];
    supervisores: string[];
    ativas: number;
    atencao: number;
    atraso: number;
  };
}) {
  const [expandido, setExpandido] = useState(true);

  return (
    <div className="surface-panel overflow-hidden rounded-xl border transition-all">
      {/* HEADER DA CARTEIRA */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-muted/20 p-5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-bold tracking-tight text-foreground">{carteira.nome}</h2>
            <Badge variant="outline" className="text-xs font-normal">
              {carteira.categoria}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> <strong>{carteira.totalEmpresasGeral}</strong>{" "}
              {carteira.totalEmpresasGeral === 1 ? "empresa" : "empresas"}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> <strong>{carteira.totalFuncionarios}</strong> funcionários
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{carteira.descricao}</p>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setExpandido(!expandido)} className="gap-1.5 text-xs">
          {expandido ? (
            <>
              Recolher <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Ver Empresas ({carteira.empresas.length}) <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* METRICAS E RESUMO DA EQUIPE DA CARTEIRA */}
      <div className="grid gap-4 p-5 sm:grid-cols-3 border-b bg-background/50 text-xs">
        {/* EQUIPE RESPONSÁVEL */}
        <div className="space-y-2">
          <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Equipe Responsável</p>
          <div className="space-y-1.5">
            <div>
              <span className="text-muted-foreground">Supervisor(es): </span>
              <span className="font-medium text-foreground">
                {carteira.supervisores.length > 0 ? carteira.supervisores.join(", ") : "Não atribuído"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Analista(s): </span>
              <span className="font-medium text-foreground">
                {carteira.analistas.length > 0 ? carteira.analistas.join(", ") : "Não atribuído"}
              </span>
            </div>
          </div>
        </div>

        {/* SAÚDE / STATUS DAS EMPRESAS */}
        <div className="space-y-2">
          <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
            Status das Empresas
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> {carteira.ativas} ativas
            </span>
            <span className="flex items-center gap-1 text-amber-500 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" /> {carteira.atencao} em atenção
            </span>
            {carteira.atraso > 0 && (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <AlertTriangle className="h-3.5 w-3.5" /> {carteira.atraso} em atraso
              </span>
            )}
          </div>
        </div>

        {/* DISTRIBUIÇÃO E INDICADOR */}
        <div className="space-y-2">
          <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Carga de Trabalho</p>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Média de func. / empresa:</span>
              <strong className="text-foreground">
                {carteira.empresas.length > 0 ? Math.round(carteira.totalFuncionarios / carteira.empresas.length) : 0}
              </strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Capacidade Operacional:</span>
              <span className="text-emerald-500 font-medium">Normal</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA DE EMPRESAS DA CARTEIRA */}
      {expandido && (
        <div className="p-5">
          {carteira.empresas.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6">
              Nenhuma empresa encontrada para esta carteira com os filtros aplicados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-muted-foreground text-[11px] uppercase tracking-wider bg-muted/20">
                    <th className="py-2.5 px-3">Empresa / CNPJ</th>
                    <th className="py-2.5 px-3">Regime</th>
                    <th className="py-2.5 px-3">Analista</th>
                    <th className="py-2.5 px-3">Supervisor</th>
                    <th className="py-2.5 px-3 text-center">Funcionários</th>
                    <th className="py-2.5 px-3 text-center">Risco</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {carteira.empresas.map((emp) => (
                    <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3">
                        <Link
                          to="/empresas/$empresaId"
                          params={{ empresaId: emp.id }}
                          className="font-semibold text-foreground hover:underline"
                        >
                          {emp.nome}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">{emp.cnpj}</p>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{emp.regime}</td>
                      <td className="py-3 px-3 font-medium text-foreground">{emp.analista}</td>
                      <td className="py-3 px-3 text-muted-foreground">{emp.supervisor}</td>
                      <td className="py-3 px-3 text-center font-medium">{emp.funcionarios}</td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={emp.risco} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button asChild variant="outline" size="sm" className="h-7 text-[11px]">
                          <Link to="/empresas/$empresaId" params={{ empresaId: emp.id }}>
                            Ver Ficha
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
