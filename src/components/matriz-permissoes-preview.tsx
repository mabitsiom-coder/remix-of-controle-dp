import { Check, X, Shield, Lock, Eye, AlertCircle } from "lucide-react";
import {
  LISTA_ACOES,
  MATRIZ_PERMISSOES,
  type AcaoPermissao,
  type PerfilAcesso,
  normalizarPerfil,
} from "@/lib/permissoes";
import { Badge } from "@/components/ui/badge";

export function MatrizPermissoesPreview({ perfil }: { perfil: PerfilAcesso | string }) {
  const norm = normalizarPerfil(perfil);
  const acoes = Object.keys(LISTA_ACOES) as AcaoPermissao[];

  const categorias = ["Empresas", "Grupos", "Carteiras", "Usuários", "Sistema"] as const;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Shield className="h-4 w-4 text-primary" />
          <span>Permissões Automáticas do Perfil:</span>
          <Badge variant="secondary" className="font-bold">
            {norm}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Princípio do Menor Privilégio
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {categorias.map((cat) => {
          const acoesCat = acoes.filter((a) => LISTA_ACOES[a].categoria === cat);
          if (acoesCat.length === 0) return null;

          return (
            <div key={cat} className="space-y-1.5 rounded-md border bg-background/80 p-2.5 shadow-2xs">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {cat}
              </p>
              <div className="space-y-1">
                {acoesCat.map((acaoKey) => {
                  const info = LISTA_ACOES[acaoKey];
                  const permitido = MATRIZ_PERMISSOES[acaoKey](norm);

                  return (
                    <div
                      key={acaoKey}
                      className={`flex items-start justify-between gap-2 rounded px-1.5 py-1 text-[11px] transition-colors ${
                        permitido ? "bg-emerald-500/10 text-foreground" : "text-muted-foreground/60"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium ${permitido ? "text-emerald-700 dark:text-emerald-300 font-semibold" : ""}`}>
                          {info.nome}
                        </p>
                      </div>
                      <div className="shrink-0 mt-0.5">
                        {permitido ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                            <Check className="h-3 w-3" /> Permitido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-muted-foreground/50 text-[10px]">
                            <X className="h-3 w-3" /> Restrito
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
