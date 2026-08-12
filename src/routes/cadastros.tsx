import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users, UserPlus, Briefcase, Trash2, Plus, CheckCircle2, ShieldCheck,
  Pencil, X, Crown, ClipboardCheck, Handshake, GraduationCap,
  Star, BookOpen, HeartHandshake, UserCog,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCadastros, type Membro } from "@/lib/cadastros-store";

export const Route = createFileRoute("/cadastros")({
  component: CadastrosPage,
});

// --- CONFIGURAÇÃO DOS NOVOS CARGOS ---
const CARGOS_CONFIG = [
  {
    key: "gerente",
    label: "Gerentes",
    icon: Crown,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    badgeVariant: "outline" as const,
    niveis: ["Gerente Júnior", "Gerente Pleno", "Gerente Sênior", "Gerente Geral"],
  },
  {
    key: "auditoria",
    label: "Auditoria",
    icon: ClipboardCheck,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    badgeVariant: "outline" as const,
    niveis: ["Auditor Jr.", "Auditor Pleno", "Auditor Sênior", "Coordenador de Auditoria"],
  },
  {
    key: "negociadora",
    label: "Negociação",
    icon: Handshake,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    badgeVariant: "outline" as const,
    niveis: ["Negociadora Jr.", "Negociadora Plena", "Negociadora Sênior", "Líder de Negociação"],
  },
  {
    key: "coordenadora",
    label: "Coordenação",
    icon: UserCog,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    badgeVariant: "outline" as const,
    niveis: ["Coordenadora Jr.", "Coordenadora Plena", "Coordenadora Sênior", "Coordenadora Geral"],
  },
  {
    key: "recrutamento",
    label: "Recrutamento",
    icon: Users,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    badgeVariant: "outline" as const,
    niveis: ["Assistente de RH", "Analista de RH Jr.", "Analista de RH Pleno", "Especialista em R&S"],
  },
  {
    key: "cko",
    label: "CKO",
    icon: BookOpen,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    badgeVariant: "outline" as const,
    niveis: ["Gestor de Conhecimento", "Diretor de Conhecimento", "Chief Knowledge Officer"],
  },
  {
    key: "cs",
    label: "Customer Success",
    icon: HeartHandshake,
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    badgeVariant: "outline" as const,
    niveis: ["CS Jr.", "CS Pleno", "CS Sênior", "Head de CS"],
  },
];

// --- COMPONENTE DE ABA GENÉRICA PARA NOVOS CARGOS ---
function TabCargo({ config, membros, addMembro, removeMembro, updateMembro }: {
  config: typeof CARGOS_CONFIG[0];
  membros: Membro[];
  addMembro: (dados: Omit<Membro, "id">) => void;
  removeMembro: (id: string) => void;
  updateMembro: (id: string, dados: Partial<Omit<Membro, "id">>) => void;
}) {
  const membrosDoCargo = membros.filter((m) => m.cargo === config.key);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nivel, setNivel] = useState(config.niveis[0]);

  const reset = () => {
    setEditingId(null);
    setNome("");
    setEmail("");
    setNivel(config.niveis[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome.");
      return;
    }

    if (editingId) {
      updateMembro(editingId, { nome: nome.trim(), email: email.trim(), nivel });
      toast.success(`${nome} atualizado com sucesso!`);
    } else {
      addMembro({
        nome: nome.trim(),
        email: email.trim() || `${nome.toLowerCase().replace(/\s+/g, ".")}@dpcontrol.com.br`,
        cargo: config.key,
        nivel,
        status: "ativo",
      });
      toast.success(`${nome} cadastrado como ${config.label}!`);
    }
    reset();
  };

  const IconComp = config.icon;

  return (
    <div className="mt-6 space-y-6">
      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        className={`rounded-xl border p-6 space-y-4 shadow-sm transition-colors ${editingId ? "bg-primary/5 border-primary/30" : "bg-card"}`}
      >
        <div className="flex items-center justify-between pb-2 border-b">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            {editingId ? (
              <><Pencil className="h-4 w-4 text-primary" /> Editar {config.label.replace(/s$/, "")}</>
            ) : (
              <><Plus className="h-4 w-4 text-primary" /> Cadastrar em {config.label}</>
            )}
          </h4>
          {editingId && (
            <Button type="button" variant="ghost" size="sm" onClick={reset} className="h-8 text-xs text-muted-foreground">
              <X className="h-3.5 w-3.5 mr-1" /> Cancelar Edição
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor={`nome-${config.key}`} className="text-xs font-medium">Nome Completo *</Label>
            <Input
              id={`nome-${config.key}`}
              placeholder="Ex: Maria Souza"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-9"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`email-${config.key}`} className="text-xs font-medium">E-mail</Label>
            <Input
              id={`email-${config.key}`}
              type="email"
              placeholder="maria@dpcontrol.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`nivel-${config.key}`} className="text-xs font-medium">Nível / Função</Label>
            <Select value={nivel} onValueChange={setNivel}>
              <SelectTrigger id={`nivel-${config.key}`} className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.niveis.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {editingId ? "Salvar Alterações" : `Adicionar em ${config.label}`}
          </Button>
        </div>
      </form>

      {/* Listagem */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Cadastrados em {config.label}
          </h4>
          <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
            {membrosDoCargo.length} {membrosDoCargo.length === 1 ? "membro" : "membros"}
          </span>
        </div>

        {membrosDoCargo.length === 0 ? (
          <div className={`rounded-xl border-2 border-dashed p-10 text-center ${config.bgColor}`}>
            <IconComp className={`h-10 w-10 mx-auto mb-3 opacity-40 ${config.color}`} />
            <p className="text-sm font-medium text-muted-foreground">Nenhum membro cadastrado em {config.label}</p>
            <p className="text-xs text-muted-foreground mt-1">Use o formulário acima para adicionar o primeiro.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {membrosDoCargo.map((m) => (
              <div
                key={m.id}
                className="group flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all hover:border-primary/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}>
                      <IconComp className={`h-3.5 w-3.5 ${config.color}`} />
                    </div>
                    <p className="font-bold text-foreground text-sm truncate">{m.nome}</p>
                  </div>
                  <p className="text-muted-foreground text-xs truncate pl-9">{m.email}</p>
                  <div className="pl-9 mt-2">
                    <Badge variant="outline" className="text-[10px] bg-muted/50">
                      {m.nivel}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 ml-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary bg-muted/30"
                    title="Editar"
                    onClick={() => {
                      setEditingId(m.id);
                      setNome(m.nome);
                      setEmail(m.email);
                      setNivel(m.nivel || config.niveis[0]);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive bg-muted/30"
                    title="Remover"
                    onClick={() => {
                      if (confirm(`Remover ${m.nome}?`)) {
                        removeMembro(m.id);
                        toast.info(`${m.nome} removido.`);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
function CadastrosPage() {
  const [tab, setTab] = useState("analistas");
  const {
    analistas, supervisores, carteiras, membros,
    addAnalista, removeAnalista, updateAnalista,
    addSupervisor, removeSupervisor, updateSupervisor,
    addCarteira, removeCarteira, updateCarteira,
    addMembro, removeMembro, updateMembro,
  } = useCadastros();

  const possiveisAssistentes = analistas.filter(
    (a) => a.cargo === "Analista Jr." || a.cargo === "Assistente" || a.cargo === "Trainee" || a.cargo.includes("Jr")
  );

  // Form Analista
  const [editingAnalistaId, setEditingAnalistaId] = useState<string | null>(null);
  const [nomeAnalista, setNomeAnalista] = useState("");
  const [emailAnalista, setEmailAnalista] = useState("");
  const [cargoAnalista, setCargoAnalista] = useState("Analista Pleno");
  const [carteiraIdAnalista, setCarteiraIdAnalista] = useState<string>("none");
  const [assistenteIdAnalista, setAssistenteIdAnalista] = useState<string>("none");

  // Form Supervisor
  const [editingSupervisorId, setEditingSupervisorId] = useState<string | null>(null);
  const [nomeSupervisor, setNomeSupervisor] = useState("");
  const [emailSupervisor, setEmailSupervisor] = useState("");
  const [deptSupervisor, setDeptSupervisor] = useState("Operações DP");

  // Form Carteira
  const [editingCarteiraId, setEditingCarteiraId] = useState<string | null>(null);
  const [nomeCarteira, setNomeCarteira] = useState("");
  const [catCarteira, setCatCarteira] = useState("Geral");
  const [descCarteira, setDescCarteira] = useState("");

  const resetAnalista = () => {
    setEditingAnalistaId(null);
    setNomeAnalista("");
    setEmailAnalista("");
    setCargoAnalista("Analista Pleno");
    setCarteiraIdAnalista("none");
    setAssistenteIdAnalista("none");
  };

  const handleAddAnalista = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeAnalista.trim()) { toast.error("Informe o nome do analista."); return; }
    const payload = {
      nome: nomeAnalista.trim(),
      email: emailAnalista.trim() || `${nomeAnalista.toLowerCase().replace(/\s+/g, ".")}@dpcontrol.com.br`,
      cargo: cargoAnalista,
      carteiraId: carteiraIdAnalista !== "none" ? carteiraIdAnalista : undefined,
      assistenteId: assistenteIdAnalista !== "none" ? assistenteIdAnalista : undefined,
    };
    if (editingAnalistaId) {
      updateAnalista(editingAnalistaId, payload);
      toast.success(`Analista "${nomeAnalista}" atualizado!`);
    } else {
      addAnalista({ ...payload, status: "ativo" });
      toast.success(`Analista "${nomeAnalista}" cadastrado!`);
    }
    resetAnalista();
  };

  const resetSupervisor = () => {
    setEditingSupervisorId(null);
    setNomeSupervisor("");
    setEmailSupervisor("");
    setDeptSupervisor("Operações DP");
  };

  const handleAddSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeSupervisor.trim()) { toast.error("Informe o nome do supervisor."); return; }
    if (editingSupervisorId) {
      updateSupervisor(editingSupervisorId, { nome: nomeSupervisor.trim(), email: emailSupervisor.trim(), departamento: deptSupervisor });
      toast.success(`Supervisor "${nomeSupervisor}" atualizado!`);
    } else {
      addSupervisor({ nome: nomeSupervisor.trim(), email: emailSupervisor.trim() || `${nomeSupervisor.toLowerCase().replace(/\s+/g, ".")}@dpcontrol.com.br`, departamento: deptSupervisor, status: "ativo" });
      toast.success(`Supervisor "${nomeSupervisor}" cadastrado!`);
    }
    resetSupervisor();
  };

  const resetCarteira = () => {
    setEditingCarteiraId(null);
    setNomeCarteira("");
    setCatCarteira("Geral");
    setDescCarteira("");
  };

  const handleAddCarteira = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCarteira.trim()) { toast.error("Informe o nome da carteira."); return; }
    if (editingCarteiraId) {
      updateCarteira(editingCarteiraId, { nome: nomeCarteira.trim(), categoria: catCarteira, descricao: descCarteira.trim() });
      toast.success(`Carteira "${nomeCarteira}" atualizada!`);
    } else {
      addCarteira({ nome: nomeCarteira.trim(), categoria: catCarteira, descricao: descCarteira.trim() || "Carteira operacional de clientes." });
      toast.success(`Carteira "${nomeCarteira}" cadastrada!`);
    }
    resetCarteira();
  };

  // Total geral de membros por cargo para mostrar nas tabs
  const countByCargo = (key: string) => membros.filter((m) => m.cargo === key).length;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cadastros do Sistema</h2>
          <p className="text-muted-foreground">
            Cadastre e gerencie todos os cargos e carteiras ativas da empresa.
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        <Tabs value={tab} onValueChange={setTab} className="mt-6 w-full">
          {/* BARRA DE ABAS — scroll horizontal em telas pequenas */}
          <div className="overflow-x-auto pb-1">
            <TabsList className="flex h-11 w-max min-w-full gap-1 rounded-xl bg-muted p-1">
              <TabsTrigger value="analistas" className="gap-1.5 whitespace-nowrap px-3 text-xs">
                <Users className="h-3.5 w-3.5" /> Analistas ({analistas.length})
              </TabsTrigger>
              <TabsTrigger value="supervisores" className="gap-1.5 whitespace-nowrap px-3 text-xs">
                <UserPlus className="h-3.5 w-3.5" /> Supervisores ({supervisores.length})
              </TabsTrigger>
              <TabsTrigger value="carteiras" className="gap-1.5 whitespace-nowrap px-3 text-xs">
                <Briefcase className="h-3.5 w-3.5" /> Carteiras ({carteiras.length})
              </TabsTrigger>
              {CARGOS_CONFIG.map((c) => {
                const IconComp = c.icon;
                return (
                  <TabsTrigger key={c.key} value={c.key} className="gap-1.5 whitespace-nowrap px-3 text-xs">
                    <IconComp className="h-3.5 w-3.5" />
                    {c.label} {countByCargo(c.key) > 0 && `(${countByCargo(c.key)})`}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* TAB: ANALISTAS */}
          <TabsContent value="analistas" className="mt-6 space-y-6">
            <form onSubmit={handleAddAnalista} className={`rounded-xl border p-6 space-y-4 shadow-sm transition-colors ${editingAnalistaId ? "bg-primary/5 border-primary/30" : "bg-card"}`}>
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  {editingAnalistaId ? <><Pencil className="h-4 w-4 text-primary" /> Editar Analista</> : <><Plus className="h-4 w-4 text-primary" /> Cadastrar Novo Analista</>}
                </h4>
                {editingAnalistaId && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetAnalista} className="h-8 text-xs text-muted-foreground">
                    <X className="h-3.5 w-3.5 mr-1" /> Cancelar Edição
                  </Button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nomeAnalista" className="text-xs font-medium">Nome Completo *</Label>
                  <Input id="nomeAnalista" placeholder="Ex: Mariana Silva" value={nomeAnalista} onChange={(e) => setNomeAnalista(e.target.value)} className="h-9" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emailAnalista" className="text-xs font-medium">E-mail</Label>
                  <Input id="emailAnalista" type="email" placeholder="mariana@dpcontrol.com" value={emailAnalista} onChange={(e) => setEmailAnalista(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cargoAnalista" className="text-xs font-medium">Nível / Cargo</Label>
                  <Select value={cargoAnalista} onValueChange={setCargoAnalista}>
                    <SelectTrigger id="cargoAnalista" className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Analista Jr.">Analista Jr.</SelectItem>
                      <SelectItem value="Analista Pleno">Analista Pleno</SelectItem>
                      <SelectItem value="Analista Sênior">Analista Sênior</SelectItem>
                      <SelectItem value="Especialista DP">Especialista DP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="carteiraVinculada" className="text-xs font-medium flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-muted-foreground" /> Carteira Vinculada
                  </Label>
                  <Select value={carteiraIdAnalista} onValueChange={setCarteiraIdAnalista}>
                    <SelectTrigger id="carteiraVinculada" className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma carteira</SelectItem>
                      {carteiras.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="assistenteVinculado" className="text-xs font-medium flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" /> Assistente (Jr/Trainee)
                  </Label>
                  <Select value={assistenteIdAnalista} onValueChange={setAssistenteIdAnalista}>
                    <SelectTrigger id="assistenteVinculado" className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum assistente</SelectItem>
                      {possiveisAssistentes.filter((a) => a.id !== editingAnalistaId).map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.nome} ({a.cargo})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-2">
                <Button type="submit" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {editingAnalistaId ? "Salvar Alterações" : "Adicionar Analista"}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Analistas Cadastrados</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {analistas.map((a) => {
                  const carteira = carteiras.find((c) => c.id === a.carteiraId);
                  const assistente = analistas.find((ast) => ast.id === a.assistenteId);
                  return (
                    <div key={a.id} className="group flex flex-col p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-foreground">{a.nome}</p>
                          <p className="text-muted-foreground text-xs mb-2">{a.email}</p>
                          <Badge variant="outline" className="text-[10px] mb-3 bg-muted/50">{a.cargo}</Badge>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary bg-muted/30" title="Editar"
                            onClick={() => { setEditingAnalistaId(a.id); setNomeAnalista(a.nome); setEmailAnalista(a.email); setCargoAnalista(a.cargo); setCarteiraIdAnalista(a.carteiraId || "none"); setAssistenteIdAnalista(a.assistenteId || "none"); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive bg-muted/30" title="Remover"
                            onClick={() => { if (confirm(`Remover ${a.nome}?`)) { removeAnalista(a.id); toast.info(`Analista "${a.nome}" removido.`); } }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {(carteira || assistente) && (
                        <div className="mt-auto pt-3 border-t flex flex-col gap-1.5">
                          {carteira && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-primary/5 p-1.5 rounded-md px-2 w-fit">
                              <Briefcase className="h-3.5 w-3.5 text-primary" />
                              <span>Carteira: <span className="font-medium text-foreground">{carteira.nome}</span></span>
                            </div>
                          )}
                          {assistente && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/10 p-1.5 rounded-md px-2 w-fit">
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>Assistente: <span className="font-medium text-foreground">{assistente.nome}</span></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* TAB: SUPERVISORES */}
          <TabsContent value="supervisores" className="mt-6 space-y-6">
            <form onSubmit={handleAddSupervisor} className={`rounded-xl border p-6 space-y-4 shadow-sm transition-colors ${editingSupervisorId ? "bg-primary/5 border-primary/30" : "bg-card"}`}>
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  {editingSupervisorId ? <><Pencil className="h-4 w-4 text-primary" /> Editar Supervisor</> : <><Plus className="h-4 w-4 text-primary" /> Cadastrar Novo Supervisor</>}
                </h4>
                {editingSupervisorId && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetSupervisor} className="h-8 text-xs text-muted-foreground">
                    <X className="h-3.5 w-3.5 mr-1" /> Cancelar Edição
                  </Button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nomeSupervisor" className="text-xs font-medium">Nome Completo *</Label>
                  <Input id="nomeSupervisor" placeholder="Ex: Carlos Eduardo" value={nomeSupervisor} onChange={(e) => setNomeSupervisor(e.target.value)} className="h-9" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emailSupervisor" className="text-xs font-medium">E-mail</Label>
                  <Input id="emailSupervisor" type="email" placeholder="carlos@dpcontrol.com" value={emailSupervisor} onChange={(e) => setEmailSupervisor(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deptSupervisor" className="text-xs font-medium">Departamento</Label>
                  <Input id="deptSupervisor" placeholder="Ex: Operações DP" value={deptSupervisor} onChange={(e) => setDeptSupervisor(e.target.value)} className="h-9" />
                </div>
              </div>
              <div className="pt-2">
                <Button type="submit" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {editingSupervisorId ? "Salvar Alterações" : "Adicionar Supervisor"}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Supervisores Cadastrados</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {supervisores.map((s) => (
                  <div key={s.id} className="group flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-bold text-foreground">{s.nome}</p>
                      <p className="text-muted-foreground text-xs mb-1.5">{s.email}</p>
                      <Badge variant="secondary" className="text-[10px]">{s.departamento}</Badge>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary bg-muted/30" title="Editar"
                        onClick={() => { setEditingSupervisorId(s.id); setNomeSupervisor(s.nome); setEmailSupervisor(s.email); setDeptSupervisor(s.departamento); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive bg-muted/30" title="Remover"
                        onClick={() => { if (confirm(`Remover ${s.nome}?`)) { removeSupervisor(s.id); toast.info(`Supervisor "${s.nome}" removido.`); } }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB: CARTEIRAS */}
          <TabsContent value="carteiras" className="mt-6 space-y-6">
            <form onSubmit={handleAddCarteira} className={`rounded-xl border p-6 space-y-4 shadow-sm transition-colors ${editingCarteiraId ? "bg-primary/5 border-primary/30" : "bg-card"}`}>
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  {editingCarteiraId ? <><Pencil className="h-4 w-4 text-primary" /> Editar Carteira</> : <><Plus className="h-4 w-4 text-primary" /> Cadastrar Nova Carteira</>}
                </h4>
                {editingCarteiraId && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetCarteira} className="h-8 text-xs text-muted-foreground">
                    <X className="h-3.5 w-3.5 mr-1" /> Cancelar Edição
                  </Button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nomeCarteira" className="text-xs font-medium">Nome da Carteira *</Label>
                  <Input id="nomeCarteira" placeholder="Ex: Carteira Tecnologia & Startups" value={nomeCarteira} onChange={(e) => setNomeCarteira(e.target.value)} className="h-9" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="catCarteira" className="text-xs font-medium">Categoria</Label>
                  <Input id="catCarteira" placeholder="Ex: Varejo, Saúde, Industrial..." value={catCarteira} onChange={(e) => setCatCarteira(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="descCarteira" className="text-xs font-medium">Descrição / Perfil dos Clientes</Label>
                  <Input id="descCarteira" placeholder="Ex: Empresas com particularidades de trabalho remoto e benefícios flexíveis." value={descCarteira} onChange={(e) => setDescCarteira(e.target.value)} className="h-9" />
                </div>
              </div>
              <div className="pt-2">
                <Button type="submit" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {editingCarteiraId ? "Salvar Alterações" : "Adicionar Carteira"}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Carteiras Cadastradas</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {carteiras.map((c) => (
                  <div key={c.id} className="group flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-foreground truncate">{c.nome}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">{c.categoria}</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs truncate">{c.descricao}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary bg-muted/30" title="Editar"
                        onClick={() => { setEditingCarteiraId(c.id); setNomeCarteira(c.nome); setCatCarteira(c.categoria); setDescCarteira(c.descricao); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive bg-muted/30" title="Remover"
                        onClick={() => { if (confirm(`Remover ${c.nome}?`)) { removeCarteira(c.id); toast.info(`Carteira "${c.nome}" removida.`); } }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TABS DOS NOVOS CARGOS */}
          {CARGOS_CONFIG.map((config) => (
            <TabsContent key={config.key} value={config.key}>
              <TabCargo
                config={config}
                membros={membros}
                addMembro={addMembro}
                removeMembro={removeMembro}
                updateMembro={updateMembro}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
