import { useState } from "react";
import { LogIn, LogOut, Shield, Lock } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-store";
import { LogoMabit } from "@/components/logo-mabit";

export function AuthModal({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { currentUser, autenticado, login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const user = await login(email, senha);
      toast.success(`Bem-vindo, ${user.nome}!`, {
        description: `Sessão ativa como ${user.perfil}`,
      });
      setSenha("");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Credenciais inválidas.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <LogIn className="h-3.5 w-3.5" /> {autenticado ? "Minha sessão" : "Entrar"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md p-6 sm:rounded-xl">
        <DialogHeader>
          <div className="flex flex-col items-center text-center gap-2 mb-2">
            <LogoMabit />
            <DialogTitle className="text-base font-semibold">Autenticação & Sessão</DialogTitle>
            <DialogDescription className="text-xs">
              {autenticado
                ? `Conectado como ${currentUser.nome} (${currentUser.perfil})`
                : "Entre com suas credenciais de acesso ao sistema"}
            </DialogDescription>
          </div>
        </DialogHeader>

        {autenticado ? (
          <div className="mt-2 space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                {currentUser.fotoUrl ? (
                  <img
                    src={currentUser.fotoUrl}
                    alt={currentUser.nome}
                    className="h-10 w-10 rounded-full object-cover border border-primary/30 shrink-0"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                    {currentUser.nome.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{currentUser.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{currentUser.email}</p>
                </div>
              </div>
              <Badge variant="default" className="text-[10px]">
                {currentUser.perfil}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full gap-1.5 text-xs"
              onClick={async () => {
                await logout();
                setOpen(false);
                toast.info("Sessão encerrada.");
              }}
            >
              <LogOut className="h-3.5 w-3.5" /> Sair da conta
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleLoginSubmit}
            className="mt-2 space-y-3 rounded-lg border bg-muted/20 p-4"
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" /> Login por E-mail e Senha
            </p>

            <div className="space-y-1">
              <Label htmlFor="loginEmail" className="text-[11px]">
                E-mail
              </Label>
              <Input
                id="loginEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="loginSenha" className="text-[11px]">
                Senha
              </Label>
              <Input
                id="loginSenha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <Button type="submit" size="sm" disabled={enviando} className="mt-1 h-8 w-full gap-1.5 text-xs">
              <LogIn className="h-3.5 w-3.5" /> {enviando ? "Autenticando..." : "Autenticar"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
