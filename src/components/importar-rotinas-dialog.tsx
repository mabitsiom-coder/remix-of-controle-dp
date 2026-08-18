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
import type { PeriodicidadeRotina } from "@/lib/mock-data";
import { PERIODICIDADES, parseData } from "@/lib/rotinas-view";

type LinhaPlanilha = {
  linhaNum: number;
  rotina: string;
  descricao: string;
  periodicidadeBruta: string;
  periodicidadeValida?: PeriodicidadeRotina | undefined;
  dataBaseBruta: string;
  dataBaseFormatada?: string | undefined; // YYYY-MM-DD
  observacao: string;
  status: "valido" | "erro" | "duplicado";
  motivo?: string | undefined;
};

// Normalizador tolerante para periodicidade
function normalizarPeriodicidade(val: string): PeriodicidadeRotina | null {
  if (!val) return null;
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

  return null;
}

// Formatador tolerante de datas do Excel (texto BR, ISO ou número serial)
function normalizarDataExcel(val: unknown): { iso: string; formattedBr: string } | null {
  if (val === null || val === undefined || val === "") return null;

  // Número serial do Excel (ex: 45564)
  if (typeof val === "number" && !isNaN(val)) {
    // Dias desde 1899-12-30 (correção de leap year bug do Excel)
    const dataJs = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(dataJs.getTime())) {
      // Ajustar timezone UTC para evitar quebra de dia
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

  const baixarModelo = () => {
    const dados = [
      ["Rotina", "Descrição", "Periodicidade", "Data-base", "Observação"],
      [
        "Fechamento da Folha",
        "Realizar fechamento mensal da folha",
        "Mensal",
        "30/09/2026",
        "Conferir eventos antes do fechamento",
      ],
      [
        "Conferência de Benefícios",
        "Conferir benefícios dos colaboradores",
        "Mensal",
        "25/09/2026",
        "",
      ],
      [
        "Relatório Trimestral",
        "Preparar relatório trimestral",
        "Trimestral",
        "30/09/2026",
        "",
      ],
      [
        "Revisão Semestral",
        "Revisar procedimentos internos",
        "Semestral",
        "31/12/2026",
        "",
      ],
      [
        "Rotina Anual",
        "Executar conferência anual",
        "Anual",
        "31/12/2026",
        "",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(dados);

    // Ajustar larguras das colunas
    ws["!cols"] = [
      { wch: 30 }, // Rotina
      { wch: 40 }, // Descrição
      { wch: 15 }, // Periodicidade
      { wch: 14 }, // Data-base
      { wch: 40 }, // Observação
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rotinas");
    XLSX.writeFile(wb, "modelo_importacao_rotinas.xlsx");
    toast.success("Modelo baixado com sucesso!");
  };

  const processarArquivo = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
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

      // Lê como array de arrays para flexibilidade de cabeçalho
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

      let idxRotina = headerRow.findIndex((h) => h.includes("rotina") || h.includes("titulo") || h.includes("nome"));
      let idxDesc = headerRow.findIndex((h) => h.includes("desc"));
      let idxPeriod = headerRow.findIndex((h) => h.includes("period") || h.includes("recorr"));
      let idxData = headerRow.findIndex((h) => h.includes("data") || h.includes("prazo") || h.includes("base"));
      let idxObs = headerRow.findIndex((h) => h.includes("obs"));

      // Fallbacks para posições padrão se o cabeçalho não bater perfeitamente
      if (idxRotina === -1) idxRotina = 0;
      if (idxDesc === -1) idxDesc = 1;
      if (idxPeriod === -1) idxPeriod = 2;
      if (idxData === -1) idxData = 3;
      if (idxObs === -1) idxObs = 4;

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
        const obs = String(row[idxObs] ?? "").trim();

        // Ignorar linhas completamente vazias
        if (!rotina && !desc && !periodBruta && !dataBruta && !obs) {
          continue;
        }

        const linhaNum = i + 1;
        let status: LinhaPlanilha["status"] = "valido";
        let motivo = "";

        // Validação da Rotina
        if (!rotina) {
          status = "erro";
          motivo = "Nome da rotina não informado.";
        }

        // Validação da Periodicidade
        const periodicidadeValida = normalizarPeriodicidade(periodBruta);
        if (!periodicidadeValida) {
          status = "erro";
          motivo = motivo
            ? `${motivo} Periodicidade inválida (use: ${PERIODICIDADES.join(", ")}).`
            : `Periodicidade inválida ("${periodBruta}"). Use: ${PERIODICIDADES.join(", ")}.`;
        }

        // Validação da Data-base
        const dataNormalizada = normalizarDataExcel(dataBruta);
        if (!dataNormalizada) {
          status = "erro";
          motivo = motivo
            ? `${motivo} Data-base inválida ou não informada.`
            : `Data-base inválida ou vazia ("${String(dataBruta ?? "")}").`;
        }

        // Validação de Duplicidade
        if (status === "valido" && periodicidadeValida && dataNormalizada) {
          const chave = `${rotina.toLowerCase()}|${periodicidadeValida}|${dataNormalizada.iso}`;

          if (setNoArquivo.has(chave)) {
            status = "duplicado";
            motivo = "Rotina duplicada dentro da própria planilha.";
          } else if (mapExistentes.has(chave)) {
            status = "duplicado";
            motivo = "Rotina idêntica já cadastrada no sistema (mesmo nome, periodicidade e data-base).";
          } else {
            setNoArquivo.add(chave);
          }
        }

        parsedLinhas.push({
          linhaNum,
          rotina,
          descricao: desc,
          periodicidadeBruta: periodBruta,
          periodicidadeValida: periodicidadeValida ?? undefined,
          dataBaseBruta: dataNormalizada ? dataNormalizada.formattedBr : String(dataBruta ?? ""),
          dataBaseFormatada: dataNormalizada?.iso,
          observacao: obs,
          status,
          motivo: motivo || undefined,
        });
      }

      setLinhas(parsedLinhas);
      if (parsedLinhas.length === 0) {
        toast.error("Nenhum registro legível encontrado na planilha.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao ler o arquivo Excel. Verifique a estrutura do arquivo.");
    } finally {
      setIsProcessando(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processarArquivo(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsArrastando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processarArquivo(file);
    }
  };

  const limparArquivo = () => {
    setLinhas([]);
    setNomeArquivo("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const total = linhas.length;
  const validos = linhas.filter((l) => l.status === "valido");
  const duplicados = linhas.filter((l) => l.status === "duplicado");
  const erros = linhas.filter((l) => l.status === "erro");

  const confirmarImportacao = () => {
    if (validos.length === 0) {
      toast.error("Não há registros válidos para importar.");
      return;
    }

    try {
      const tarefasParaImportar: NovaTarefaForm[] = validos.map((l) => ({
        titulo: l.rotina,
        descricao: l.descricao || undefined,
        periodicidade: l.periodicidadeValida,
        prazo: l.dataBaseFormatada || "",
        dataInicio: l.dataBaseFormatada || "",
        prioridade: "media",
        status: "backlog",
        horasPrevistas: 2,
        observacoes: l.observacao || undefined,
      }));

      createBatchTarefas(tarefasParaImportar);
      toast.success(
        `Importação concluída com sucesso! ${validos.length} rotinas foram cadastradas.`
      );
      setOpen(false);
      limparArquivo();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cadastrar as rotinas no sistema.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-1.5 shadow-sm">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Importar Rotinas
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6 sm:rounded-xl">
        <DialogHeader className="shrink-0 border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Importar Rotinas em Lote (.xlsx)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Cadastre dezenas ou centenas de rotinas globais instantaneamente via planilha Excel.
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={baixarModelo}
              className="gap-1.5 text-xs shrink-0 self-start sm:self-auto border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
            >
              <Download className="h-3.5 w-3.5" /> Baixar Modelo de Importação
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Upload Area se não houver arquivo */}
          {linhas.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsArrastando(true);
              }}
              onDragLeave={() => setIsArrastando(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isArrastando
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <UploadCloud className="h-7 w-7" />
              </div>
              <h4 className="text-sm font-semibold">
                {isProcessando
                  ? "Lendo e validando planilha..."
                  : "Clique para selecionar ou arraste o arquivo .xlsx aqui"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Colunas esperadas: <strong>Rotina</strong>, <strong>Descrição</strong>, <strong>Periodicidade</strong>, <strong>Data-base</strong>, <strong>Observação</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Barra de resumo do arquivo */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold">{nomeArquivo}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={limparArquivo}
                    className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3" /> Trocar arquivo
                  </Button>
                </div>
              </div>

              {/* Cards de contadores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border p-2.5 bg-background text-center">
                  <p className="text-[11px] text-muted-foreground font-medium">Total de Registros</p>
                  <p className="text-lg font-bold tabular-nums">{total}</p>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-center">
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Registros Válidos
                  </p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {validos.length}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-center">
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium flex items-center justify-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Duplicados
                  </p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {duplicados.length}
                  </p>
                </div>
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 text-center">
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium flex items-center justify-center gap-1">
                    <XCircle className="h-3 w-3" /> Com Erro
                  </p>
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                    {erros.length}
                  </p>
                </div>
              </div>

              {/* Tabela de Pré-visualização */}
              <div className="rounded-lg border overflow-hidden">
                <div className="max-h-[360px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm border-b text-muted-foreground uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-2.5 text-center w-12">Linha</th>
                        <th className="p-2.5 text-left">Rotina</th>
                        <th className="p-2.5 text-left">Periodicidade</th>
                        <th className="p-2.5 text-left">Data-base</th>
                        <th className="p-2.5 text-left">Observação</th>
                        <th className="p-2.5 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {linhas.map((l) => {
                        const isValido = l.status === "valido";
                        const isDuplicado = l.status === "duplicado";
                        const isErro = l.status === "erro";

                        return (
                          <tr
                            key={l.linhaNum}
                            className={`hover:bg-muted/30 transition-colors ${
                              isErro
                                ? "bg-rose-500/5"
                                : isDuplicado
                                ? "bg-amber-500/5"
                                : ""
                            }`}
                          >
                            <td className="p-2.5 text-center font-mono text-muted-foreground">
                              {l.linhaNum}
                            </td>
                            <td className="p-2.5 font-medium max-w-[220px] truncate" title={l.rotina}>
                              {l.rotina || <span className="text-rose-500 italic">Vazio</span>}
                              {l.descricao && (
                                <p className="text-[10px] text-muted-foreground truncate" title={l.descricao}>
                                  {l.descricao}
                                </p>
                              )}
                            </td>
                            <td className="p-2.5">
                              {l.periodicidadeValida ? (
                                <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary text-[11px]">
                                  {l.periodicidadeValida}
                                </span>
                              ) : (
                                <span className="text-rose-500 font-medium">
                                  {l.periodicidadeBruta || "—"}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 tabular-nums">
                              {l.dataBaseBruta || "—"}
                            </td>
                            <td className="p-2.5 text-muted-foreground max-w-[150px] truncate" title={l.observacao}>
                              {l.observacao || "—"}
                            </td>
                            <td className="p-2.5">
                              {isValido && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" /> Válido
                                </span>
                              )}
                              {isDuplicado && (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="h-3 w-3" /> Duplicado
                                  </span>
                                  <p className="text-[10px] text-amber-700 dark:text-amber-300">
                                    {l.motivo}
                                  </p>
                                </div>
                              )}
                              {isErro && (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                                    <XCircle className="h-3 w-3" /> Erro
                                  </span>
                                  <p className="text-[10px] text-rose-700 dark:text-rose-300 font-medium">
                                    {l.motivo}
                                  </p>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            {linhas.length > 0
              ? `${validos.length} de ${total} registros prontos para importação.`
              : "Selecione um arquivo para pré-visualizar."}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                limparArquivo();
              }}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmarImportacao}
              disabled={validos.length === 0}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" /> Confirmar Importação ({validos.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
