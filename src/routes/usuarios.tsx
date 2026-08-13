import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users,
  Shield,
  ShieldAlert,
  UserCheck,
  Plus,
  KeyRound,
  Trash2,
  CheckCircle2,
  Search,
  Lock,
  UserCog,
  LogIn,
  Building,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { AcessosCadastros } from "@/components/acessos-cadastros";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Gestão de Usuários — DP Control" },
      {
        name: "description",
        content: "Controle de perfis de acesso, usuários e credenciais do sistema.",
      },
    ],
  }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const { usuarios, currentUser, isAdmin } = useAuth();
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState<string>("todos");

  const usuariosFiltrados = usuarios.filter((u) => {
    const atendeBusca =
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase()) ||
      u.departamento.toLowerCase().includes(busca.toLowerCase());
    const atendePerfil = filtroPerfil === "todos" || u.perfil === filtroPerfil;
    return atendeBusca && atendePerfil;
  });

  const getBadgeVariant = (perfil: PerfilAcesso) => {
    switch (perfil) {
      case "Administrador":
        return "destructive";
      case "Gerente":
        return "default";
      case "Supervisor":
        return "default";
      case "Coordenador":
        return "secondary";
      case "Analista":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Usuários e Perfis de Acesso"
        description="Gerencie os usuários do sistema, senhas, cargos e níveis de permissão"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <NovoUsuarioDialog />
          </div>
        }
      />

      {/* CREDENCIAIS DO ADMINISTRADOR EM DESTAQUE */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
              Acesso Administrador Padrão
            </p>
            <p className="text-sm font-medium text-foreground">
              E-mail: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">auditoria@mabitcontabilidade.com.br</code> · Senha: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">123456</code>
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs border-primary/40 text-primary">
          Acesso Total ao Sistema
        </Badge>
      </div>

      {isAdmin && <AcessosCadastros />}

      {/* KPIS */}
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
            <p className="text-xs text-muted-foreground">Administradores</p>
            <p className="text-xl font-bold">
              {usuarios.filter((u) => u.perfil === "Administrador").length}
            </p>
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
            <UserCog className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Supervisores & Coordenadores</p>
            <p className="text-xl font-bold">
              {usuarios.filter((u) => u.perfil === "Supervisor" || u.perfil === "Coordenador").length}
            </p>
          </div>
        </div>

        <div className="surface-panel p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Analistas Operacionais</p>
            <p className="text-xl font-bold">
              {usuarios.filter((u) => u.perfil === "Analista").length}
            </p>
          </div>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou departamento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtrar perfil:</span>
          <Select value={filtroPerfil} onValueChange={setFiltroPerfil}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os perfis</SelectItem>
              <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Gerente">Gerente</SelectItem>
              <SelectItem value="Supervisor">Supervisor</SelectItem>
              <SelectItem value="Coordenador">Coordenador</SelectItem>
              <SelectItem value="Analista">Analista</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABELA DE USUÁRIOS */}
      <div className="surface-panel overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b text-muted-foreground text-[11px] uppercase tracking-wider bg-muted/30">
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Perfil / Nível</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Criado em</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usuariosFiltrados.map((usr) => {
                const isLogado = currentUser.id === usr.id;
                return (
                  <tr key={usr.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {usr.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-1.5">
                            {usr.nome}
                            {isLogado && (
                              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                Usuário Atual
                              </Badge>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{usr.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getBadgeVariant(usr.perfil)} className="text-[11px]">
                        {usr.perfil}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{usr.departamento}</td>
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
                    <td className="py-3 px-4 text-center text-muted-foreground">{usr.criadoEm}</td>
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

      {/* MATRIZ DE NÍVEIS DE PERMISSÃO */}
      <div className="surface-panel p-5 rounded-xl border space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" /> Matriz de Níveis e Permissões do Sistema
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-lg border p-3 bg-destructive/5 space-y-1">
            <p className="font-bold text-destructive flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Administrador
            </p>
            <p className="text-muted-foreground text-[11px]">
              Acesso irrestrito a todos os módulos, BI gerencial, gestão de usuários, exclusão e configurações avançadas.
            </p>
          </div>

          <div className="rounded-lg border p-3 bg-primary/5 space-y-1">
            <p className="font-bold text-primary flex items-center gap-1">
              <UserCog className="h-3.5 w-3.5" /> Supervisor
            </p>
            <p className="text-muted-foreground text-[11px]">
              Supervisão operacional, aprovação de folhas, dupla conferência, revisão de particularidades e alertas de erro.
            </p>
          </div>

          <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1">
              <Building className="h-3.5 w-3.5" /> Coordenador
            </p>
            <p className="text-muted-foreground text-[11px]">
              Gestão de prazos de obrigações, distribuição de tarefas, acompanhamento no Gantt e checklists de clientes.
            </p>
          </div>

          <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5" /> Analista
            </p>
            <p className="text-muted-foreground text-[11px]">
              Operação de folha, cálculo de impostos, eSocial, SST e fechamento diário dos clientes da sua carteira.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// MODAL PARA NOVO USUÁRIO
function NovoUsuarioDialog() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("123456");
  const [perfil, setPerfil] = useState<PerfilAcesso>("Analista");
  const [departamento, setDepartamento] = useState("Operações DP");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLimpo = email.trim().toLowerCase();
    if (!nome.trim() || !emailLimpo) {
      toast.error("Preencha o nome e e-mail do usuário.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLimpo)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    try {
      const novo = await addUsuario({
        nome: nome.trim(),
        email: emailLimpo,
        senha: senha.trim() || "123456",
        perfil,
        departamento: departamento.trim() || "Departamento Pessoal",
        status: "ativo",
      });

      toast.success(`Usuário "${novo.nome}" cadastrado como ${novo.perfil}!`);
      setOpen(false);
      setNome("");
      setEmail("");
      setSenha("123456");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao cadastrar usuário.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 text-xs shadow-sm">
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6 sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Cadastrar Novo Usuário</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Defina as credenciais e o perfil de acesso do usuário no sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-3">
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

          <div className="grid gap-3 sm:grid-cols-2">
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
              <Label htmlFor="perfilUsr" className="text-xs font-medium">
                Perfil de Acesso
              </Label>
              <Select value={perfil} onValueChange={(val: PerfilAcesso) => setPerfil(val)}>
                <SelectTrigger id="perfilUsr" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Gerente">Gerente</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Coordenador">Coordenador</SelectItem>
                  <SelectItem value="Analista">Analista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="deptUsr" className="text-xs font-medium">
              Departamento / Equipe
            </Label>
            <Input
              id="deptUsr"
              placeholder="Ex: Operações DP / Supervisão"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 border-t pt-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" className="gap-1 text-xs">
              <CheckCircle2 className="h-4 w-4" /> Cadastrar Usuário
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
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<PerfilAcesso>(usuario.perfil);
  const [departamento, setDepartamento] = useState(usuario.departamento);
  const [status, setStatus] = useState<"ativo" | "inativo">(usuario.status);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLimpo = email.trim().toLowerCase();
    if (!nome.trim() || !emailLimpo) {
      toast.error("Preencha o nome e e-mail do usuário.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLimpo)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    try {
      await updateUsuario(usuario.id, {
        nome: nome.trim(),
        email: emailLimpo,
        senha: senha.trim(),
        perfil,
        departamento: departamento.trim(),
        status,
      });
      toast.success(`Usuário "${nome}" atualizado!`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar usuário.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-[11px]">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6 sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Editar Usuário</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Altere os dados, perfil de acesso ou senha do usuário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="mt-2 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="editNome" className="text-xs font-medium">Nome</Label>
            <Input id="editNome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="editEmail" className="text-xs font-medium">E-mail</Label>
            <Input id="editEmail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="editSenha" className="text-xs font-medium">Senha</Label>
              <Input
                id="editSenha"
                type="password"
                placeholder="Deixe em branco para manter a senha atual"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editPerfil" className="text-xs font-medium">Perfil</Label>
              <Select value={perfil} onValueChange={(val: PerfilAcesso) => setPerfil(val)}>
                <SelectTrigger id="editPerfil" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Gerente">Gerente</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Coordenador">Coordenador</SelectItem>
                  <SelectItem value="Analista">Analista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="editDept" className="text-xs font-medium">Departamento</Label>
              <Input id="editDept" value={departamento} onChange={(e) => setDepartamento(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editStatus" className="text-xs font-medium">Status</Label>
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

          <DialogFooter className="gap-2 border-t pt-3 justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 text-xs gap-1"
              onClick={async () => {
                try {
                  await removeUsuario(usuario.id);
                  toast.info(`Usuário "${usuario.nome}" removido.`);
                  setOpen(false);
                } catch (err: any) {
                  toast.error(err.message || "Erro ao remover usuário.");
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir
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
