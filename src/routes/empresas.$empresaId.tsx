import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Pencil,
  X,
  Save,
  Building2,
  UserCheck,
  FileText,
  Search,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/status-badge";
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

import { type Empresa } from "@/lib/mock-data";
import {
  getEmpresaById,
  empresaToForm,
  encontrarEmpresaDuplicada,
  updateEmpresa,
  type NovaEmpresaForm,
} from "@/lib/empresas-store";
import { useCadastros, resolverVinculoPorAnalista, resolverSupervisorPorCarteira } from "@/lib/cadastros-store";
import { useGrupos } from "@/lib/grupos-store";

export const Route = createFileRoute("/empresas/$empresaId")({
  loader: ({ params }): { empresa: Empresa } => {
    const empresa = getEmpresaById(params.empresaId);
    if (!empresa) throw notFound();
    return { empresa };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Empresa não encontrada — DP Control" }, { name: "robots", content: "noindex" }] };
    }
    const t = `${loaderData.empresa.nome} — Ficha do cliente`;
    return {
      meta: [
        { title: t },
        { name: "description", content: `Ficha, particularidades e histórico de ${loaderData.empresa.nome}.` },
        { property: "og:title", content: t },
        { property: "og:description", content: `Particularidades operacionais de ${loaderData.empresa.nome}.` },
      ],
    };
  },
  component: EmpresaDetalhe,
  errorComponent: () => <p className="text-sm text-muted-foreground">Não foi possível carregar a empresa.</p>,
  notFoundComponent: () => <p className="text-sm text-muted-foreground">Empresa não encontrada.</p>,
});

function EmpresaDetalhe() {
  const { empresa } = Route.useLoaderData() as { empresa: Empresa };
  const router = useRouter();
  const p = empresa.particularidades;
  const desatualizada = empresa.diasSemRevisao > 30;

  const [editando, setEditando] = useState(false);
  const [activeTab, setActiveTab] = useState("dados");
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [formData, setFormData] = useState<NovaEmpresaForm>(() => empresaToForm(empresa));

  const { analistas, supervisores, carteiras } = useCadastros();
  const { grupos } = useGrupos();

  useEffect(() => {
    if (!editando) {
      setFormData(empresaToForm(empresa));
    }
  }, [empresa, editando]);

  const formatCNPJ = (value: string) => {
    const raw = value.replace(/\D/g, "").slice(0, 14);
    return raw
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
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
      setFormData((prev) => ({
        ...prev,
        nome: data.razao_social || data.nome_fantasia || prev.nome,
      }));
      toast.success("Dados do CNPJ atualizados!");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível buscar os dados desse CNPJ.");
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  const handleCancelar = () => {
    setFormData(empresaToForm(empresa));
    setActiveTab("dados");
    setEditando(false);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();

    const duplicada = encontrarEmpresaDuplicada(formData.nome, formData.cnpj, empresa.id);
    if (duplicada) {
      toast.error("Empresa duplicada — alteração bloqueada", {
        description:
          duplicada.motivo === "cnpj"
            ? `O CNPJ ${duplicada.empresa.cnpj} já pertence a "${duplicada.empresa.nome}".`
            : `Já existe outra empresa cadastrada como "${duplicada.empresa.nome}".`,
      });
      setActiveTab("dados");
      return;
    }

    try {
      const atualizada = updateEmpresa(empresa.id, formData);
      if (!atualizada) {
        toast.error("Empresa não encontrada para atualização.");
        return;
      }
      toast.success(`Cadastro de "${atualizada.nome}" atualizado com sucesso!`, {
        description: `CNPJ: ${atualizada.cnpj} | Analista: ${atualizada.analista}`,
      });
      setEditando(false);
      router.invalidate();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar a empresa.");
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/empresas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Empresas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{empresa.nome}</h1>
            <StatusBadge status={empresa.status} />
            <StatusBadge status={empresa.risco} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {empresa.cnpj} · {empresa.regime} · {empresa.funcionarios} funcionários
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!editando ? (
            <>
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  setFormData(empresaToForm(empresa));
                  setActiveTab("dados");
                  setEditando(true);
                }}
              >
                <Pencil className="h-4 w-4" /> Editar cadastro
              </Button>
              <Button variant="outline">Registrar revisão</Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" className="gap-1.5" onClick={handleCancelar}>
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button type="submit" form="form-editar-empresa" className="gap-1.5">
                <Save className="h-4 w-4" /> Salvar alterações
              </Button>
            </>
          )}
        </div>
      </div>

      {desatualizada && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Particularidades sem revisão há {empresa.diasSemRevisao} dias
            </p>
            <p className="text-xs text-muted-foreground">
              Última atualização em {empresa.ultimaRevisao}. Revisões são exigidas a cada 30 dias.
            </p>
          </div>
        </div>
      )}

      {/* ── MODO EDIÇÃO ─────────────────────────────────────────────── */}
      {editando ? (
        <form id="form-editar-empresa" onSubmit={handleSalvar} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados" className="gap-1.5 text-xs">
                <Building2 className="h-3.5 w-3.5" /> Cadastro Geral
              </TabsTrigger>
              <TabsTrigger value="equipe" className="gap-1.5 text-xs">
                <UserCheck className="h-3.5 w-3.5" /> Equipe &amp; Risco
              </TabsTrigger>
              <TabsTrigger value="particularidades" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" /> Particularidades
              </TabsTrigger>
            </TabsList>

            {/* ABA 1 — Cadastro Geral */}
            <TabsContent value="dados" className="mt-4">
              <div className="surface-panel grid gap-4 p-5 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-nome" className="text-xs font-medium">Razão Social / Nome Fantasia</Label>
                  <Input
                    id="edit-nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-cnpj" className="text-xs font-medium">CNPJ</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-cnpj"
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
                  <Label htmlFor="edit-regime" className="text-xs font-medium">Regime Tributário</Label>
                  <Select value={formData.regime} onValueChange={(val) => setFormData({ ...formData, regime: val })}>
                    <SelectTrigger id="edit-regime"><SelectValue placeholder="Selecione o regime" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Optante pelo Simples Nacional">Optante pelo Simples Nacional</SelectItem>
                      <SelectItem value="Não Optante pelo Simples Nacional">Não Optante pelo Simples Nacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-grupo" className="text-xs font-medium">Vincular a Grupo Econômico</Label>
                  <Select value={formData.grupoId || "none"} onValueChange={(val) => setFormData({ ...formData, grupoId: val })}>
                    <SelectTrigger id="edit-grupo"><SelectValue placeholder="Selecione um grupo (opcional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Manter vínculo atual</SelectItem>
                      {grupos.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.nome} ({g.codigo})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-funcionarios" className="text-xs font-medium">Número de Funcionários</Label>
                  <Input
                    id="edit-funcionarios"
                    type="number"
                    min={1}
                    value={formData.funcionarios}
                    onChange={(e) => setFormData({ ...formData, funcionarios: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-responsavel" className="text-xs font-medium">Responsável no Cliente</Label>
                  <Input
                    id="edit-responsavel"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-convenio" className="text-xs font-medium">Sindicato / Convenção Coletiva</Label>
                  <Input
                    id="edit-convenio"
                    value={formData.convenio}
                    onChange={(e) => setFormData({ ...formData, convenio: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-tipo" className="text-xs font-medium">Tipo</Label>
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
                    <SelectTrigger id="edit-tipo"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="com-movimento">Com Movimento</SelectItem>
                      <SelectItem value="sem-movimento">Sem Movimento</SelectItem>
                      <SelectItem value="domestico-pf">Doméstico (PF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-codigoDominio" className="text-xs font-medium">Código no Domínio</Label>
                  <Input
                    id="edit-codigoDominio"
                    value={formData.codigoDominio || ""}
                    onChange={(e) => setFormData({ ...formData, codigoDominio: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA 2 — Equipe & Risco */}
            <TabsContent value="equipe" className="mt-4">
              <div className="surface-panel p-5 space-y-4">
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                  <span className="text-xs text-muted-foreground">
                    Precisa cadastrar um novo Analista, Supervisor ou Carteira?
                  </span>
                  <Button asChild type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs">
                    <Link to="/cadastros"><Settings className="h-3 w-3" /> Gerenciar Opções</Link>
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-carteira" className="text-xs font-medium">Carteira Operacional</Label>
                    <Select
                      value={formData.carteira}
                      onValueChange={(val) => {
                        const sup = resolverSupervisorPorCarteira(val);
                        setFormData({ ...formData, carteira: val, ...(sup ? { supervisor: sup } : {}) });
                      }}
                    >
                      <SelectTrigger id="edit-carteira"><SelectValue placeholder="Selecione a carteira" /></SelectTrigger>
                      <SelectContent>
                        {carteiras.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                        {!carteiras.some((c) => c.nome === formData.carteira) && formData.carteira && (
                          <SelectItem value={formData.carteira}>{formData.carteira}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-analista" className="text-xs font-medium">Analista Responsável</Label>
                    <Select
                      value={formData.analista}
                      onValueChange={(val) => {
                        const vinculo = resolverVinculoPorAnalista(val);
                        setFormData({ ...formData, analista: val, ...vinculo });
                      }}
                    >
                      <SelectTrigger id="edit-analista"><SelectValue placeholder="Selecione o analista" /></SelectTrigger>
                      <SelectContent>
                        {analistas.map((a) => (
                          <SelectItem key={a.id} value={a.nome}>{a.nome} ({a.cargo})</SelectItem>
                        ))}
                        {!analistas.some((a) => a.nome === formData.analista) && formData.analista && (
                          <SelectItem value={formData.analista}>{formData.analista}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-supervisor" className="text-xs font-medium">Supervisor</Label>
                    <Select value={formData.supervisor} onValueChange={(val) => setFormData({ ...formData, supervisor: val })}>
                      <SelectTrigger id="edit-supervisor"><SelectValue placeholder="Selecione o supervisor" /></SelectTrigger>
                      <SelectContent>
                        {supervisores.map((s) => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}
                        {!supervisores.some((s) => s.nome === formData.supervisor) && formData.supervisor && (
                          <SelectItem value={formData.supervisor}>{formData.supervisor}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-risco" className="text-xs font-medium">Nível de Risco Trabalhista</Label>
                    <Select
                      value={formData.risco}
                      onValueChange={(val: "baixo" | "medio" | "alto") => setFormData({ ...formData, risco: val })}
                    >
                      <SelectTrigger id="edit-risco"><SelectValue placeholder="Selecione o risco" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixo">Baixo (Operação Simples)</SelectItem>
                        <SelectItem value="medio">Médio (Atenção moderada)</SelectItem>
                        <SelectItem value="alto">Alto (Histórico de autuações/Turnos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-status" className="text-xs font-medium">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(val: "ativa" | "atencao" | "atraso") => setFormData({ ...formData, status: val })}
                    >
                      <SelectTrigger id="edit-status"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativa">Ativa (Sem pendências)</SelectItem>
                        <SelectItem value="atencao">Atenção (Necessita revisão)</SelectItem>
                        <SelectItem value="atraso">Atraso (Pendente regularização)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-certificado" className="text-xs font-medium">Certificado Digital</Label>
                    <Input
                      id="edit-certificado"
                      value={formData.certificadoDigital}
                      onChange={(e) => setFormData({ ...formData, certificadoDigital: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="edit-procuracao" className="text-xs font-medium">Procuração e-CAC / eSocial</Label>
                    <Input
                      id="edit-procuracao"
                      value={formData.procuracao}
                      onChange={(e) => setFormData({ ...formData, procuracao: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ABA 3 — Particularidades */}
            <TabsContent value="particularidades" className="mt-4">
              <div className="surface-panel p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-fechamento" className="text-xs font-medium">
                    Regra e Forma de Fechamento da Folha
                  </Label>
                  <Input
                    id="edit-fechamento"
                    value={formData.fechamento || ""}
                    onChange={(e) => setFormData({ ...formData, fechamento: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-envio" className="text-xs font-medium">
                    Forma de Envio dos Relatórios / Guias
                  </Label>
                  <Input
                    id="edit-envio"
                    value={formData.envio || ""}
                    onChange={(e) => setFormData({ ...formData, envio: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-fluxo" className="text-xs font-medium">Fluxo de Aprovação</Label>
                  <Input
                    id="edit-fluxo"
                    value={formData.fluxoAprovacao || ""}
                    onChange={(e) => setFormData({ ...formData, fluxoAprovacao: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="edit-dupla" className="text-xs font-medium">Exigir Dupla Conferência</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Supervisor deve validar os cálculos antes do envio da folha.
                    </p>
                  </div>
                  <Switch
                    id="edit-dupla"
                    checked={formData.duplaConferencia ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, duplaConferencia: checked })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-observacoes" className="text-xs font-medium">
                    Observações e Particularidades Importantes
                  </Label>
                  <Textarea
                    id="edit-observacoes"
                    rows={4}
                    value={formData.observacoes || ""}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Barra de ações inferior */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" className="gap-1.5 text-xs" onClick={handleCancelar}>
              <X className="h-4 w-4" /> Cancelar
            </Button>
            <Button type="submit" className="gap-1.5 text-xs">
              <Save className="h-4 w-4" /> Salvar alterações
            </Button>
          </div>
        </form>
      ) : (
        /* ── MODO VISUALIZAÇÃO ──────────────────────────────────────── */
        <>
          <section className="space-y-4">
            <SectionTitle title="Dados cadastrais" />
            <div className="surface-panel grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <Campo label="Responsável" value={empresa.responsavel} />
              <Campo label="Carteira" value={empresa.carteira} />
              <Campo label="Analista" value={empresa.analista} />
              <Campo label="Supervisor" value={empresa.supervisor} />
              <Campo label="Regime tributário" value={empresa.regime} />
              <Campo label="Convênio / Sindicato" value={empresa.convenio} />
              <Campo label="Certificado digital" value={empresa.certificadoDigital} />
              <Campo label="Procuração" value={empresa.procuracao} />
              <Campo label="Nível de risco" value={empresa.risco} />
              <Campo label="Funcionários" value={String(empresa.funcionarios)} />
              <Campo label="Última revisão" value={empresa.ultimaRevisao} />
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle title="Particularidades" />
            <div className="surface-panel grid gap-4 p-5 sm:grid-cols-2">
              <Campo label="Forma de fechamento da folha" value={p.fechamento} />
              <Campo label="Forma de envio" value={p.envio} />
              <Campo label="Fluxo de aprovação" value={p.fluxoAprovacao} />
              <Campo label="Dupla conferência" value={p.duplaConferencia ? "Obrigatória" : "Não exigida"} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="surface-panel p-5">
                <h3 className="mb-3 text-sm font-semibold">Rubricas personalizadas</h3>
                <ul className="space-y-2">
                  {p.rubricas.map((r) => (
                    <li key={r} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="surface-panel p-5">
                <h3 className="mb-3 text-sm font-semibold">Eventos e regras próprias</h3>
                <ul className="space-y-2">
                  {p.eventos.map((r) => (
                    <li key={r} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="surface-panel p-5">
              <h3 className="mb-2 text-sm font-semibold">Informações importantes</h3>
              <p className="text-sm text-muted-foreground">{p.observacoes}</p>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle title="Histórico" />
            <div className="surface-panel divide-y p-2">
              {empresa.historico.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">Nenhum registro de histórico.</p>
              )}
              {empresa.historico.map((h, i) => (
                <div key={i} className="flex items-start gap-4 p-3">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{h.data}</span>
                  <div>
                    <p className="text-sm">{h.descricao}</p>
                    <p className="text-xs text-muted-foreground">por {h.usuario}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-1 rounded-full bg-primary" />
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium capitalize-none">{value}</p>
    </div>
  );
}
