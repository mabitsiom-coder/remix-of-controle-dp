import { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  FileUp,
  CheckCircle2,
  AlertCircle,
  Download,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  Building2,
  X,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { sincronizarCadastrosComEmpresas } from "@/lib/cadastros-store";
import { useAuth } from "@/lib/auth-store";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  getStoredEmpresas,
  importarEmpresasEmLote,
} from "@/lib/empresas-store";
import {
  processarPlanilhaImportacao,
  gerarModeloImportacaoExcel,
  gerarRelatorioProcessamentoExcel,
  type PreviaImportacao,
  type ResultadoProcessamento,
} from "@/lib/empresas-excel";

export function ImportarEmpresasDialog({
  trigger,
  onSuccess,
}: {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [etapa, setEtapa] = useState<"upload" | "previa" | "resultado">("upload");
  const [isProcessando, setIsProcessando] = useState(false);
  const [permitirApagarCamposVazios, setPermitirApagarCamposVazios] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [previa, setPrevia] = useState<PreviaImportacao | null>(null);
  const [resultado, setResultado] = useState<ResultadoProcessamento | null>(null);
  const [buscaPrevia, setBuscaPrevia] = useState("");
  const [abaPrevia, setAbaPrevia] = useState<string>("todas");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetDialog = () => {
    setEtapa("upload");
    setPrevia(null);
    setResultado(null);
    setBuscaPrevia("");
    setAbaPrevia("todas");
    setIsProcessando(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsProcessando(true);

    try {
      const empresasAtuais = getStoredEmpresas();
      const resultadoPrevia = await processarPlanilhaImportacao(file, empresasAtuais, {
        permitirApagarCamposVazios,
      });

      setPrevia(resultadoPrevia);
      setEtapa("previa");

      if (resultadoPrevia.erros.length > 0 && resultadoPrevia.novas.length === 0 && resultadoPrevia.alteradas.length === 0) {
        setAbaPrevia("erros");
      } else if (resultadoPrevia.alteradas.length > 0) {
        setAbaPrevia("alteradas");
      } else if (resultadoPrevia.novas.length > 0) {
        setAbaPrevia("novas");
      } else {
        setAbaPrevia("todas");
      }

      toast.info("Planilha processada com sucesso. Revise a prévia antes de confirmar.");
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Erro ao ler a planilha.";
      toast.error(msg);
    } finally {
      setIsProcessando(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirmarImportacao = () => {
    if (!previa) return;

    try {
      const usuarioNome = currentUser?.nome || "Administrador";
      const res = importarEmpresasEmLote(
        previa.novas,
        previa.alteradas,
        usuarioNome,
        previa.nomeArquivo
      );

      // Sincroniza cadastros auxiliares
      sincronizarCadastrosComEmpresas(getStoredEmpresas());

      const dataHora = new Date().toLocaleString("pt-BR");
      const resProcessamento: ResultadoProcessamento = {
        nomeArquivo: previa.nomeArquivo,
        totalLinhas: previa.totalLinhas,
        cadastradasCount: res.criadas,
        atualizadasCount: res.atualizadas,
        semAlteracaoCount: previa.semAlteracao.length,
        errosCount: previa.erros.length,
        novas: previa.novas,
        alteradas: previa.alteradas,
        semAlteracao: previa.semAlteracao,
        erros: previa.erros,
        dataHora,
      };

      setResultado(resProcessamento);
      setEtapa("resultado");
      setConfirmDialogOpen(false);

      toast.success(
        `Importação concluída! ${res.criadas} nova(s) empresa(s) e ${res.atualizadas} atualizada(s).`
      );

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao aplicar as alterações no banco de dados.");
    }
  };

  // Filtros de busca na prévia
  const termo = buscaPrevia.trim().toLowerCase();

  const novasFiltradas = (previa?.novas || []).filter(
    (n) => !termo || n.nome.toLowerCase().includes(termo) || n.cnpj.includes(termo)
  );

  const alteradasFiltradas = (previa?.alteradas || []).filter(
    (a) => !termo || a.nome.toLowerCase().includes(termo) || a.cnpj.includes(termo)
  );

  const semAlteracaoFiltradas = (previa?.semAlteracao || []).filter(
    (s) => !termo || s.nome.toLowerCase().includes(termo) || s.cnpj.includes(termo)
  );

  const errosFiltrados = (previa?.erros || []).filter(
    (e) =>
      !termo ||
      e.empresa.toLowerCase().includes(termo) ||
      e.cnpj.includes(termo) ||
      e.campo.toLowerCase().includes(termo) ||
      e.problema.toLowerCase().includes(termo)
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetDialog();
        }}
      >
        <DialogTrigger asChild>
          {trigger || (
            <Button
              variant="outline"
              className="gap-2 border-emerald-600/30 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" /> Importar Excel
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 sm:rounded-xl gap-0">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-bold">
                  {etapa === "upload" && "Importar Empresas por Planilha Excel"}
                  {etapa === "previa" && "Prévia da Importação e Validações"}
                  {etapa === "resultado" && "Resultado da Importação"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {etapa === "upload" &&
                    "Envie sua planilha .xlsx para cadastrar novas empresas ou atualizar em massa carteiras, analistas e dados cadastrais."}
                  {etapa === "previa" &&
                    `Arquivo: "${previa?.nomeArquivo}" — Verifique as alterações antes de persistir no banco.`}
                  {etapa === "resultado" &&
                    "As alterações foram processadas e persistidas com sucesso no DP Control Center."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* CORPO DO DIALOG CONFORME A ETAPA */}
          <div className="flex-1 overflow-y-auto py-4">
            {/* ETAPA 1: UPLOAD */}
            {etapa === "upload" && (
              <div className="space-y-6">
                {/* Zona de Drop */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                    isDragOver
                      ? "border-primary bg-primary/10 scale-[0.99]"
                      : "border-muted-foreground/30 bg-muted/20 hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex h-14 w-14 mx-auto mb-4 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Upload className="h-7 w-7" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Arraste sua planilha Excel aqui ou clique para selecionar
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto">
                    Formatos aceitos: <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong>. O CNPJ é utilizado como chave única de identificação da empresa.
                  </p>

                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                  />

                  <div className="mt-5 flex justify-center gap-3">
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessando}
                      className="gap-2 font-medium cursor-pointer"
                    >
                      {isProcessando ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" /> Analisando planilha...
                        </>
                      ) : (
                        <>
                          <FileUp className="h-4 w-4" /> Selecionar Arquivo Excel
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Opção de segurança: Células Vazias */}
                <div className="rounded-xl border bg-card p-4 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Label
                        htmlFor="permitir-apagar"
                        className="text-xs font-semibold text-foreground cursor-pointer"
                      >
                        Permitir que células vazias apaguem dados existentes
                      </Label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Quando <strong>desativado (padrão)</strong>, células em branco no Excel preservarão as informações já salvas no banco. Ative apenas se desejar limpar dados cadastrados.
                      </p>
                    </div>
                    <Switch
                      id="permitir-apagar"
                      checked={permitirApagarCamposVazios}
                      onCheckedChange={setPermitirApagarCamposVazios}
                    />
                  </div>
                </div>

                {/* Bloco Modelo de Download */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Download className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Ainda não tem a planilha modelo?</p>
                      <p className="text-muted-foreground text-[11px]">
                        Baixe o modelo oficial com as 8 colunas já configuradas.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={gerarModeloImportacaoExcel}
                    className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 text-xs font-medium cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Baixar Modelo (.xlsx)
                  </Button>
                </div>
              </div>
            )}

            {/* ETAPA 2: PRÉVIA */}
            {etapa === "previa" && previa && (
              <div className="space-y-5">
                {/* Métricas / Resumo */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                  <div className="rounded-lg border bg-muted/40 p-2.5">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Total Linhas</span>
                    <p className="text-lg font-bold text-foreground mt-0.5">{previa.totalLinhas}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-emerald-800 dark:text-emerald-300">
                    <span className="text-[10px] uppercase font-semibold">Novas</span>
                    <p className="text-lg font-bold mt-0.5">{previa.novas.length}</p>
                  </div>
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5 text-blue-800 dark:text-blue-300">
                    <span className="text-[10px] uppercase font-semibold">Atualizações</span>
                    <p className="text-lg font-bold mt-0.5">{previa.alteradas.length}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-2.5 text-muted-foreground">
                    <span className="text-[10px] uppercase font-semibold">Sem Mudança</span>
                    <p className="text-lg font-bold text-foreground mt-0.5">{previa.semAlteracao.length}</p>
                  </div>
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-destructive">
                    <span className="text-[10px] uppercase font-semibold">Com Erro</span>
                    <p className="text-lg font-bold mt-0.5">{previa.erros.length}</p>
                  </div>
                </div>

                {/* Filtro de Busca */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Filtrar por nome da empresa ou CNPJ na prévia..."
                      value={buscaPrevia}
                      onChange={(e) => setBuscaPrevia(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  {buscaPrevia && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBuscaPrevia("")}
                      className="h-8 px-2 text-xs"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Limpar
                    </Button>
                  )}
                </div>

                {/* Abas com as tabelas de detalhes */}
                <Tabs value={abaPrevia} onValueChange={setAbaPrevia} className="w-full">
                  <TabsList className="grid grid-cols-5 h-9 bg-muted p-1">
                    <TabsTrigger value="todas" className="text-xs">
                      Todas ({previa.totalLinhas})
                    </TabsTrigger>
                    <TabsTrigger value="alteradas" className="text-xs text-blue-700 dark:text-blue-400">
                      Alteradas ({previa.alteradas.length})
                    </TabsTrigger>
                    <TabsTrigger value="novas" className="text-xs text-emerald-700 dark:text-emerald-400">
                      Novas ({previa.novas.length})
                    </TabsTrigger>
                    <TabsTrigger value="semAlteracao" className="text-xs">
                      Sem Alteração ({previa.semAlteracao.length})
                    </TabsTrigger>
                    <TabsTrigger value="erros" className="text-xs text-destructive font-semibold">
                      Erros ({previa.erros.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* ABA: TODAS */}
                  <TabsContent value="todas" className="mt-3">
                    <ScrollArea className="h-[280px] rounded-lg border p-3">
                      <div className="space-y-2 text-xs">
                        {alteradasFiltradas.map((alt) => (
                          <div
                            key={alt.cnpj}
                            className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 text-[10px]">
                                  Linha {alt.linhaArquivo} · Atualização
                                </Badge>
                                <span className="font-bold text-foreground">{alt.nome}</span>
                              </div>
                              <span className="text-muted-foreground text-[11px] font-mono">{alt.cnpj}</span>
                            </div>
                            <div className="grid gap-1.5 pt-1 border-t border-blue-500/10">
                              {alt.alteracoes.map((c) => (
                                <div key={c.campo} className="flex items-center gap-2 text-[11px]">
                                  <span className="font-medium text-muted-foreground w-24 shrink-0">{c.label}:</span>
                                  <span className="line-through text-muted-foreground">{String(c.valorAtual)}</span>
                                  <ArrowRight className="h-3 w-3 text-blue-600 shrink-0" />
                                  <span className="font-bold text-blue-700 dark:text-blue-400">{String(c.novoValor)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {novasFiltradas.map((n) => (
                          <div
                            key={n.cnpj}
                            className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 text-[10px]">
                                  Linha {n.linhaArquivo} · Nova Empresa
                                </Badge>
                                <span className="font-bold text-foreground">{n.nome}</span>
                              </div>
                              <span className="text-muted-foreground text-[11px] font-mono">{n.cnpj}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1">
                              <span>Carteira: <strong className="text-foreground">{n.carteira}</strong></span>
                              <span>Analista: <strong className="text-foreground">{n.analista}</strong></span>
                              <span>Supervisor: <strong className="text-foreground">{n.supervisor}</strong></span>
                              <span>Funcionários: <strong className="text-foreground">{n.funcionarios}</strong></span>
                              <span>Situação: <strong className="text-foreground">{n.tipo === "sem-movimento" ? "Sem movimento" : "Com movimento"}</strong></span>
                            </div>
                          </div>
                        ))}

                        {semAlteracaoFiltradas.map((s) => (
                          <div
                            key={s.cnpj}
                            className="flex items-center justify-between rounded-lg border bg-muted/20 p-2.5 text-muted-foreground"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                Linha {s.linhaArquivo}
                              </Badge>
                              <span className="font-medium text-foreground">{s.nome}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="font-mono">{s.cnpj}</span>
                              <span className="text-[10px] text-muted-foreground">Sem alterações</span>
                            </div>
                          </div>
                        ))}

                        {errosFiltrados.map((e, idx) => (
                          <div
                            key={`${e.linhaArquivo}-${idx}`}
                            className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive flex items-start gap-2"
                          >
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold">Linha {e.linhaArquivo}:</span> {e.empresa} ({e.cnpj}) — Campo <strong>{e.campo}</strong>: {e.problema}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* ABA: ALTERADAS */}
                  <TabsContent value="alteradas" className="mt-3">
                    <ScrollArea className="h-[280px] rounded-lg border p-3">
                      {alteradasFiltradas.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">Nenhuma empresa para alterar.</p>
                      ) : (
                        <div className="space-y-3 text-xs">
                          {alteradasFiltradas.map((alt) => (
                            <div
                              key={alt.cnpj}
                              className="rounded-xl border border-blue-500/30 bg-card p-3 shadow-2xs space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-foreground text-sm">{alt.nome}</span>
                                  <span className="text-muted-foreground text-xs ml-2 font-mono">{alt.cnpj}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700">
                                  Linha {alt.linhaArquivo}
                                </Badge>
                              </div>

                              {/* Tabela de Diff */}
                              <div className="rounded-lg border overflow-hidden">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-muted/60 text-[10px] uppercase text-muted-foreground border-b">
                                    <tr>
                                      <th className="p-2">Campo</th>
                                      <th className="p-2">Valor Atual</th>
                                      <th className="p-2">Novo Valor (Planilha)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {alt.alteracoes.map((c) => (
                                      <tr key={c.campo} className="hover:bg-muted/30">
                                        <td className="p-2 font-medium text-foreground">{c.label}</td>
                                        <td className="p-2 text-muted-foreground line-through">{String(c.valorAtual)}</td>
                                        <td className="p-2 font-bold text-blue-700 dark:text-blue-400 bg-blue-500/5">
                                          {String(c.novoValor)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {/* ABA: NOVAS */}
                  <TabsContent value="novas" className="mt-3">
                    <ScrollArea className="h-[280px] rounded-lg border p-3">
                      {novasFiltradas.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">Nenhuma nova empresa identificada.</p>
                      ) : (
                        <div className="space-y-2.5 text-xs">
                          {novasFiltradas.map((n) => (
                            <div
                              key={n.cnpj}
                              className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-foreground text-sm">{n.nome}</span>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 text-[10px]">
                                  Linha {n.linhaArquivo}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-background/80 p-2.5 rounded-md border">
                                <div><span className="text-muted-foreground">CNPJ:</span> <span className="font-mono font-medium">{n.cnpj}</span></div>
                                <div><span className="text-muted-foreground">Carteira:</span> <span className="font-medium">{n.carteira}</span></div>
                                <div><span className="text-muted-foreground">Analista:</span> <span className="font-medium">{n.analista}</span></div>
                                <div><span className="text-muted-foreground">Supervisor:</span> <span className="font-medium">{n.supervisor}</span></div>
                                <div><span className="text-muted-foreground">Funcionários:</span> <span className="font-medium">{n.funcionarios}</span></div>
                                <div><span className="text-muted-foreground">Movimento:</span> <span className="font-medium">{n.tipo === "sem-movimento" ? "Sem movimento" : "Com movimento"}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {/* ABA: SEM ALTERAÇÃO */}
                  <TabsContent value="semAlteracao" className="mt-3">
                    <ScrollArea className="h-[280px] rounded-lg border p-3">
                      {semAlteracaoFiltradas.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">Nenhum registro idêntico.</p>
                      ) : (
                        <div className="space-y-1.5 text-xs">
                          {semAlteracaoFiltradas.map((s) => (
                            <div
                              key={s.cnpj}
                              className="flex items-center justify-between rounded-lg border bg-muted/20 p-2.5"
                            >
                              <div>
                                <span className="font-semibold text-foreground">{s.nome}</span>
                                <span className="text-muted-foreground text-xs ml-2 font-mono">{s.cnpj}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                Linha {s.linhaArquivo} · Sem Alterações
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {/* ABA: ERROS */}
                  <TabsContent value="erros" className="mt-3">
                    <ScrollArea className="h-[280px] rounded-lg border p-3">
                      {errosFiltrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                          <p className="text-xs font-semibold text-foreground">Nenhum erro encontrado na planilha</p>
                          <p className="text-[11px] text-muted-foreground">Todos os registros são válidos para processamento.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 text-xs">
                          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive font-medium flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>
                              {errosFiltrados.length} linha(s) com erro não serão processadas. Corrija o arquivo ou prossiga com os registros válidos.
                            </span>
                          </div>
                          {errosFiltrados.map((e, idx) => (
                            <div
                              key={`${e.linhaArquivo}-${idx}`}
                              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1"
                            >
                              <div className="flex items-center justify-between text-destructive">
                                <span className="font-bold">Linha {e.linhaArquivo}</span>
                                <Badge variant="destructive" className="text-[10px]">
                                  Campo: {e.campo}
                                </Badge>
                              </div>
                              <p className="text-foreground font-medium">{e.empresa} ({e.cnpj})</p>
                              <p className="text-destructive text-[11px]">{e.problema}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* ETAPA 3: RESULTADO */}
            {etapa === "resultado" && resultado && (
              <div className="space-y-6 text-center py-4">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Importação Finalizada com Sucesso!</h3>
                  <p className="text-xs text-muted-foreground">
                    Os dados foram gravados e já estão disponíveis em todas as telas e relatórios do sistema.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-xs">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">Cadastradas</span>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {resultado.cadastradasCount}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">Atualizadas</span>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      {resultado.atualizadasCount}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">Sem Alteração</span>
                    <p className="text-lg font-bold text-muted-foreground mt-0.5">
                      {resultado.semAlteracaoCount}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">Erros Ignorados</span>
                    <p className="text-lg font-bold text-destructive mt-0.5">
                      {resultado.errosCount}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => gerarRelatorioProcessamentoExcel(resultado)}
                    className="gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs font-medium cursor-pointer"
                  >
                    <Download className="h-4 w-4" /> Baixar Relatório de Processamento em Excel (.xlsx)
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* RODAPÉ DO MODAL */}
          <DialogFooter className="pt-4 border-t gap-2 sm:justify-between">
            {etapa === "upload" && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="text-xs"
                >
                  Fechar
                </Button>
                <div />
              </>
            )}

            {etapa === "previa" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEtapa("upload");
                    setPrevia(null);
                  }}
                  className="text-xs"
                >
                  Trocar Arquivo
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!previa || (previa.novas.length === 0 && previa.alteradas.length === 0)}
                    onClick={() => setConfirmDialogOpen(true)}
                    className="gap-1.5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Confirmar Importação
                  </Button>
                </div>
              </>
            )}

            {etapa === "resultado" && (
              <div className="w-full flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    resetDialog();
                  }}
                  className="text-xs font-semibold"
                >
                  Concluir
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÃO OBRIGATÓRIA ANTES DE GRAVAR NO BANCO */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Importação de Empresas?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Esta importação irá <strong>cadastrar {previa?.novas.length || 0} nova(s) empresa(s)</strong> e{" "}
              <strong>atualizar {previa?.alteradas.length || 0} empresa(s) existente(s)</strong>.
              {previa?.erros && previa.erros.length > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Atenção: {previa.erros.length} linha(s) com erro serão ignoradas.
                </span>
              )}
              <span className="block mt-2">Deseja continuar com as alterações no banco de dados?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground text-xs font-semibold"
              onClick={handleConfirmarImportacao}
            >
              Sim, Confirmar e Gravar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
