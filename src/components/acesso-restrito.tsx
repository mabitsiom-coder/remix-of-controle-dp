import { Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft } from "lucide-react";

import { useAuth } from "@/lib/auth-store";

export function AcessoRestrito({ perfisPermitidos }: { perfisPermitidos?: string[] }) {
  const { currentUser } = useAuth();

  return (
    <div className="mx-auto mt-12 max-w-md rounded-2xl border bg-card p-8 text-center shadow-md">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-bold text-foreground">Acesso Não Autorizado</h2>
      <p className="mt-2 text-sm text-muted-foreground font-medium">
        Acesso não autorizado. Seu perfil ({currentUser.perfil}) não possui permissão para acessar esta funcionalidade.
      </p>
      {perfisPermitidos && perfisPermitidos.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground/80">
          Disponível apenas para: <strong>{perfisPermitidos.join(", ")}</strong>.
        </p>
      )}
      <div className="mt-6 flex justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" /> Ir para o Dashboard
        </Link>
      </div>
    </div>
  );
}
