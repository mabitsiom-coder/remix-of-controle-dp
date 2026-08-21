import { useState } from "react";
import { Plus, Building2, UserCheck, ShieldAlert, FileText, CheckCircle2, Settings, Search, Wand2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createEmpresa,
  EmpresaDuplicadaError,
  encontrarEmpresaDuplicada,
  type NovaEmpresaForm,
} from "@/lib/empresas-store";
import { useCadastros, resolverVinculoPorAnalista, resolverSupervisorPorCarteira } from "@/lib/cadastros-store";
import { useGrupos } from "@/lib/grupos-store";
import { useAuth } from "@/lib/auth-store";
import { Link } from "@tanstack/react-router";

export function NovaEmpresaDialog({
  trigger,
  onSuccess,
}: {
  trigger?: React.ReactNode;
  onSuccess?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dados");
  const { analistas, supervisores, carteiras } = useCadastros();
  const { grupos } = useGrupos();
  const { currentUser } = useAuth();
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);

  const [formData, setFormData] = useState<NovaEmpresaForm>({
    nome: "",
    cnpj: "",
    regime: "Optante pelo Simples Nacional",
    tipo: "com-movimento",
    codigoDominio: "",
    grupoId: "none",
    responsavel: "",
    carteira: carteiras[0]?.nome || "Carteira Industrial A",
    analista: analistas[0]?.nome || "Camila Rocha",
    supervisor: supervisores[0]?.nome || "Paulo Serra",
    funcionarios: 10,
    convenio: "Comerciários",
    certificadoDigital: "A1 — Ativo (1 ano)",
    procuracao: "e-CAC Válida",
    risco: "baixo",
    status: "ativa",
    fechamento: "Apuração de horas do dia 21 ao 20 com envio até dia 25.",
    envio: "Envio de relatórios por e-mail e portal do cliente.",
    duplaConferencia: true,
    fluxoAprovacao: "Analista → Supervisor → Cliente",
    observacoes: "",
  });

  const formatCNPJ = (value: string) => {
    const raw = value.replace(/\D/g, "").slice(0, 14);
    return raw
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const duplicada = encontrarEmpresaDuplicada(formData.nome, formData.cnpj);
    if (duplicada) {
      toast.error("Empresa duplicada — cadastro bloqueado", {
        description:
          duplicada.motivo === "cnpj"
            ? `O CNPJ ${duplicada.empresa.cnpj} já pertence a "${duplicada.empresa.nome}".`
            : `Já existe uma empresa cadastrada como "${duplicada.empresa.nome}".`,
      });
      setActiveTab("dados");
      return;
    }

    try {
      const novaEmpresa = createEmpresa(formData, currentUser?.nome);
      toast.success(`Empresa "${novaEmpresa.nome}" cadastrada com sucesso!`, {
        description: `CNPJ: ${novaEmpresa.cnpj} | Analista: ${novaEmpresa.analista}`,
      });
      setOpen(false);
      // Reset form defaults
      setFormData({
        nome: "",
        cnpj: "",
        regime: "Optante pelo Simples Nacional",
        responsavel: "",
        carteira: "Carteira Industrial A",
        analista: "Camila Rocha",
        supervisor: "Paulo Serra",
        funcionarios: 10,
        convenio: "Comerciários",
        certificadoDigital: "A1 — Ativo (1 ano)",
        procuracao: "e-CAC Válida",
        risco: "baixo",
        status: "ativa",
        fechamento: "Apuração de horas do dia 21 ao 20 com envio até dia 25.",
        envio: "Envio de relatórios por e-mail e portal do cliente.",
        duplaConferencia: true,
        fluxoAprovacao: "Analista → Supervisor → Cliente",
        observacoes: "",
      });
      setActiveTab("dados");

      if (onSuccess) {
        onSuccess(novaEmpresa.id);
      }
    } catch (err) {
      console.error(err);
      if (err instanceof EmpresaDuplicadaError) {
        toast.error("Empresa duplicada — cadastro bloqueado", { description: err.message });
        setActiveTab("dados");
        return;
      }
      toast.error("Erro ao cadastrar empresa.");
    }
  };

  const preencherDadosTeste = () => {
    setFormData({
      nome: "Empresa de Teste Automático LTDA",
      cnpj: "12.345.678/0001-99",
      regime: "Optante pelo Simples Nacional",
      grupoId: "none",
      responsavel: "João Teste (Diretor)",
      carteira: carteiras[0]?.nome || "Carteira Industrial A",
      analista: analistas[0]?.nome || "Camila Rocha",
      supervisor: supervisores[0]?.nome || "Paulo Serra",
      funcionarios: 45,
      convenio: "Sindicato de Teste",
      certificadoDigital: "A1 — Ativo (1 ano)",
      procuracao: "e-CAC Válida",
      risco: "medio",
      status: "ativa",
      fechamento: "Fechamento dia 20, apuração do dia 21 ao 20.",
      envio: "Envio portal",
      duplaConferencia: true,
      fluxoAprovacao: "Analista → Supervisor",
      observacoes: "Dados preenchidos automaticamente para teste.",
    });
    toast.success("Dados de teste preenchidos com sucesso!");
  };

  const buscarCnpj = async () => {
    const cnpjNumeros = formData.cnpj.replace(/\D/g, "");
    if (cnpjNumeros.length !== 14) {
      toast.error("Preencha um CNPJ válido com 14 dígitos para buscar.");
      return;
    }

    setIsLoadingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjNumeros}`);
      if (!response.ok) throw new Error("CNPJ não encontrado");
      
      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        nome: data.razao_social || data.nome_fantasia || prev.nome,
      }));
      toast.success("Dados do CNPJ preenchidos automaticamente!");
    } catch (error) {
      toast.error("Não foi possível buscar os dados desse CNPJ.");
      console.error(error);
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Nova empresa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Nova Empresa</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Cadastre os dados cadastrais, responsável, equipe técnica e regras da folha.
                </DialogDescription>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={preencherDadosTeste} className="gap-1.5 h-8 text-xs">
              <Wand2 className="h-3.5 w-3.5" /> Preencher Teste
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados" className="gap-1.5 text-xs">
                <Building2 className="h-3.5 w-3.5" /> Cadastro Geral
              </TabsTrigger>
              <TabsTrigger value="equipe" className="gap-1.5 text-xs">
                <UserCheck className="h-3.5 w-3.5" /> Equipe & Risco
              </TabsTrigger>
              <TabsTrigger value="particularidades" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" /> Particularidades
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: DADOS GERAIS */}
            <TabsContent value="dados" className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="nome" className="text-xs font-medium">
                    Razão Social / Nome Fantasia
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Indústrias Metalúrgicas Ramos S/A"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cnpj" className="text-xs font-medium">
                    CNPJ
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0001-00"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                      maxLength={18}
                    />
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={buscarCnpj}
                      disabled={isLoadingCnpj}
                      className="px-3"
                      title="Buscar dados do CNPJ"
                    >
                      {isLoadingCnpj ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="regime" className="text-xs font-medium">
                    Regime Tributário
                  </Label>
                  <Select
                    value={formData.regime}
                    onValueChange={(val) => setFormData({ ...formData, regime: val })}
                  >
                    <SelectTrigger id="regime">
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Optante pelo Simples Nacional">Optante pelo Simples Nacional</SelectItem>
                      <SelectItem value="Não Optante pelo Simples Nacional">Não Optante pelo Simples Nacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="grupoId" className="text-xs font-medium">
                    Grupo Econômico / Holding
                  </Label>
                  <Select
                    value={formData.grupoId || "none"}
                    onValueChange={(val) => setFormData({ ...formData, grupoId: val })}
                  >
                    <SelectTrigger id="grupoId">
                      <SelectValue placeholder="Selecione um grupo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (Empresa Avulsa)</SelectItem>
                      {grupos.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.nome} ({g.codigo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="funcionarios" className="text-xs font-medium">
                    Número de Funcionários
                  </Label>
                  <Input
                    id="funcionarios"
                    type="number"
                    min={1}
                    value={formData.funcionarios}
                    onChange={(e) =>
                      setFormData({ ...formData, funcionarios: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="responsavel" className="text-xs font-medium">
                    Responsável no Cliente
                  </Label>
                  <Input
                    id="responsavel"
                    placeholder="Ex: João da Silva (Diretor)"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="convenio" className="text-xs font-medium">
                    Sindicato / Convenção Coletiva
                  </Label>
                  <Input
                    id="convenio"
                    placeholder="Ex: Sindicato dos Comerciários de SP"
                    value={formData.convenio}
                    onChange={(e) => setFormData({ ...formData, convenio: e.target.value })}
                  />
                </div>

                {/* NOVOS CAMPOS */}
                <div className="space-y-1.5">
                  <Label htmlFor="tipo" className="text-xs font-medium">
                    Tipo
                  </Label>
                  <Select
                    value={formData.tipo || "com-movimento"}
                    onValueChange={(val: "com-movimento" | "sem-movimento" | "domestico-pf") =>
                      setFormData((prev) => ({
                        ...prev,
                        tipo: val,
                        fechamento:
                          val === "sem-movimento"
                            ? "Sem Movimento"
                            : prev.fechamento === "Sem Movimento" || prev.fechamento === "Sem movimento"
                              ? "Fechamento padrão até dia 20 de cada mês."
                              : prev.fechamento,
                      }))
                    }
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="com-movimento">Com Movimento</SelectItem>
                      <SelectItem value="sem-movimento">Sem Movimento</SelectItem>
                      <SelectItem value="domestico-pf">Doméstico (PF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="codigoDominio" className="text-xs font-medium">
                    Código no Domínio
                  </Label>
                  <Input
                    id="codigoDominio"
                    placeholder="Ex: 1234"
                    value={formData.codigoDominio || ""}
                    onChange={(e) => setFormData({ ...formData, codigoDominio: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA 2: EQUIPE E RISCO */}
            <TabsContent value="equipe" className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground">
                  Precisa cadastrar um novo Analista, Supervisor ou Carteira?
                </span>
                <Button asChild type="button" variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <Link to="/cadastros">
                    <Settings className="h-3 w-3" /> Gerenciar Opções
                  </Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="carteira" className="text-xs font-medium">
                    Carteira Operacional
                  </Label>
                  <Select
                    value={formData.carteira}
                    onValueChange={(val) => {
                      const sup = resolverSupervisorPorCarteira(val);
                      setFormData({ ...formData, carteira: val, ...(sup ? { supervisor: sup } : {}) });
                    }}
                  >
                    <SelectTrigger id="carteira">
                      <SelectValue placeholder="Selecione a carteira" />
                    </SelectTrigger>
                    <SelectContent>
                      {carteiras.map((c) => (
                        <SelectItem key={c.id} value={c.nome}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="analista" className="text-xs font-medium">
                    Analista Responsável
                  </Label>
                  <Select
                    value={formData.analista}
                    onValueChange={(val) => {
                      const vinculo = resolverVinculoPorAnalista(val);
                      setFormData({ ...formData, analista: val, ...vinculo });
                    }}
                  >
                    <SelectTrigger id="analista">
                      <SelectValue placeholder="Selecione o analista" />
                    </SelectTrigger>
                    <SelectContent>
                      {analistas.map((a) => (
                        <SelectItem key={a.id} value={a.nome}>
                          {a.nome} ({a.cargo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="supervisor" className="text-xs font-medium">
                    Supervisor
                  </Label>
                  <Select
                    value={formData.supervisor}
                    onValueChange={(val) => setFormData({ ...formData, supervisor: val })}
                  >
                    <SelectTrigger id="supervisor">
                      <SelectValue placeholder="Selecione o supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {supervisores.map((s) => (
                        <SelectItem key={s.id} value={s.nome}>
                          {s.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="risco" className="text-xs font-medium">
                    Nível de Risco Trabalhista
                  </Label>
                  <Select
                    value={formData.risco}
                    onValueChange={(val: "baixo" | "medio" | "alto") =>
                      setFormData({ ...formData, risco: val })
                    }
                  >
                    <SelectTrigger id="risco">
                      <SelectValue placeholder="Selecione o risco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixo">Baixo (Operação Simples)</SelectItem>
                      <SelectItem value="medio">Médio (Atenção moderada)</SelectItem>
                      <SelectItem value="alto">Alto (Histórico de autuações/Turnos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs font-medium">
                    Status Inicial
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val: "ativa" | "atencao" | "atraso") =>
                      setFormData({ ...formData, status: val })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Status inicial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa (Sem pendências)</SelectItem>
                      <SelectItem value="atencao">Atenção (Necessita revisão)</SelectItem>
                      <SelectItem value="atraso">Atraso (Pendente regularização)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="certificado" className="text-xs font-medium">
                    Certificado Digital
                  </Label>
                  <Input
                    id="certificado"
                    placeholder="Ex: A1 — vence 20/12/2026"
                    value={formData.certificadoDigital}
                    onChange={(e) =>
                      setFormData({ ...formData, certificadoDigital: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="procuracao" className="text-xs font-medium">
                    Procuração e-CAC / eSocial
                  </Label>
                  <Input
                    id="procuracao"
                    placeholder="Ex: Válida até 31/12/2027"
                    value={formData.procuracao}
                    onChange={(e) => setFormData({ ...formData, procuracao: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA 3: PARTICULARIDADES */}
            <TabsContent value="particularidades" className="mt-4 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fechamento" className="text-xs font-medium">
                    Regra e Forma de Fechamento da Folha
                  </Label>
                  <Input
                    id="fechamento"
                    placeholder="Ex: Fechamento no dia 20, apuração do dia 21 ao 20."
                    value={formData.fechamento}
                    onChange={(e) => setFormData({ ...formData, fechamento: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="envio" className="text-xs font-medium">
                    Forma de Envio dos Relatórios / Guias
                  </Label>
                  <Input
                    id="envio"
                    placeholder="Ex: E-mail para RH + upload no portal."
                    value={formData.envio}
                    onChange={(e) => setFormData({ ...formData, envio: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fluxoAprovacao" className="text-xs font-medium">
                    Fluxo de Aprovação
                  </Label>
                  <Input
                    id="fluxoAprovacao"
                    placeholder="Ex: Analista → Supervisor → Diretoria"
                    value={formData.fluxoAprovacao}
                    onChange={(e) => setFormData({ ...formData, fluxoAprovacao: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                  <div className="space-y-0.5">
                    <Label htmlFor="duplaConferencia" className="text-xs font-medium">
                      Exigir Dupla Conferência
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Supervisor deve validar os cálculos antes do envio da folha.
                    </p>
                  </div>
                  <Switch
                    id="duplaConferencia"
                    checked={formData.duplaConferencia ?? false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, duplaConferencia: checked })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="observacoes" className="text-xs font-medium">
                    Observações e Particularidades Importantes
                  </Label>
                  <Textarea
                    id="observacoes"
                    rows={3}
                    placeholder="Ex: Adicional de periculosidade para setor de produção. Exige homologação sindical para demissões."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 border-t pt-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" className="gap-1.5 text-xs">
              <CheckCircle2 className="h-4 w-4" /> Cadastrar Empresa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
