import { useEffect, useState, type ReactNode } from "react";
import { Shield, LogIn, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase } from "@/lib/supabase-browser";
import { loginUser, registrarPrimeiroAdmin, recarregarUsuarios } from "@/lib/auth-store";
import { existeUsuario } from "@/lib/usuarios.functions";
import { sincronizarComBanco, iniciarSincronizacao } from "@/lib/db-sync";
import { LogoMabit } from "@/components/logo-mabit";

export function PortaoAcesso({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<"carregando" | "logado" | "login" | "primeiro-acesso">(
    "carregando",
  );

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  const prepararSessao = async () => {
    await recarregarUsuarios();
    await sincronizarComBanco();
    iniciarSincronizacao();
    setEstado("logado");
  };

  useEffect(() => {
    let ativo = true;

    (async () => {
      const { data } = await getSupabase().auth.getSession();
      if (!ativo) return;

      if (data.session) {
        await prepararSessao();
        return;
      }

      try {
        const r = await existeUsuario();
        if (!ativo) return;
        setEstado(r.existe ? "login" : "primeiro-acesso");
      } catch {
        if (ativo) setEstado("login");
      }
    })();

    const { data: sub } = getSupabase().auth.onAuthStateChange((event) => {
      if (!ativo) return;
      if (event === "SIGNED_OUT") {
        setSenha("");
        setEstado("login");
      }
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if (estado === "primeiro-acesso") {
        await registrarPrimeiroAdmin(nome.trim(), email, senha);
        toast.success("Administrador criado com sucesso!");
      } else {
        await loginUser(email, senha);
      }
      await prepararSessao();
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível autenticar.");
    } finally {
      setEnviando(false);
    }
  };

  if (estado === "logado") return <>{children}</>;

  if (estado === "carregando") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const primeiro = estado === "primeiro-acesso";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center text-center gap-3">
          <LogoMabit />
          <div>
            <h1 className="text-sm font-semibold text-foreground">Departamento Pessoal</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {primeiro
                ? "Primeiro acesso — crie o administrador do sistema"
                : "Acesse com seu e-mail corporativo"}
            </p>
          </div>
        </div>

        <form onSubmit={submeter} className="mt-5 space-y-3">
          {primeiro && (
            <div className="space-y-1">
              <Label htmlFor="pNome" className="text-[11px]">
                Nome completo
              </Label>
              <Input
                id="pNome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-9"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="pEmail" className="text-[11px]">
              E-mail
            </Label>
            <Input
              id="pEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pSenha" className="text-[11px]">
              Senha
            </Label>
            <Input
              id="pSenha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="h-9"
              minLength={6}
              required
            />
          </div>

          <Button type="submit" disabled={enviando} className="mt-1 h-9 w-full gap-1.5 text-sm">
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : primeiro ? (
              <UserPlus className="h-4 w-4" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {primeiro ? "Criar administrador" : "Entrar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Dados armazenados com segurança no banco de dados da plataforma.
        </p>
      </div>
    </div>
  );
}
