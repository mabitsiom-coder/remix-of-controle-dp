import { useState, useRef } from "react";
import { Upload, FileUp, CheckCircle2, AlertCircle } from "lucide-react";
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
import { createEmpresa } from "@/lib/empresas-store";
import { getStoredGrupos, addGrupo } from "@/lib/grupos-store";

function normalizar(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolverGrupoId(nomeGrupo: string): string {
  if (!nomeGrupo) return "none";
  const existente = getStoredGrupos().find(
    (g) => normalizar(g.nome) === normalizar(nomeGrupo),
  );
  if (existente) return existente.id;
  return addGrupo({ nome: nomeGrupo.trim() }).id;
}

export function ImportarEmpresasDialog({
  trigger,
  onSuccess,
}: {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim() !== "");
      
      if (lines.length < 2) {
        toast.error("O arquivo parece estar vazio ou sem dados.");
        return;
      }

      let importedCount = 0;
      let errorCount = 0;

      // Start from line 1 to skip the header
      for (let i = 1; i < lines.length; i++) {
        const row = (lines[i] ?? "").split(";");
        
        // Basic validation: ensure we have at least the required fields (nome and cnpj)
        if (row.length < 2 || !row[0]?.trim() || !row[1]?.trim()) {
          errorCount++;
          continue;
        }

        try {
          const nome = row[0]?.trim();
          const cnpj = row[1]?.trim();
          const regime = row[2]?.trim() || "Simples Nacional";
          const grupoId = "none"; // Hardcoded default, can be extended if we match names
          const responsavel = row[4]?.trim() || "";
          const carteira = row[5]?.trim() || "Carteira Geral";
          const analista = row[6]?.trim() || "Sistema";
          const supervisor = row[7]?.trim() || "Sistema";
          const funcionarios = parseInt(row[8]?.trim() || "1", 10);
          const convenio = row[9]?.trim() || "";
          const certificadoDigital = row[10]?.trim() || "";
          const procuracao = row[11]?.trim() || "";
          
          let risco = row[12]?.trim().toLowerCase() as "baixo" | "medio" | "alto";
          if (!["baixo", "medio", "alto"].includes(risco)) risco = "baixo";

          let status = row[13]?.trim().toLowerCase() as "ativa" | "atencao" | "atraso";
          if (!["ativa", "atencao", "atraso"].includes(status)) status = "ativa";

          const fechamento = row[14]?.trim() || "";
          const envio = row[15]?.trim() || "";
          const duplaConferencia = row[16]?.trim().toLowerCase() === "sim";
          const fluxoAprovacao = row[17]?.trim() || "";
          const observacoes = row[18]?.trim() || "";

          createEmpresa({
            nome,
            cnpj,
            regime,
            grupoId,
            responsavel,
            carteira,
            analista,
            supervisor,
            funcionarios: isNaN(funcionarios) ? 1 : funcionarios,
            convenio,
            certificadoDigital,
            procuracao,
            risco,
            status,
            fechamento,
            envio,
            duplaConferencia,
            fluxoAprovacao,
            observacoes,
          });

          importedCount++;
        } catch (err) {
          console.error("Erro na linha " + i, err);
          errorCount++;
        }
      }

      toast.success(`${importedCount} empresas importadas com sucesso!`, {
        description: errorCount > 0 ? `${errorCount} linhas falharam ou foram ignoradas.` : "",
      });
      
      setOpen(false);
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao ler o arquivo CSV.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-1.5 shadow-sm">
            <Upload className="h-4 w-4" /> Importar CSV
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md sm:rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileUp className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Importar Empresas</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Faça o upload da planilha modelo (.csv) preenchida com seus clientes.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-center border-dashed">
            <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground mb-4">
              Selecione o arquivo CSV formatado corretamente com ponto e vírgula (;).
            </p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isImporting}
              className="w-full"
            >
              {isImporting ? (
                <>Processando arquivo...</>
              ) : (
                <>Selecionar Arquivo CSV</>
              )}
            </Button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            Ainda não tem a planilha padrão? <br/>
            <a href="/modelo_importacao_empresas.csv" download className="text-primary hover:underline font-medium">
              Baixar Modelo de Importação
            </a>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t pt-4 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-xs"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
