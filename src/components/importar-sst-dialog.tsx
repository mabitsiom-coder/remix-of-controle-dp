import { useState, useRef } from "react";
import { Upload, FileUp, CheckCircle2, AlertCircle, Download, FileSpreadsheet } from "lucide-react";
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
import { useEmpresas } from "@/lib/empresas-store";
import {
  getStoredRegSST,
  saveRegSST,
  createRegSST,
  updateRegSST,
  type RegSST,
} from "@/lib/sst-store";

async function lerLinhasCSV(file: File): Promise<string[][]> {
  const text = await file.text();
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((l) => l.split(l.includes(";") ? ";" : ","));
}

async function lerLinhasXLSX(file: File): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const primeira = wb.SheetNames[0];
  if (!primeira) return [];
  const sheet = wb.Sheets[primeira];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
  return rows
    .map((r) => (r as unknown[]).map((c) => (c == null ? "" : String(c))))
    .filter((r) => r.some((c) => c.trim() !== ""));
}

async function lerLinhasPDF(file: File): Promise<string[][]> {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const linhas: string[][] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const porLinha = new Map<number, { x: number; str: string }[]>();

    for (const item of content.items) {
      if ("str" in item && item.str.trim()) {
        const y = Math.round(item.transform[5]);
        const x = item.transform[4];
        if (!porLinha.has(y)) porLinha.set(y, []);
        porLinha.get(y)!.push({ x, str: item.str });
      }
    }

    const ys = Array.from(porLinha.keys()).sort((a, b) => b - a);
    for (const y of ys) {
      const pedacos = porLinha.get(y)!.sort((a, b) => a.x - b.x);
      linhas.push(pedacos.map((p) => p.str));
    }
  }

  return linhas;
}

export function ImportarSSTDialog() {
  const [open, setOpen] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [resultado, setResultado] = useState<{
    total: number;
    atualizados: number;
    criados: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { empresas } = useEmpresas();

  const processarArquivo = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls", "pdf"].includes(ext || "")) {
      toast.error("Formato não suportado. Envie CSV, XLSX, XLS ou PDF.");
      return;
    }

    setCarregando(true);
    setResultado(null);

    try {
      let matriz: string[][] = [];

      if (ext === "csv") {
        matriz = await lerLinhasCSV(file);
      } else if (ext === "xlsx" || ext === "xls") {
        matriz = await lerLinhasXLSX(file);
      } else if (ext === "pdf") {
        matriz = await lerLinhasPDF(file);
      }

      if (matriz.length === 0) {
        toast.error("Nenhuma linha de dados encontrada no arquivo.");
        setCarregando(false);
        return;
      }

      // Identificar cabeçalho e mapear colunas
      let idxCod = -1;
      let idxCnpj = -1;
      let idxEmpresa = -1;
      let idxSstMabit = -1;
      let idxRisco = -1;
      let idxQtd = -1;
      let idxInicio = -1;
      let idxExames = -1;
      let idxProg = -1;
      let idxLtcat = -1;
      let idxPcmso = -1;
      let idxPgr = -1;
      let idxLtip = -1;
      let idxDir = -1;
      let idxLink = -1;
      let idxObsA = -1;
      let idxObsC = -1;

      let startRow = 0;
      const headerCandidates = matriz[0].map((c) => c.toLowerCase().trim());

      headerCandidates.forEach((col, idx) => {
        if (col.includes("cód") || col.includes("cod") || col.includes("domínio")) idxCod = idx;
        else if (col.includes("cnpj")) idxCnpj = idx;
        else if (col.includes("empresa") || col.includes("razão") || col.includes("razao")) idxEmpresa = idx;
        else if (col.includes("mábit") || col.includes("mabit") || col.includes("sst na")) idxSstMabit = idx;
        else if (col.includes("risco") || col.includes("grau")) idxRisco = idx;
        else if (col.includes("func") || col.includes("qtd")) idxQtd = idx;
        else if (col.includes("início") || col.includes("inicio") || col.includes("contrato")) idxInicio = idx;
        else if (col.includes("exame")) idxExames = idx;
        else if (col.includes("possui prog") || col.includes("programas")) idxProg = idx;
        else if (col.includes("ltcat")) idxLtcat = idx;
        else if (col.includes("pcmso") || col.includes("pcmat")) idxPcmso = idx;
        else if (col.includes("pgr")) idxPgr = idx;
        else if (col.includes("ltip")) idxLtip = idx;
        else if (col.includes("dir")) idxDir = idx;
        else if (col.includes("link")) idxLink = idx;
        else if (col.includes("analista")) idxObsA = idx;
        else if (col.includes("cs")) idxObsC = idx;
      });

      // Se a primeira linha contiver cabeçalhos reconhecidos, ignora-a nas iterações
      if (idxEmpresa !== -1 || idxCod !== -1 || idxCnpj !== -1) {
        startRow = 1;
      } else {
        // Padrão de colunas fallback
        idxCod = 0;
        idxEmpresa = 1;
        idxSstMabit = 2;
        idxRisco = 3;
        idxQtd = 4;
        idxInicio = 5;
        idxExames = 6;
        idxProg = 7;
        idxLtcat = 8;
        idxPcmso = 9;
        idxPgr = 10;
        idxLtip = 11;
        idxDir = 12;
        idxLink = 13;
        idxObsA = 14;
        idxObsC = 15;
      }

      const dadosSalvos = getStoredRegSST();
      let countAtualizados = 0;
      let countCriados = 0;

      for (let i = startRow; i < matriz.length; i++) {
        const row = matriz[i];
        if (!row || row.length === 0) continue;

        const rawCod = (idxCod >= 0 ? row[idxCod] : "").trim();
        const rawCnpj = (idxCnpj >= 0 ? row[idxCnpj] : "").trim().replace(/\D/g, "");
        const rawEmpresa = (idxEmpresa >= 0 ? row[idxEmpresa] : "").trim();

        if (!rawCod && !rawCnpj && !rawEmpresa) continue;

        // Tentar encontrar empresa correspondente no cadastro geral pelo Cód. Domínio ou CNPJ
        const empCadastrada = empresas.find((e) => {
          const codEq = rawCod && (e.codigoDominio === rawCod || e.id === rawCod);
          const cnpjEq = rawCnpj && e.cnpj.replace(/\D/g, "") === rawCnpj;
          const nomeEq = rawEmpresa && e.nome.toLowerCase() === rawEmpresa.toLowerCase();
          return codEq || cnpjEq || nomeEq;
        });

        const codOficial = rawCod || empCadastrada?.codigoDominio || empCadastrada?.id || "";
        const nomeOficial = empCadastrada?.nome || rawEmpresa || "Empresa Importada";
        const carteiraOficial = empCadastrada?.carteira || "RH - G - 01";
        const analistaOficial = empCadastrada?.analista || "Não atribuído";
        const supervisorOficial = empCadastrada?.supervisor || "Não atribuído";

        // Tentar encontrar se já existe registro de SST cadastrado pelo Cód. ou Nome
        const sstExistente = dadosSalvos.find(
          (s) => (s.codigo && s.codigo === codOficial) || s.empresa.toLowerCase() === nomeOficial.toLowerCase()
        );

        const sstNaMabit = (idxSstMabit >= 0 ? row[idxSstMabit] : "").toUpperCase().includes("SIM") ? "SIM" : "NÃO";
        const grauDeRisco = (idxRisco >= 0 ? row[idxRisco] : "1").trim() || "1";
        const qtdFunc = Number((idxQtd >= 0 ? row[idxQtd] : "1").replace(/\D/g, "")) || empCadastrada?.funcionarios || 1;
        const inicioContrato = (idxInicio >= 0 ? row[idxInicio] : "—").trim() || "—";
        const examesVencidos = (idxExames >= 0 ? row[idxExames] : "").toUpperCase().includes("SIM") ? "SIM" : "NÃO";
        const possuiProgramas = (idxProg >= 0 ? row[idxProg] : "").toUpperCase().includes("SIM") ? "SIM" : "NÃO";
        
        const ltcat = (idxLtcat >= 0 ? row[idxLtcat] : "Indeterminado").trim() || "Indeterminado";
        const pcmso = (idxPcmso >= 0 ? row[idxPcmso] : "—").trim() || "—";
        const pgr = (idxPgr >= 0 ? row[idxPgr] : "—").trim() || "—";
        const ltip = (idxLtip >= 0 ? row[idxLtip] : "—").trim() || "—";
        const dir = (idxDir >= 0 ? row[idxDir] : "—").trim() || "—";
        const linkProgramas = (idxLink >= 0 ? row[idxLink] : "").trim();
        const obsAnalista = (idxObsA >= 0 ? row[idxObsA] : "").trim();
        const obsCS = (idxObsC >= 0 ? row[idxObsC] : "").trim();

        if (sstExistente) {
          updateRegSST(sstExistente.id, {
            codigo: codOficial || sstExistente.codigo,
            empresa: nomeOficial,
            carteira: carteiraOficial,
            analista: analistaOficial,
            supervisor: supervisorOficial,
            sstNaMabit,
            grauDeRisco,
            qtdFunc,
            inicioContrato,
            examesVencidos,
            possuiProgramas,
            ltcat,
            pcmso,
            pgr,
            ltip,
            dir,
            linkProgramas: linkProgramas || sstExistente.linkProgramas,
            obsAnalista: obsAnalista || sstExistente.obsAnalista,
            obsCS: obsCS || sstExistente.obsCS,
          });
          countAtualizados++;
        } else {
          createRegSST({
            codigo: codOficial,
            empresa: nomeOficial,
            carteira: carteiraOficial,
            analista: analistaOficial,
            supervisor: supervisorOficial,
            sstNaMabit,
            grauDeRisco,
            qtdFunc,
            inicioContrato,
            examesVencidos,
            possuiProgramas,
            ltcat,
            pcmso,
            pgr,
            ltip,
            dir,
            linkProgramas,
            obsAnalista,
            obsCS,
          });
          countCriados++;
        }
      }

      setResultado({
        total: countAtualizados + countCriados,
        atualizados: countAtualizados,
        criados: countCriados,
      });

      toast.success(
        `Importação concluída! ${countAtualizados} atualizados, ${countCriados} novos registros criados.`
      );
    } catch (err) {
      console.error(err);
      toast.error("Erro ao ler o arquivo de SST. Verifique a estrutura das colunas.");
    } finally {
      setCarregando(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processarArquivo(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processarArquivo(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5 shadow-sm">
          <Upload className="h-4 w-4" /> Importar SST
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md sm:rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Importar Informações de SST</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Suporta XLSX, XLS, CSV e PDF com validação por Cód. Domínio e CNPJ.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls, .pdf"
              onChange={handleChange}
              className="hidden"
            />
            <FileUp className="h-10 w-10 text-muted-foreground/60 mb-2" />
            <p className="text-xs font-semibold text-foreground">
              {carregando ? "Lendo dados de SST..." : "Arraste e solte seu arquivo aqui"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Formatos aceitos: CSV, XLSX, XLS ou PDF
            </p>
          </div>

          {resultado && (
            <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-xs space-y-1">
              <p className="font-semibold text-success flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Importação realizada com sucesso!
              </p>
              <p className="text-muted-foreground">
                <strong>{resultado.total}</strong> empresas processadas · <strong>{resultado.atualizados}</strong> atualizadas por Código/CNPJ · <strong>{resultado.criados}</strong> novos registros.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <a
              href="/modelo_importacao_sst.csv"
              download="modelo_importacao_sst.csv"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
            >
              <Download className="h-3.5 w-3.5" /> Baixar Planilha Modelo (CSV)
            </a>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
