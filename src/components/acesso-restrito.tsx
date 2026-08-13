import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { useAuth } from "@/lib/auth-store";
import { rotaInicial } from "@/lib/permissoes";

export function AcessoRestrito({ perfisPermitidos }: { perfisPermitidos: string[] }) {
  const { currentUser } = useAuth();
  const destino = rotaInicial(currentUser.perfil);
  return (
    <div className="mx-auto mt-10 max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">Acesso restrito</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Esta área está disponível apenas para: {perfisPermitidos.join(", ")}.
      </p>
      <Link
        to={destino}
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Voltar para a área liberada
      </Link>
    </div>
  );
}
