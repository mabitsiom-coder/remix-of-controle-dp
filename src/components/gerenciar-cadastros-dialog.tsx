import { useState } from "react";
import { Users, UserPlus, Briefcase, Trash2, Plus, CheckCircle2, ShieldCheck, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCadastros } from "@/lib/cadastros-store";

export function GerenciarCadastrosDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("analistas");
  const { 
    analistas, supervisores, carteiras,
    addAnalista, removeAnalista, updateAnalista,
    addSupervisor, removeSupervisor, updateSupervisor,
    addCarteira, removeCarteira, updateCarteira
  } = useCadastros();

  // Form Analista
  const [editingAnalistaId, setEditingAnalistaId] = useState<string | null>(null);
  const [nomeAnalista, setNomeAnalista] = useState("");
  const [emailAnalista, setEmailAnalista] = useState("");
  const [cargoAnalista, setCargoAnalista] = useState("Analista Pleno");

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
  };

  const handleAddAnalista = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeAnalista.trim()) {
      toast.error("Informe o nome do analista.");
      return;
    }

    if (editingAnalistaId) {
      updateAnalista(editingAnalistaId, {
        nome: nomeAnalista.trim(),
        email: emailAnalista.trim(),
        cargo: cargoAnalista,
      });
      toast.success(`Analista "${nomeAnalista}" atualizado com sucesso!`);
    } else {
      addAnalista({
        nome: nomeAnalista.trim(),
        email: emailAnalista.trim() || `${nomeAnalista.toLowerCase().replace(/\s+/g, ".")}@dpcontrol.com.br`,
        cargo: cargoAnalista,
        status: "ativo",
      });
      toast.success(`Analista "${nomeAnalista}" cadastrado com sucesso!`);
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
    if (!nomeSupervisor.trim()) {
      toast.error("Informe o nome do supervisor.");
      return;
    }

    if (editingSupervisorId) {
      updateSupervisor(editingSupervisorId, {
        nome: nomeSupervisor.trim(),
        email: emailSupervisor.trim(),
        departamento: deptSupervisor,
      });
      toast.success(`Supervisor "${nomeSupervisor}" atualizado com sucesso!`);
    } else {
      addSupervisor({
        nome: nomeSupervisor.trim(),
        email: emailSupervisor.trim() || `${nomeSupervisor.toLowerCase().replace(/\s+/g, ".")}@dpcontrol.com.br`,
        departamento: deptSupervisor,
        status: "ativo",
      });
      toast.success(`Supervisor "${nomeSupervisor}" cadastrado com sucesso!`);
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
    if (!nomeCarteira.trim()) {
      toast.error("Informe o nome da carteira.");
      return;
    }

    if (editingCarteiraId) {
      updateCarteira(editingCarteiraId, {
        nome: nomeCarteira.trim(),
        categoria: catCarteira,
        descricao: descCarteira.trim(),
      });
      toast.success(`Carteira "${nomeCarteira}" atualizada com sucesso!`);
    } else {
      addCarteira({
        nome: nomeCarteira.trim(),
        categoria: catCarteira,
        descricao: descCarteira.trim() || "Carteira operacional de clientes.",
      });
      toast.success(`Carteira "${nomeCarteira}" cadastrada com sucesso!`);
    }
    resetCarteira();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        resetAnalista();
        resetSupervisor();
        resetCarteira();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-1.5 text-xs shadow-sm">
            <Users className="h-4 w-4" /> Gerenciar Equipe & Carteiras
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Cadastros do Sistema</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastre e gerencie os Analistas, Supervisores e Carteiras ativas na empresa.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2 w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analistas" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" /> Analistas ({analistas.length})
            </TabsTrigger>
            <TabsTrigger value="supervisores" className="gap-1.5 text-xs">
              <UserPlus className="h-3.5 w-3.5" /> Supervisores ({supervisores.length})
            </TabsTrigger>
            <TabsTrigger value="carteiras" className="gap-1.5 text-xs">
              <Briefcase className="h-3.5 w-3.5" /> Carteiras ({carteiras.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ANALISTAS */}
          <TabsContent value="analistas" className="mt-4 space-y-4">
            <form onSubmit={handleAddAnalista} className={`rounded-lg border p-4 space-y-3 ${editingAnalistaId ? "bg-primary/5 border-primary/30" : "bg-muted/20"}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  {editingAnalistaId ? (
                    <><Pencil className="h-3.5 w-3.5 text-primary" /> Editar Analista</>
                  ) : (
                    <><Plus className="h-3.5 w-3.5 text-primary" /> Cadastrar Novo Analista</>
                  )}
                </h4>
                {editingAnalistaId && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetAnalista} className="h-6 px-2 text-[10px] text-muted-foreground">
                    <X className="h-3 w-3 mr-1" /> Cancelar
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="nomeAnalista" className="text-[11px]">Nome Completo *</Label>
                  <Input
                    id="nomeAnalista"
                    placeholder="Ex: Mariana Silva"
                    value={nomeAnalista}
                    onChange={(e) => setNomeAnalista(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emailAnalista" className="text-[11px]">E-mail</Label>
                  <Input
                    id="emailAnalista"
                    type="email"
                    placeholder="mariana@dpcontrol.com"
                    value={emailAnalista}
                    onChange={(e) => setEmailAnalista(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cargoAnalista" className="text-[11px]">Nível / Cargo</Label>
                  <Select value={cargoAnalista} onValueChange={setCargoAnalista}>
                    <SelectTrigger id="cargoAnalista" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Analista Jr.">Analista Jr.</SelectItem>
                      <SelectItem value="Analista Pleno">Analista Pleno</SelectItem>
                      <SelectItem value="Analista Sênior">Analista Sênior</SelectItem>
                      <SelectItem value="Especialista DP">Especialista DP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full sm:w-auto h-8 text-xs gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {editingAnalistaId ? "Salvar Alterações" : "Adicionar Analista"}
              </Button>
            </form>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Analistas Cadastrados
              </h4>
              <div className="divide-y rounded-lg border">
                {analistas.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{a.nome}</p>
                      <p className="text-muted-foreground text-[11px]">{a.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px] mr-2">
                        {a.cargo}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        title="Editar"
                        onClick={() => {
                          setEditingAnalistaId(a.id);
                          setNomeAnalista(a.nome);
                          setEmailAnalista(a.email);
                          setCargoAnalista(a.cargo);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        title="Remover"
                        onClick={() => {
                          removeAnalista(a.id);
                          toast.info(`Analista "${a.nome}" removido.`);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: SUPERVISORES */}
          <TabsContent value="supervisores" className="mt-4 space-y-4">
            <form onSubmit={handleAddSupervisor} className={`rounded-lg border p-4 space-y-3 ${editingSupervisorId ? "bg-primary/5 border-primary/30" : "bg-muted/20"}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  {editingSupervisorId ? (
                    <><Pencil className="h-3.5 w-3.5 text-primary" /> Editar Supervisor</>
                  ) : (
                    <><Plus className="h-3.5 w-3.5 text-primary" /> Cadastrar Novo Supervisor</>
                  )}
                </h4>
                {editingSupervisorId && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetSupervisor} className="h-6 px-2 text-[10px] text-muted-foreground">
                    <X className="h-3 w-3 mr-1" /> Cancelar
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="nomeSupervisor" className="text-[11px]">Nome Completo *</Label>
                  <Input
                    id="nomeSupervisor"
                    placeholder="Ex: Carlos Eduardo"
                    value={nomeSupervisor}
                    onChange={(e) => setNomeSupervisor(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emailSupervisor" className="text-[11px]">E-mail</Label>
                  <Input
                    id="emailSupervisor"
                    type="email"
                    placeholder="carlos@dpcontrol.com"
                    value={emailSupervisor}
                    onChange={(e) => setEmailSupervisor(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="deptSupervisor" className="text-[11px]">Departamento</Label>
                  <Input
                    id="deptSupervisor"
                    placeholder="Ex: Operações DP"
                    value={deptSupervisor}
                    onChange={(e) => setDeptSupervisor(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full sm:w-auto h-8 text-xs gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {editingSupervisorId ? "Salvar Alterações" : "Adicionar Supervisor"}
              </Button>
            </form>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Supervisores Cadastrados
              </h4>
              <div className="divide-y rounded-lg border">
                {supervisores.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{s.nome}</p>
                      <p className="text-muted-foreground text-[11px]">{s.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px] mr-2">
                        {s.departamento}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        title="Editar"
                        onClick={() => {
                          setEditingSupervisorId(s.id);
                          setNomeSupervisor(s.nome);
                          setEmailSupervisor(s.email);
                          setDeptSupervisor(s.departamento);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        title="Remover"
                        onClick={() => {
                          removeSupervisor(s.id);
                          toast.info(`Supervisor "${s.nome}" removido.`);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: CARTEIRAS */}
          <TabsContent value="carteiras" className="mt-4 space-y-4">
            <form onSubmit={handleAddCarteira} className={`rounded-lg border p-4 space-y-3 ${editingCarteiraId ? "bg-primary/5 border-primary/30" : "bg-muted/20"}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  {editingCarteiraId ? (
                    <><Pencil className="h-3.5 w-3.5 text-primary" /> Editar Carteira</>
                  ) : (
                    <><Plus className="h-3.5 w-3.5 text-primary" /> Cadastrar Nova Carteira</>
                  )}
                </h4>
                {editingCarteiraId && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetCarteira} className="h-6 px-2 text-[10px] text-muted-foreground">
                    <X className="h-3 w-3 mr-1" /> Cancelar
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="nomeCarteira" className="text-[11px]">Nome da Carteira *</Label>
                  <Input
                    id="nomeCarteira"
                    placeholder="Ex: Carteira Tecnologia & Startups"
                    value={nomeCarteira}
                    onChange={(e) => setNomeCarteira(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="catCarteira" className="text-[11px]">Categoria</Label>
                  <Input
                    id="catCarteira"
                    placeholder="Ex: Varejo, Saúde, Industrial..."
                    value={catCarteira}
                    onChange={(e) => setCatCarteira(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="descCarteira" className="text-[11px]">Descrição / Perfil dos Clientes</Label>
                  <Input
                    id="descCarteira"
                    placeholder="Ex: Empresas com particularidades de trabalho remoto e benefícios flexíveis."
                    value={descCarteira}
                    onChange={(e) => setDescCarteira(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full sm:w-auto h-8 text-xs gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {editingCarteiraId ? "Salvar Alterações" : "Adicionar Carteira"}
              </Button>
            </form>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Carteiras Cadastradas
              </h4>
              <div className="divide-y rounded-lg border">
                {carteiras.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{c.nome}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {c.categoria}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px] mt-0.5">{c.descricao}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0"
                        title="Editar"
                        onClick={() => {
                          setEditingCarteiraId(c.id);
                          setNomeCarteira(c.nome);
                          setCatCarteira(c.categoria);
                          setDescCarteira(c.descricao);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        title="Remover"
                        onClick={() => {
                          removeCarteira(c.id);
                          toast.info(`Carteira "${c.nome}" removida.`);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
