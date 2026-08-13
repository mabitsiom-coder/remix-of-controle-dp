import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Layers,
  Building2,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  UserCheck,
  Building,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useEmpresas } from "@/lib/empresas-store";
import {
  useGrupos,
  addGrupo,
  removeGrupo,
  vincularEmpresaAoGrupo,
  desvincularEmpresaDoGrupo,
  type GrupoEmpresarial,
} from "@/lib/grupos-store";

export const Route = createFileRoute("/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos Econômicos — DP Control" },
      {
        name: "description",
        content: "Gestão de Grupos Econômicos e holdings que comportam múltiplas empresas.",
      },
    ],
  }),
  component: GruposPage,
});

function GruposPage() {
  const { empresas } = useEmpresas();
  const { grupos } = useGrupos();
  const [busca, setBusca] = useState("");

  const gruposFiltrados = grupos.filter(
    (g) =>
      g.nome.toLowerCase().includes(busca.toLowerCase()) ||
      g.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      g.responsavel.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grupos Econômicos & Holdings"
        description="Agrupe empresas do mesmo grupo empresarial para gestão consolidada e relatórios unificados"
        actions={<CriarGrupoDialog />}
      />

      {/* SUMÁRIO */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Grupos Cadastrados</p>
            <p className="text-xl font-bold">{grupos.length}</p>
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Empresas Agrupadas</p>
            <p className="text-xl font-bold">
              {Array.from(new Set(grupos.flatMap((g) => g.empresaIds))).length} de {empresas.length}
            </p>
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vidas em Grupos</p>
            <p className="text-xl font-bold">
              {empresas
                .filter((e) => grupos.some((g) => g.empresaIds.includes(e.id)))
                .reduce((sum, e) => sum + (e.funcionarios || 0), 0)
                .toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* BUSCA */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do grupo, código ou responsável..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>
      </div>

      {/* CARDS DE GRUPOS */}
      {gruposFiltrados.length === 0 ? (
        <div className="surface-panel flex flex-col items-center justify-center p-12 text-center">
          <Layers className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold">Nenhum Grupo Econômico Encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Crie um grupo para reunir empresas da mesma holding ou grupo familiar.
          </p>
          <div className="mt-4">
            <CriarGrupoDialog />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {gruposFiltrados.map((grupo) => (
            <GrupoCard key={grupo.id} grupo={grupo} />
          ))}
        </div>
      )}
    </div>
  );
}

function GrupoCard({ grupo }: { grupo: GrupoEmpresarial }) {
  const { empresas } = useEmpresas();
  const [expandido, setExpandido] = useState(false);

  const empresasDoGrupo = empresas.filter((e) => grupo.empresaIds.includes(e.id));
  const totalFuncionarios = empresasDoGrupo.reduce((sum, e) => sum + (e.funcionarios || 0), 0);
  const ativas = empresasDoGrupo.filter((e) => e.status === "ativa").length;
  const atencao = empresasDoGrupo.filter((e) => e.status === "atencao").length;
  const atraso = empresasDoGrupo.filter((e) => e.status === "atraso").length;

  return (
    <div className="surface-panel overflow-hidden rounded-xl border transition-all">
      {/* CABEÇALHO DO GRUPO — CLICÁVEL PARA EXPANDIR */}
      <button
        type="button"
        onClick={() => setExpandido(!expandido)}
        className="w-full text-left flex flex-wrap items-center justify-between gap-4 border-b bg-muted/20 p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-bold tracking-tight text-foreground">{grupo.nome}</h2>
            <Badge variant="secondary" className="text-xs font-mono">
              {grupo.codigo}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> <strong>{empresasDoGrupo.length}</strong> empresas
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> <strong>{totalFuncionarios}</strong> funcionários
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Responsável: <strong className="text-foreground">{grupo.responsavel}</strong> · {grupo.descricao}
          </p>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <GerenciarMembrosGrupoDialog grupo={grupo} />
          <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground">
            {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* METRICAS CONSOLIDADAS — SEMPRE VISÍVEIS NO CARD */}
      <div className="grid gap-4 p-5 sm:grid-cols-3 border-b bg-background/50 text-xs">
        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
            Saúde Consolidada do Grupo
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> {ativas} ativas
            </span>
            <span className="flex items-center gap-1 text-amber-500 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" /> {atencao} atenção
            </span>
            {atraso > 0 && (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <AlertTriangle className="h-3.5 w-3.5" /> {atraso} atraso
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
            Analistas Responsáveis no Grupo
          </p>
          <p className="font-medium text-foreground mt-1.5">
            {Array.from(new Set(empresasDoGrupo.map((e) => e.analista))).join(", ") || "Nenhuma empresa vinculada"}
          </p>
        </div>

        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
            Carteiras Atendidas
          </p>
          <p className="font-medium text-foreground mt-1.5">
            {Array.from(new Set(empresasDoGrupo.map((e) => e.carteira))).join(", ") || "Nenhuma empresa vinculada"}
          </p>
        </div>
      </div>

      {/* LISTA DE EMPRESAS INTEGRANTES DO GRUPO — EXIBIDO AO CLICAR */}
      {expandido && (
        <div className="p-5">
          {empresasDoGrupo.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              <p>Nenhuma empresa foi associada a este grupo ainda.</p>
              <div className="mt-2">
                <GerenciarMembrosGrupoDialog grupo={grupo} />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-muted-foreground text-[11px] uppercase tracking-wider bg-muted/20">
                    <th className="py-2.5 px-3">Empresa / CNPJ</th>
                    <th className="py-2.5 px-3">Regime</th>
                    <th className="py-2.5 px-3">Carteira</th>
                    <th className="py-2.5 px-3">Analista</th>
                    <th className="py-2.5 px-3 text-center">Funcionários</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {empresasDoGrupo.map((emp) => (
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
                      <td className="py-3 px-3 text-muted-foreground">{emp.carteira}</td>
                      <td className="py-3 px-3 font-medium text-foreground">{emp.analista}</td>
                      <td className="py-3 px-3 text-center font-medium">{emp.funcionarios}</td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button asChild variant="outline" size="sm" className="h-7 text-[11px]">
                          <Link to="/empresas/$empresaId" params={{ empresaId: emp.id }}>
                            Ficha
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

// MODAL PARA CRIAR NOVO GRUPO
function CriarGrupoDialog() {
  const [open, setOpen] = useState(false);
  const { empresas } = useEmpresas();

  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selecionadas, setSelecionadas] = useState<string[]>([]);

  const toggleEmpresa = (id: string) => {
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome do Grupo Econômico.");
      return;
    }

    const novo = addGrupo({
      nome: nome.trim(),
      codigo: codigo.trim(),
      responsavel: responsavel.trim() || "Não informado",
      descricao: descricao.trim() || "Grupo econômico cadastrado no sistema.",
      empresaIds: selecionadas,
    });

    toast.success(`Grupo "${novo.nome}" criado com sucesso!`, {
      description: `${selecionadas.length} empresas associadas.`,
    });

    setOpen(false);
    setNome("");
    setCodigo("");
    setResponsavel("");
    setDescricao("");
    setSelecionadas([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 text-xs shadow-sm">
          <Plus className="h-4 w-4" /> Criar Grupo Econômico
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Novo Grupo Econômico</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Reúna empresas sob o mesmo grupo econômico para gestão centralizada.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="nomeGrupo" className="text-xs font-medium">
                Nome do Grupo Econômico *
              </Label>
              <Input
                id="nomeGrupo"
                placeholder="Ex: Grupo Andrade Metalurgia & Indústria"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="codigoGrupo" className="text-xs font-medium">
                Código de Identificação
              </Label>
              <Input
                id="codigoGrupo"
                placeholder="Ex: GRP-100"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="respGrupo" className="text-xs font-medium">
                Responsável pelo Grupo
              </Label>
              <Input
                id="respGrupo"
                placeholder="Ex: Sr. Antônio Andrade"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="descGrupo" className="text-xs font-medium">
                Descrição / Observações
              </Label>
              <Textarea
                id="descGrupo"
                rows={2}
                placeholder="Ex: Holding familiar composta por 3 indústrias e 1 distribuidora."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>

          {/* VINCULAR EMPRESAS */}
          <div className="space-y-2 border-t pt-3">
            <Label className="text-xs font-semibold">
              Selecione as Empresas Integrantes ({selecionadas.length} selecionadas)
            </Label>
            <div className="max-h-48 overflow-y-auto divide-y rounded-lg border bg-muted/20 p-2">
              {empresas.map((emp) => {
                const checked = selecionadas.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleEmpresa(emp.id)}
                    className="flex items-center justify-between p-2 hover:bg-muted/40 cursor-pointer rounded transition-colors text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{emp.nome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {emp.cnpj} · Carteira: {emp.carteira}
                      </p>
                    </div>
                    <Checkbox checked={checked} onCheckedChange={() => toggleEmpresa(emp.id)} />
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 border-t pt-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" className="gap-1 text-xs">
              <CheckCircle2 className="h-4 w-4" /> Criar Grupo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// MODAL PARA EDITAR MEMBROS DO GRUPO
function GerenciarMembrosGrupoDialog({ grupo }: { grupo: GrupoEmpresarial }) {
  const [open, setOpen] = useState(false);
  const { empresas } = useEmpresas();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
          <Building className="h-3.5 w-3.5" /> Gerenciar Integrantes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-6 sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Integrantes de {grupo.nome}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Marque as empresas que pertencem a este Grupo Econômico.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2 max-h-72 overflow-y-auto divide-y border rounded-lg p-2 bg-muted/10">
          {empresas.map((emp) => {
            const pertence = grupo.empresaIds.includes(emp.id);
            return (
              <div
                key={emp.id}
                onClick={() => {
                  if (pertence) {
                    desvincularEmpresaDoGrupo(grupo.id, emp.id);
                    toast.info(`Empresa "${emp.nome}" removida do grupo.`);
                  } else {
                    vincularEmpresaAoGrupo(grupo.id, emp.id);
                    toast.success(`Empresa "${emp.nome}" adicionada ao grupo.`);
                  }
                }}
                className="flex items-center justify-between p-2.5 hover:bg-muted/30 cursor-pointer rounded transition-colors text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">{emp.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{emp.cnpj}</p>
                </div>
                <Checkbox checked={pertence} />
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-4 flex justify-between items-center sm:justify-between border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 text-xs gap-1"
            onClick={() => {
              removeGrupo(grupo.id);
              toast.info(`Grupo "${grupo.nome}" removido.`);
              setOpen(false);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir Grupo
          </Button>
          <Button size="sm" onClick={() => setOpen(false)} className="text-xs">
            Concluído
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
