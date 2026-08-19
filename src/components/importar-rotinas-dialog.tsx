import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ListChecks,
} from "lucide-react";
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
import {
  createBatchTarefas,
  getStoredTarefas,
  type NovaTarefaForm,
} from "@/lib/tarefas-store";
import type { PeriodicidadeRotina, Prioridade } from "@/lib/mock-data";
import { PERIODICIDADES, parseData } from "@/lib/rotinas-view";

type LinhaPlanilha = {
  linhaNum: number;
  rotina: string;
  descricao: string;
  periodicidadeBruta: string;
  periodicidadeValida?: PeriodicidadeRotina | undefined;
  dataBaseBruta: string;
  dataBaseFormatada?: string | undefined; // YYYY-MM-DD
  checklistItens: string;
  checklistQtd: number;
  responsavel: string;
  prioridade: Prioridade;
  categoria: string;
  observacao: string;
  status: "valido" | "erro" | "duplicado";
  motivo?: string | undefined;
};

// Normalizador tolerante para periodicidade
function normalizarPeriodicidade(val: string): PeriodicidadeRotina | null {
  if (!val) return "Diária";
  const s = val
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (s === "diaria" || s === "diario" || s === "dia" || s === "diariamente") return "Diária";
  if (s === "mensal" || s === "mes" || s === "mensalmente") return "Mensal";
  if (s === "trimestral" || s === "trimestre" || s === "trimestralmente") return "Trimestral";
  if (s === "semestral" || s === "semestre" || s === "semestralmente") return "Semestral";
  if (s === "anual" || s === "ano" || s === "anualmente") return "Anual";

  return "Diária";
}

// Normalizador de prioridade
function normalizarPrioridade(val: string): Prioridade {
  if (!val) return "media";
  const s = val.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (s.includes("crit") || s.includes("urgente")) return "critica";
  if (s.includes("alt")) return "alta";
  if (s.includes("baix")) return "baixa";
  return "media";
}

// Formatador tolerante de datas do Excel (texto BR, ISO ou número serial)
function normalizarDataExcel(val: unknown): { iso: string; formattedBr: string } | null {
  if (val === null || val === undefined || val === "") return null;

  // Número serial do Excel (ex: 45564)
  if (typeof val === "number" && !isNaN(val)) {
    const dataJs = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(dataJs.getTime())) {
      const ano = dataJs.getUTCFullYear();
      const mes = String(dataJs.getUTCMonth() + 1).padStart(2, "0");
      const dia = String(dataJs.getUTCDate()).padStart(2, "0");
      return {
        iso: `${ano}-${mes}-${dia}`,
        formattedBr: `${dia}/${mes}/${ano}`,
      };
    }
  }

  // Se já for Date
  if (val instanceof Date && !isNaN(val.getTime())) {
    const ano = val.getFullYear();
    const mes = String(val.getMonth() + 1).padStart(2, "0");
    const dia = String(val.getDate()).padStart(2, "0");
    return {
      iso: `${ano}-${mes}-${dia}`,
      formattedBr: `${dia}/${mes}/${ano}`,
    };
  }

  const str = String(val).trim();
  const parsed = parseData(str);
  if (parsed && !isNaN(parsed.getTime())) {
    const ano = parsed.getFullYear();
    const mes = String(parsed.getMonth() + 1).padStart(2, "0");
    const dia = String(parsed.getDate()).padStart(2, "0");
    return {
      iso: `${ano}-${mes}-${dia}`,
      formattedBr: `${dia}/${mes}/${ano}`,
    };
  }

  return null;
}

export function downloadModeloXLSX() {
  const dados = [
    [
      "Rotina",
      "Descrição",
      "Periodicidade",
      "Data-base",
      "Checklist (itens separados por ;)",
      "Responsável",
      "Prioridade",
      "Categoria",
      "Observação",
    ],
    [
      "Fechamento de Ponto Diário",
      "Tratamento de inconsistências de ponto dos colaboradores",
      "Diária",
      "20/08/2026",
      "Coletar batidas dos relógios REP; Tratar marcações ímpares; Justificar ausências e atestados; Emitir espelho para aprovação",
      "Camila Rocha",
      "Alta",
      "Folha",
      "Executar preferencialmente no primeiro horário",
    ],
    [
      "Admissões do Dia",
      "Conferência e cadastro de novos colaboradores",
      "Diária",
      "20/08/2026",
      "Conferir documentos recebidos; Cadastrar dados no sistema; Transmitir evento S-2200 eSocial; Gerar contrato e termo de admissão",
      "Diego Menezes",
      "Alta",
      "Admissões",
      "Transmitir antes do início das atividades",
    ],
    [
      "Processamento de Rescisões",
      "Cálculo e homologação de desligamentos",
      "Diária",
      "20/08/2026",
      "Calcular termo rescisório; Emitir guia rescisória GRRF/FGTS; Transmitir S-2299 eSocial; Enviar documentos para pagamento",
      "Tatiane Lopes",
      "Alta",
      "Demissões",
      "Atentar para o prazo legal de 10 dias",
    ],
    [
      "Conferência e Envio de DCTFWeb",
      "Fechamento da DCTFWeb e emissão de DARF",
      "Mensal",
      "15/09/2026",
      "Transmitir eSocial S-1299; Transmitir EFD-Reinf R-2099; Acessar portal DCTFWeb; Conferir débitos e créditos; Transmitir e emitir guia",
      "Ariany",
      "Crítica",
      "DCTFWeb",
      "Vencimento dia 15",
    ],
    [
      "Pesquisa FGTS Trimestral",
      "Auditoria de recolhimentos de FGTS das empresas",
      "Trimestral",
      "30/09/2026",
      "Solicitar extrato consolidado Caixa; Baixar arquivos de retorno; Analisar competências com divergência; Notificar cliente",
      "Rafael Prado",
      "Média",
      "FGTS",
      "Rotina preventiva de regularidade",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(dados);

  // Ajustar larguras das colunas
  ws["!cols"] = [
    { wch: 32 }, // Rotina
    { wch: 38 }, // Descrição
    { wch: 15 }, // Periodicidade
    { wch: 14 }, // Data-base
    { wch: 55 }, // Checklist
    { wch: 20 }, // Responsável
    { wch: 14 }, // Prioridade
    { wch: 16 }, // Categoria
    { wch: 35 }, // Observação
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tarefas e Rotinas");
  XLSX.writeFile(wb, "modelo_tarefas_diarias_rotinas.xlsx");
  toast.success("Modelo XLSX baixado com sucesso!");
}

export function ImportarRotinasDialog({
  trigger,
  onSuccess,
}: {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [linhas, setLinhas] = useState<LinhaPlanilha[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState<string>("");
  const [isProcessando, setIsProcessando] = useState(false);
  const [isArrastando, setIsArrastando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processarArquivo = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls) ou .csv");
      return;
    }

    setIsProcessando(true);
    setNomeArquivo(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const firstSheet = wb.Sheets[wb.SheetNames[0] ?? ""];

      if (!firstSheet) {
        toast.error("A planilha está vazia.");
        setIsProcessando(false);
        return;
      }

      const rows: unknown[][] = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
        raw: true,
        defval: "",
      });

      if (rows.length <= 1) {
        toast.error("Nenhuma linha de dados encontrada na planilha.");
        setIsProcessando(false);
        return;
      }

      // Identificar índices das colunas no cabeçalho
      const headerRow = (rows[0] as unknown[]).map((c) =>
        String(c ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      );

      let idxRotina = headerRow.findIndex((h) => h.includes("rotina") || h.includes("tarefa") || h.includes("titulo") || h.includes("nome"));
      let idxDesc = headerRow.findIndex((h) => h.includes("desc"));
      let idxPeriod = headerRow.findIndex((h) => h.includes("period") || h.includes("recorr"));
      let idxData = headerRow.findIndex((h) => h.includes("data") || h.includes("prazo") || h.includes("base") || h.includes("venc"));
      let idxChecklist = headerRow.findIndex((h) => h.includes("check") || h.includes("itens") || h.includes("etapas"));
      let idxResp = headerRow.findIndex((h) => h.includes("resp") || h.includes("analista") || h.includes("usuario"));
      let idxPrio = headerRow.findIndex((h) => h.includes("prio"));
      let idxCat = headerRow.findIndex((h) => h.includes("categ") || h.includes("depto") || h.includes("area"));
      let idxObs = headerRow.findIndex((h) => h.includes("obs"));

      // Fallbacks padrão se não bater
      if (idxRotina === -1) idxRotina = 0;
      if (idxDesc === -1) idxDesc = 1;
      if (idxPeriod === -1) idxPeriod = 2;
      if (idxData === -1) idxData = 3;
      if (idxChecklist === -1) idxChecklist = 4;
      if (idxResp === -1) idxResp = 5;
      if (idxPrio === -1) idxPrio = 6;
      if (idxCat === -1) idxCat = 7;
      if (idxObs === -1) idxObs = 8;

      const existentes = getStoredTarefas();
      const mapExistentes = new Set(
        existentes.map(
          (e) =>
            `${(e.titulo || "").toLowerCase().trim()}|${e.periodicidade ?? ""}|${e.prazo ?? ""}`
        )
      );

      const parsedLinhas: LinhaPlanilha[] = [];
      const setNoArquivo = new Set<string>();

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const rotina = String(row[idxRotina] ?? "").trim();
        const desc = String(row[idxDesc] ?? "").trim();
        const periodBruta = String(row[idxPeriod] ?? "").trim();
        const dataBruta = row[idxData];
        const checklistBruto = String(row[idxChecklist] ?? "").trim();
        const resp = String(row[idxResp] ?? "").trim();
        const prioBruta = String(row[idxPrio] ?? "").trim();
        const cat = String(row[idxCat] ?? "").trim();
        const obs = String(row[idxObs] ?? "").trim();

        // Ignorar linhas completamente vazias
        if (!rotina && !desc && !periodBruta && !dataBruta && !checklistBruto) continue;

        const linhaNum = i + 1;

        if (!rotina) {
          parsedLinhas.push({
            linhaNum,
            rotina: "—",
            descricao: desc,
            periodicidadeBruta: periodBruta,
            dataBaseBruta: String(dataBruta ?? ""),
            checklistItens: checklistBruto,
            checklistQtd: 0,
            responsavel: resp,
            prioridade: "media",
            categoria: cat || "Geral",
            observacao: obs,
            status: "erro",
            motivo: "Nome da rotina/tarefa é obrigatório.",
          });
          continue;
        }

        const dataNorm = normalizarDataExcel(dataBruta);
        const periodicidadeValida = normalizarPeriodicidade(periodBruta) || "Diária";
        const prioridade = normalizarPrioridade(prioBruta);

        // Contagem de itens do checklist
        const itensChecklist = checklistBruto
          ? checklistBruto.split(/[;\n]/).map((s) => s.trim()).filter(Boolean)
          : [];

        // Chave de unicidade
        const chave = `${rotina.toLowerCase()}|${periodicidadeValida}|${dataNorm?.formattedBr ?? ""}`;

        let status: LinhaPlanilha["status"] = "valido";
        let motivo: string | undefined = undefined;

        if (mapExistentes.has(chave) || setNoArquivo.has(chave)) {
          status = "duplicado";
          motivo = "Rotina já cadastrada com os mesmos dados.";
        }

        setNoArquivo.add(chave);

        parsedLinhas.push({
          linhaNum,
          rotina,
          descricao: desc,
          periodicidadeBruta: periodBruta,
          periodicidadeValida,
          dataBaseBruta: String(dataBruta ?? ""),
          dataBaseFormatada: dataNorm?.formattedBr,
          checklistItens: itensChecklist.join("\n"),
          checklistQtd: itensChecklist.length,
          responsavel: resp,
          prioridade,
          categoria: cat || "Folha",
          observacao: obs,
          status,
          motivo,
        });
      }

      setLinhas(parsedLinhas);
      setIsProcessando(false);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Erro ao ler planilha. Verifique o formato do arquivo.");
      setIsProcessando(false);
    }
  };

  const handleSalvar = () => {
    const validas = linhas.filter((l) => l.status === "valido");

    if (validas.length === 0) {
      toast.error("Nenhuma linha válida para importar.");
      return;
    }

    const novas: NovaTarefaForm[] = validas.map((l) => ({
      titulo: l.rotina,
      descricao: l.descricao || undefined,
      periodicidade: l.periodicidadeValida,
      prazo: l.dataBaseFormatada || new Date().toLocaleDateString("pt-BR"),
      checklistItens: l.checklistItens || undefined,
      responsavel: l.responsavel || undefined,
      prioridade: l.prioridade,
      categoria: l.categoria || "Folha",
      observacoes: l.observacao || undefined,
      horasPrevistas: 1,
      status: "backlog",
    }));

    createBatchTarefas(novas);

    toast.success(`${validas.length} tarefa(s) e rotina(s) importada(s) com sucesso!`);
    setOpen(false);
    setLinhas([]);
    setNomeArquivo("");
    if (onSuccess) onSuccess();
  };

  const resetar = () => {
    setLinhas([]);
    setNomeArquivo("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const totalValidas = linhas.filter((l) => l.status === "valido").length;
  const totalErros = linhas.filter((l) => l.status === "erro").length;
  const totalDuplicadas = linhas.filter((l) => l.status === "duplicado").length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Importar XLSX
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Importar Tarefas Diárias e Rotinas (.xlsx)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Envie sua planilha Excel (.xlsx) contendo a lista de tarefas, periodicidade e itens de checklist.
          </DialogDescription>
        </DialogHeader>

        {linhas.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-6">
            {/* Download do modelo */}
            <div className="w-full max-w-lg rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 text-center">
              <p className="text-xs font-semibold text-emerald-950 dark:text-emerald-300">
                Ainda não tem o arquivo de layout?
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
                Baixe o modelo oficial com colunas de tarefas, data-base e checklist pré-formatado.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadModeloXLSX}
                className="gap-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
              >
                <Download className="h-4 w-4" />
                Baixar Modelo Excel (.xlsx)
              </Button>
            </div>

            {/* Zona de Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsArrastando(true);
              }}
              onDragLeave={() => setIsArrastando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsArrastando(false);
                if (e.dataTransfer.files?.[0]) {
                  void processarArquivo(e.dataTransfer.files[0]);
                }
              }}
              className={`w-full max-w-lg rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                isArrastando
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-muted-foreground/30 hover:border-primary/50"
              }`}
            >
              <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
              <p className="text-sm font-semibold">
                Arraste o arquivo .xlsx aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Suporta formatos .xlsx, .xls e .csv
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    void processarArquivo(e.target.files[0]);
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isProcessando}
                onClick={() => fileInputRef.current?.click()}
              >
                {isProcessando ? "Lendo planilha..." : "Selecionar Arquivo"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden py-2">
            {/* Barra de resumo */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-xs">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-foreground">
                  Arquivo: <span className="font-normal text-muted-foreground">{nomeArquivo}</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {totalValidas} válida(s)
                </span>
                {totalDuplicadas > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" /> {totalDuplicadas} duplicada(s)
                  </span>
                )}
                {totalErros > 0 && (
                  <span className="flex items-center gap-1 text-rose-600 font-semibold">
                    <XCircle className="h-3.5 w-3.5" /> {totalErros} com erro
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={resetar} className="h-7 text-xs gap-1">
                <RotateCcw className="h-3 w-3" /> Trocar arquivo
              </Button>
            </div>

            {/* Tabela de Preview */}
            <div className="flex-1 overflow-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2 text-center w-12">Linha</th>
                    <th className="p-2 text-left">Rotina / Tarefa</th>
                    <th className="p-2 text-left">Periodicidade</th>
                    <th className="p-2 text-left">Data-base</th>
                    <th className="p-2 text-center">Checklist</th>
                    <th className="p-2 text-left">Responsável</th>
                    <th className="p-2 text-left">Prioridade</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {linhas.map((l, idx) => (
                    <tr
                      key={idx}
                      className={
                        l.status === "erro"
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          : l.status === "duplicado"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : "hover:bg-muted/40"
                      }
                    >
                      <td className="p-2 text-center font-mono">{l.linhaNum}</td>
                      <td className="p-2 font-medium max-w-[200px] truncate">
                        {l.rotina}
                        {l.descricao && (
                          <p className="text-[10px] text-muted-foreground truncate">{l.descricao}</p>
                        )}
                      </td>
                      <td className="p-2">{l.periodicidadeValida ?? l.periodicidadeBruta}</td>
                      <td className="p-2 font-mono">
                        {l.dataBaseFormatada || l.dataBaseBruta || "Hoje"}
                      </td>
                      <td className="p-2 text-center">
                        {l.checklistQtd > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary px-1.5 py-0.5 font-bold">
                            <ListChecks className="h-3 w-3" /> {l.checklistQtd} itens
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground">{l.responsavel || "—"}</td>
                      <td className="p-2 capitalize">{l.prioridade}</td>
                      <td className="p-2">
                        {l.status === "valido" && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="h-3 w-3" /> Pronta
                          </span>
                        )}
                        {l.status === "duplicado" && (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-medium" title={l.motivo}>
                            <AlertTriangle className="h-3 w-3" /> Duplicada
                          </span>
                        )}
                        {l.status === "erro" && (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold" title={l.motivo}>
                            <XCircle className="h-3 w-3" /> {l.motivo || "Erro"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between pt-2 border-t mt-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          {linhas.length > 0 && (
            <Button
              size="sm"
              onClick={handleSalvar}
              disabled={totalValidas === 0}
              className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4" />
              Importar {totalValidas} Rotina(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
