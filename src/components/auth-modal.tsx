import { useState } from "react";
import { LogIn, KeyRound, UserCheck, Shield, Lock, CheckCircle2 } from "lucide-react";
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

export function AuthModal({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { currentUser, usuarios, login, switchUser } = useAuth();

  const [email, setEmail] = useState("auditoria@mabitcontabilidade.com.br");
  const [senha, setSenha] = useState("123456");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = login(email, senha);
      toast.success(`Bem-vindo, ${user.nome}!`, {
        description: `Sessão ativa como ${user.perfil}`,
      });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Credenciais inválidas.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <LogIn className="h-3.5 w-3.5" /> Entrar / Trocar Conta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md p-6 sm:rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Autenticação & Sessão</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Entre com suas credenciais ou alterne o perfil ativo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* LOGIN POR CREDENCIAIS */}
        <form onSubmit={handleLoginSubmit} className="mt-2 space-y-3 rounded-lg border p-4 bg-muted/20">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-primary" /> Login por E-mail e Senha
          </p>

          <div className="space-y-1">
            <Label htmlFor="loginEmail" className="text-[11px]">E-mail</Label>
            <Input
              id="loginEmail"
              type="email"
              placeholder="auditoria@mabitcontabilidade.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="loginSenha" className="text-[11px]">Senha</Label>
            <Input
              id="loginSenha"
              type="password"
              placeholder="123456"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="h-8 text-xs"
              required
            />
          </div>

          <Button type="submit" size="sm" className="w-full h-8 text-xs gap-1.5 mt-1">
            <LogIn className="h-3.5 w-3.5" /> Autenticar
          </Button>
        </form>

        {/* CONTAS DISPONÍVEIS */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Troca Rápida de Usuário Ativo
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {usuarios.map((u) => {
              const isLogado = currentUser.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => {
                    switchUser(u);
                    toast.success(`Usuário ativo: ${u.nome} (${u.perfil})`);
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer text-xs ${
                    isLogado ? "border-primary bg-primary/10" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                      {u.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{u.nome}</p>
                      <p className="text-[10px] text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isLogado ? "default" : "outline"} className="text-[10px]">
                      {u.perfil}
                    </Badge>
                    {isLogado && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
