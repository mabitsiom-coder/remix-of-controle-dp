import { Archive, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { restaurarEmpresa } from "@/lib/empresas-store";
import { useAuth } from "@/lib/auth-store";
import type { Empresa } from "@/lib/mock-data";

export function EmpresasExcluidas({ empresas }: { empresas: Empresa[] }) {
  const { currentUser } = useAuth();

  if (empresas.length === 0) return null;

  const handleRestaurar = (emp: Empresa) => {
    restaurarEmpresa(emp.id, currentUser?.nome || "Sistema");
    toast.success(`"${emp.nome}" restaurada aos controles ativos.`);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Archive className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide">Empresas Excluídas</h2>
        <Badge variant="outline" className="text-[11px]">
          {empresas.length}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Estas empresas foram removidas dos controles ativos, mas seus dados e históricos continuam
        preservados no banco de dados.
      </p>

      <div className="surface-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="p-3 font-medium">Código</th>
              <th className="p-3 font-medium">Empresa</th>
              <th className="p-3 font-medium">Carteira anterior</th>
              <th className="p-3 font-medium">Data da exclusão</th>
              <th className="p-3 font-medium">Responsável</th>
              <th className="p-3 font-medium">Situação</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {empresas.map((e) => (
              <tr key={e.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="p-3 font-medium tabular-nums">{e.codigoDominio || e.id}</td>
                <td className="p-3">
                  <p className="font-medium">{e.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{e.cnpj}</p>
                </td>
                <td className="p-3 text-xs">{e.carteiraAnterior || e.carteira || "—"}</td>
                <td className="p-3 text-xs tabular-nums">{e.excluidaEm || "—"}</td>
                <td className="p-3 text-xs">{e.excluidaPor || "—"}</td>
                <td className="p-3">
                  <Badge variant="outline" className="border-destructive/40 text-destructive text-[11px]">
                    Excluída / Inativa
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => handleRestaurar(e)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restaurar empresa
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
