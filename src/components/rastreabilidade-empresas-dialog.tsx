import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  Search,
  ExternalLink,
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Empresa } from "@/lib/mock-data";

export function RastreabilidadeEmpresasDialog({
  open,
  onOpenChange,
  titulo,
  subtitulo,
  empresas,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  subtitulo?: string;
  empresas: Empresa[];
}) {
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return empresas;
    return empresas.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        e.cnpj.includes(q) ||
        (e.codigoDominio && String(e.codigoDominio).includes(q)) ||
        (e.analista && e.analista.toLowerCase().includes(q)) ||
        (e.carteira && e.carteira.toLowerCase().includes(q))
    );
  }, [empresas, busca]);

  const exportarExcel = () => {
    if (empresas.length === 0) return;
    const dados = empresas.map((e) => ({
      Código: e.codigoDominio || e.id,
      "Razão Social": e.nome,
      CNPJ: e.cnpj,
      Regime: e.regime,
      Tipo: e.tipo === "sem-movimento" ? "Sem Movimento" : "Com Movimento",
      Carteira: e.carteira || "Sem Carteira",
      Analista: e.analista || "—",
      Supervisor: e.supervisor || "—",
      Funcionários: e.funcionarios || 0,
      Status: e.status,
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Empresas");
    XLSX.writeFile(wb, `empresas_${titulo.toLowerCase().replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 sm:rounded-xl overflow-hidden">
        <DialogHeader className="shrink-0 border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">{titulo}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {subtitulo || `${empresas.length} empresa(s) correspondente(s)`}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportarExcel}
                className="gap-1.5 text-xs h-8"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Exportar
              </Button>
            </div>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ, código, analista ou carteira..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 text-xs h-9 bg-muted/20"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Building2 className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">Nenhuma empresa encontrada</p>
              <p className="text-xs">Tente ajustar o termo da busca.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm border-b text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="p-2.5 text-left w-16">Cód</th>
                    <th className="p-2.5 text-left">Empresa</th>
                    <th className="p-2.5 text-left">CNPJ</th>
                    <th className="p-2.5 text-left">Tipo</th>
                    <th className="p-2.5 text-left">Carteira</th>
                    <th className="p-2.5 text-left">Analista</th>
                    <th className="p-2.5 text-center">Vidas</th>
                    <th className="p-2.5 text-center w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtradas.map((e) => (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 font-mono text-muted-foreground">
                        {e.codigoDominio || "—"}
                      </td>
                      <td className="p-2.5 font-medium max-w-[220px] truncate" title={e.nome}>
                        <div>{e.nome}</div>
                        <span className="text-[10px] text-muted-foreground">{e.regime}</span>
                      </td>
                      <td className="p-2.5 tabular-nums text-muted-foreground">{e.cnpj}</td>
                      <td className="p-2.5">
                        {e.tipo === "sem-movimento" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            <XCircle className="h-2.5 w-2.5" /> Sem Movimento
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Com Movimento
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-muted-foreground truncate max-w-[120px]">
                        {e.carteira || "—"}
                      </td>
                      <td className="p-2.5 text-muted-foreground truncate max-w-[120px]">
                        {e.analista || "—"}
                      </td>
                      <td className="p-2.5 text-center tabular-nums font-semibold">
                        {e.funcionarios || 0}
                      </td>
                      <td className="p-2.5 text-center">
                        <Link
                          to="/empresas/$empresaId"
                          params={{ empresaId: e.id }}
                          className="p-1 hover:text-primary transition-colors inline-block"
                          title="Ver ficha da empresa"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t pt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Exibindo <strong>{filtradas.length}</strong> de <strong>{empresas.length}</strong> empresas
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
