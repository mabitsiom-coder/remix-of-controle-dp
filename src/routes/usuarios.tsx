import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users,
  Shield,
  UserCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Lock,
  UserCog,
  Building,
  Briefcase,
  Layers,
  History,
  Pencil,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAuth,
  addUsuario,
  updateUsuario,
  removeUsuario,
  type PerfilAcesso,
  type Usuario,
} from "@/lib/auth-store";
import { useCadastros } from "@/lib/cadastros-store";
import { useGrupos } from "@/lib/grupos-store";
import { useEmpresas } from "@/lib/empresas-store";
import {
  PERFIS_ADMIN_TOTAL,
  isNivelAdmin,
  normalizarPerfil,
} from "@/lib/permissoes";
import { AcessoRestrito } from "@/components/acesso-restrito";
import { HistoricoAuditoriaView } from "@/components/historico-auditoria-view";
import { MatrizPermissoesPreview } from "@/components/matriz-permissoes-preview";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Gestão de Usuários & Perfis — DP Control" },
      {
        name: "description",
        content: "Controle centralizado de usuários, perfis de acesso, permissões e auditoria.",
      },
    ],
  }),
  component: UsuariosPage,
});

const TODOS_PERFIS: PerfilAcesso[] = [
  "Analista",
  "CS",
  "Supervisor",
  "Gerente",
  "Auditoria",
  "Coordenação",
  "Administração",
  "CKO",
];

function UsuariosPage() {
  const { usuarios, currentUser, isNivel3 } = useAuth();
  const { carteiras } = useCadastros();
  const { grupos } = useGrupos();

  const [tabAtiva, setTabAtiva] = useState("usuarios");
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState<string>("todos");
  const [filtroCarteira, setFiltroCarteira] = useState<string>("todas");
  const [filtroGrupo, setFiltroGrupo] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  // Bloqueio rigoroso de rota para quem não é Nível 3
  if (!isNivelAdmin(currentUser.perfil)) {
    return <AcessoRestrito perfisPermitidos={PERFIS_ADMIN_TOTAL} />;
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busca.toLowerCase().trim();
    const atendeBusca =
      !q ||
      u.nome.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.cargo && u.cargo.toLowerCase().includes(q)) ||
      (u.departamento && u.departamento.toLowerCase().includes(q));

    const atendePerfil = filtroPerfil === "todos" || u.perfil === filtroPerfil;
    const atendeCarteira =
      filtroCarteira === "todas" ||
      u.carteira === filtroCarteira ||
      (u.carteirasPermitidas && u.carteirasPermitidas.includes(filtroCarteira));
    const atendeGrupo = filtroGrupo === "todos" || u.grupoTrabalho === filtroGrupo;
    const atendeStatus = filtroStatus === "todos" || u.status === filtroStatus;

    return atendeBusca && atendePerfil && atendeCarteira && atendeGrupo && atendeStatus;
  });

  const getBadgeVariant = (perfil: PerfilAcesso) => {
    const norm = normalizarPerfil(perfil);
    switch (norm) {
      case "Administração":
      case "CKO":
        return "destructive";
      case "Coordenação":
        return "secondary";
      case "Gerente":
      case "Supervisor":
      case "Auditoria":
        return "default";
      case "Analista":
      case "CS":
      default:
        return "outline";
    }
  };

  const getNivelDescricao = (perfil: PerfilAcesso) => {
    const norm = normalizarPerfil(perfil);
    if (norm === "Coordenação" || norm === "Administração" || norm === "CKO") return "Nível 3 — Administração";
    if (norm === "Supervisor" || norm === "Gerente" || norm === "Auditoria") return "Nível 2 — Gestão";
    return "Nível 1 — Operacional";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão Centralizada de Usuários & Permissões"
        description="Controle de acesso hierárquico por perfil, carteiras autorizadas e auditoria do sistema"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <NovoUsuarioDialog />
          </div>
        }
      />

      {/* KPIS GERAIS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total de Usuários</p>
            <p className="text-xl font-bold">{usuarios.length}</p>
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500 shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nível 3 — Administração</p>
            <p className="text-xl font-bold">
              {usuarios.filter((u) => isNivelAdmin(u.perfil)).length}
            </p>
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
            <UserCog className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nível 2 — Gestão</p>
            <p className="text-xl font-bold">
              {
                usuarios.filter(
                  (u) =>
                    normalizarPerfil(u.perfil) === "Supervisor" ||
                    normalizarPerfil(u.perfil) === "Gerente" ||
                    normalizarPerfil(u.perfil) === "Auditoria",
                ).length
              }
            </p>
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nível 1 — Operacional</p>
            <p className="text-xl font-bold">
              {
                usuarios.filter(
                  (u) =>
                    normalizarPerfil(u.perfil) === "Analista" ||
                    normalizarPerfil(u.perfil) === "CS",
                ).length
              }
            </p>
          </div>
        </div>
      </div>

      <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="usuarios" className="gap-2 text-xs font-semibold">
            <Users className="h-4 w-4" /> Usuários Cadastrados ({usuarios.length})
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-2 text-xs font-semibold">
            <History className="h-4 w-4" /> Histórico de Alterações & Auditoria
          </TabsTrigger>
          <TabsTrigger value="matriz" className="gap-2 text-xs font-semibold">
            <Lock className="h-4 w-4" /> Matriz Geral de Permissões
          </TabsTrigger>
        </TabsList>

        {/* TAB: TABELA DE USUÁRIOS */}
        <TabsContent value="usuarios" className="space-y-4">
          {/* FILTROS E BUSCA */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou cargo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro de Perfil */}
              <Select value={filtroPerfil} onValueChange={setFiltroPerfil}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Perfis</SelectItem>
                  {TODOS_PERFIS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro de Carteira */}
              <Select value={filtroCarteira} onValueChange={setFiltroCarteira}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Carteira" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Carteiras</SelectItem>
                  {carteiras.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro de Grupo */}
              <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Grupos</SelectItem>
                  {grupos.map((g) => (
                    <SelectItem key={g.id} value={g.nome}>
                      {g.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro de Status */}
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TABELA DE GESTÃO DE USUÁRIOS */}
          <div className="surface-panel overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-muted-foreground text-[11px] uppercase tracking-wider bg-muted/30">
                    <th className="py-3 px-4">Usuário / E-mail</th>
                    <th className="py-3 px-4">Cargo</th>
                    <th className="py-3 px-4">Perfil / Nível</th>
                    <th className="py-3 px-4">Carteira(s)</th>
                    <th className="py-3 px-4">Grupo de Trabalho</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Último Acesso</th>
                    <th className="py-3 px-4 text-center">Criado em</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usuariosFiltrados.map((usr) => {
                    const isLogado = currentUser.id === usr.id;
                    const perfilNorm = normalizarPerfil(usr.perfil);

                    return (
                      <tr key={usr.id} className="hover:bg-muted/20 transition-colors">
                        {/* Nome / E-mail */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {usr.fotoUrl ? (
                              <img
                                src={usr.fotoUrl}
                                alt={usr.nome}
                                className="h-8 w-8 rounded-full object-cover border border-primary/20 shrink-0"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                                {usr.nome.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-foreground flex items-center gap-1.5">
                                {usr.nome}
                                {isLogado && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                  >
                                    Você
                                  </Badge>
                                )}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{usr.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Cargo */}
                        <td className="py-3 px-4 font-medium text-foreground">
                          {usr.cargo || usr.departamento || "Analista DP"}
                        </td>

                        {/* Perfil & Nível */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <Badge variant={getBadgeVariant(perfilNorm)} className="text-[11px]">
                              {perfilNorm}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground">
                              {getNivelDescricao(perfilNorm)}
                            </p>
                          </div>
                        </td>

                        {/* Carteira(s) */}
                        <td className="py-3 px-4 text-muted-foreground">
                          {usr.carteirasPermitidas && usr.carteirasPermitidas.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {usr.carteirasPermitidas.map((c) => (
                                <Badge key={c} variant="outline" className="text-[10px] py-0">
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          ) : usr.carteira ? (
                            <span>{usr.carteira}</span>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Todas / Global</span>
                          )}
                        </td>

                        {/* Grupo de Trabalho */}
                        <td className="py-3 px-4 text-muted-foreground">
                          {usr.grupoTrabalho ? (
                            <span className="font-medium text-foreground">{usr.grupoTrabalho}</span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {usr.status === "ativo" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              Inativo
                            </span>
                          )}
                        </td>

                        {/* Último Acesso */}
                        <td className="py-3 px-4 text-center text-muted-foreground font-mono text-[11px]">
                          {usr.ultimoAcesso || "—"}
                        </td>

                        {/* Data Criação */}
                        <td className="py-3 px-4 text-center text-muted-foreground">
                          {usr.criadoEm || "—"}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <EditarUsuarioDialog usuario={usr} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB: AUDITORIA */}
        <TabsContent value="auditoria" className="space-y-4">
          <HistoricoAuditoriaView />
        </TabsContent>

        {/* TAB: MATRIZ DE PERMISSÕES GERAL */}
        <TabsContent value="matriz" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-emerald-500" /> Nível 1 — Operacional
              </h4>
              <p className="text-xs text-muted-foreground">
                Perfis focados na execução diária das rotinas, folhas, eSocial e SST. Sem acesso a exclusões ou alterações estruturais.
              </p>
              <MatrizPermissoesPreview perfil="Analista" />
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCog className="h-4 w-4 text-blue-500" /> Nível 2 — Gestão
              </h4>
              <p className="text-xs text-muted-foreground">
                Gestão operacional de grupos, carteiras, transferências e equipe. Permissões gerenciais com registro em auditoria.
              </p>
              <MatrizPermissoesPreview perfil="Supervisor" />
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-destructive" /> Nível 3 — Administração
              </h4>
              <p className="text-xs text-muted-foreground">
                Acesso total irrestrito: gestão de empresas, exclusões com soft delete, criação de usuários, auditorias e parâmetros.
              </p>
              <MatrizPermissoesPreview perfil="Administração" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// MODAL PARA NOVO USUÁRIO
function NovoUsuarioDialog() {
  const [open, setOpen] = useState(false);
  const { carteiras } = useCadastros();
  const { grupos } = useGrupos();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("Analista DP");
  const [senha, setSenha] = useState("123456");
  const [perfil, setPerfil] = useState<PerfilAcesso>("Analista");
  const [grupoTrabalho, setGrupoTrabalho] = useState("none");
  const [carteira, setCarteira] = useState("none");
  const [departamento, setDepartamento] = useState("Operações DP");
  const [fotoUrl, setFotoUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLimpo = email.trim().toLowerCase();
    if (!nome.trim() || !emailLimpo) {
      toast.error("Preencha o nome e e-mail do usuário.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+$/.test(emailLimpo)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    try {
      const novo = await addUsuario({
        nome: nome.trim(),
        email: emailLimpo,
        cargo: cargo.trim() || "Analista DP",
        senha: senha.trim() || "123456",
        perfil,
        departamento: departamento.trim() || "Departamento Pessoal",
        grupoTrabalho: grupoTrabalho !== "none" ? grupoTrabalho : undefined,
        carteira: carteira !== "none" ? carteira : undefined,
        carteirasPermitidas: carteira !== "none" ? [carteira] : [],
        fotoUrl: fotoUrl || undefined,
        status: "ativo",
      });

      toast.success(`Usuário "${novo.nome}" cadastrado com perfil ${novo.perfil}!`);
      setOpen(false);
      setNome("");
      setEmail("");
      setCargo("Analista DP");
      setSenha("123456");
      setPerfil("Analista");
      setFotoUrl("");
      setGrupoTrabalho("none");
      setCarteira("none");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao cadastrar usuário.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 text-xs shadow-sm">
          <Plus className="h-4 w-4" /> Cadastrar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Cadastrar Novo Usuário</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Defina os dados cadastrais, cargo, perfil de acesso e permissões automáticas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {/* FOTO & DADOS BÁSICOS */}
          <div className="flex items-center gap-3 border p-2.5 rounded-lg bg-muted/20">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-background overflow-hidden shadow-2xs">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Preview Avatar" className="h-full w-full object-cover" />
              ) : (
                <UserCog className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <Label className="text-xs font-medium">Foto de Perfil</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("Foto deve ter no máximo 2MB");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => setFotoUrl(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="h-8 text-xs cursor-pointer"
                />
                {fotoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => setFotoUrl("")}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="nomeUsr" className="text-xs font-medium">
                Nome Completo *
              </Label>
              <Input
                id="nomeUsr"
                placeholder="Ex: Carlos Eduardo Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="emailUsr" className="text-xs font-medium">
                E-mail de Acesso *
              </Label>
              <Input
                id="emailUsr"
                type="email"
                placeholder="ex.: nome@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="cargoUsr" className="text-xs font-medium">
                Cargo / Função *
              </Label>
              <Input
                id="cargoUsr"
                placeholder="Ex: Analista de DP Sênior"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="senhaUsr" className="text-xs font-medium">
                Senha Inicial
              </Label>
              <Input
                id="senhaUsr"
                type="text"
                placeholder="123456"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="perfilUsr" className="text-xs font-semibold text-primary">
                Perfil de Acesso *
              </Label>
              <Select value={perfil} onValueChange={(val: PerfilAcesso) => setPerfil(val)}>
                <SelectTrigger id="perfilUsr" className="h-9 text-xs border-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODOS_PERFIS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ESCOPO & VÍNCULOS */}
          <div className="grid gap-3 sm:grid-cols-3 border-t pt-3">
            <div className="space-y-1">
              <Label htmlFor="carteiraUsr" className="text-xs font-medium">
                Carteira Principal
              </Label>
              <Select value={carteira} onValueChange={setCarteira}>
                <SelectTrigger id="carteiraUsr" className="h-9 text-xs">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas / Sem restrição</SelectItem>
                  {carteiras.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="grupoUsr" className="text-xs font-medium">
                Grupo de Trabalho
              </Label>
              <Select value={grupoTrabalho} onValueChange={setGrupoTrabalho}>
                <SelectTrigger id="grupoUsr" className="h-9 text-xs">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum / Geral</SelectItem>
                  {grupos.map((g) => (
                    <SelectItem key={g.id} value={g.nome}>
                      {g.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="deptUsr" className="text-xs font-medium">
                Departamento
              </Label>
              <Input
                id="deptUsr"
                placeholder="Ex: Operações DP"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
              />
            </div>
          </div>

          {/* MATRIZ DE PERMISSÕES DINÂMICA DO PERFIL SELECIONADO */}
          <div className="border-t pt-3">
            <Label className="text-xs font-semibold mb-2 block">
              Permissões Aplicadas Automaticamente
            </Label>
            <MatrizPermissoesPreview perfil={perfil} />
          </div>

          <DialogFooter className="gap-2 border-t pt-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" className="gap-1 text-xs">
              <CheckCircle2 className="h-4 w-4" /> Concluir Cadastro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// MODAL PARA EDITAR USUÁRIO
function EditarUsuarioDialog({ usuario }: { usuario: Usuario }) {
  const [open, setOpen] = useState(false);
  const { carteiras } = useCadastros();
  const { grupos } = useGrupos();

  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [cargo, setCargo] = useState(usuario.cargo || "Analista DP");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<PerfilAcesso>(normalizarPerfil(usuario.perfil));
  const [grupoTrabalho, setGrupoTrabalho] = useState(usuario.grupoTrabalho || "none");
  const [carteira, setCarteira] = useState(usuario.carteira || "none");
  const [departamento, setDepartamento] = useState(usuario.departamento || "Departamento Pessoal");
  const [fotoUrl, setFotoUrl] = useState(usuario.fotoUrl || "");
  const [status, setStatus] = useState<"ativo" | "inativo">(usuario.status);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLimpo = email.trim().toLowerCase();
    if (!nome.trim() || !emailLimpo) {
      toast.error("Preencha o nome e e-mail do usuário.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+$/.test(emailLimpo)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    try {
      await updateUsuario(usuario.id, {
        nome: nome.trim(),
        email: emailLimpo,
        cargo: cargo.trim() || "Analista DP",
        senha: senha.trim() || undefined,
        perfil,
        grupoTrabalho: grupoTrabalho !== "none" ? grupoTrabalho : undefined,
        carteira: carteira !== "none" ? carteira : undefined,
        carteirasPermitidas: carteira !== "none" ? [carteira] : [],
        departamento: departamento.trim(),
        fotoUrl: fotoUrl || undefined,
        status,
      });
      toast.success(`Usuário "${nome}" atualizado com sucesso!`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar usuário.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1">
          <Pencil className="h-3 w-3" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Editar Usuário & Acesso</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Altere os dados pessoais, perfil, cargo, carteiras e status do usuário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="mt-2 space-y-4">
          <div className="flex items-center gap-3 border p-2.5 rounded-lg bg-muted/20">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-background overflow-hidden shadow-2xs">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <UserCog className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <Label className="text-xs font-medium">Foto de Perfil</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("Foto deve ter no máximo 2MB");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => setFotoUrl(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="h-8 text-xs cursor-pointer"
                />
                {fotoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => setFotoUrl("")}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="editNome" className="text-xs font-medium">Nome Completo *</Label>
              <Input id="editNome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editEmail" className="text-xs font-medium">E-mail *</Label>
              <Input id="editEmail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="editCargo" className="text-xs font-medium">Cargo / Função *</Label>
              <Input id="editCargo" value={cargo} onChange={(e) => setCargo(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editSenha" className="text-xs font-medium">Redefinir Senha</Label>
              <Input
                id="editSenha"
                type="password"
                placeholder="Deixar em branco para manter"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editPerfil" className="text-xs font-semibold text-primary">Perfil de Acesso</Label>
              <Select value={perfil} onValueChange={(val: PerfilAcesso) => setPerfil(val)}>
                <SelectTrigger id="editPerfil" className="h-9 text-xs border-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODOS_PERFIS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 border-t pt-3">
            <div className="space-y-1">
              <Label htmlFor="editCarteira" className="text-xs font-medium">Carteira Vinculada</Label>
              <Select value={carteira} onValueChange={setCarteira}>
                <SelectTrigger id="editCarteira" className="h-9 text-xs">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas / Sem restrição</SelectItem>
                  {carteiras.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="editGrupo" className="text-xs font-medium">Grupo de Trabalho</Label>
              <Select value={grupoTrabalho} onValueChange={setGrupoTrabalho}>
                <SelectTrigger id="editGrupo" className="h-9 text-xs">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum / Geral</SelectItem>
                  {grupos.map((g) => (
                    <SelectItem key={g.id} value={g.nome}>
                      {g.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="editStatus" className="text-xs font-medium">Status da Conta</Label>
              <Select value={status} onValueChange={(val: "ativo" | "inativo") => setStatus(val)}>
                <SelectTrigger id="editStatus" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* MATRIZ DE PERMISSÕES DINÂMICA */}
          <div className="border-t pt-3">
            <Label className="text-xs font-semibold mb-2 block">
              Permissões Atualizadas do Perfil
            </Label>
            <MatrizPermissoesPreview perfil={perfil} />
          </div>

          <DialogFooter className="gap-2 border-t pt-3 justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 text-xs gap-1"
              onClick={async () => {
                if (confirm(`Tem certeza de que deseja remover o usuário "${usuario.nome}"?`)) {
                  try {
                    await removeUsuario(usuario.id);
                    toast.info(`Usuário "${usuario.nome}" removido.`);
                    setOpen(false);
                  } catch (err: any) {
                    toast.error(err.message || "Erro ao remover usuário.");
                  }
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir Usuário
            </Button>
            <Button type="submit" size="sm" className="text-xs">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
