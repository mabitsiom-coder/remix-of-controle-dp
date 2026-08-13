import { useState } from "react";
import { KeyRound, UserPlus, CheckCircle2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCadastros, getCarteiras } from "@/lib/cadastros-store";
import { addUsuario, useAuth, type PerfilAcesso } from "@/lib/auth-store";

const DOMINIO = "mabitcontabilidade.com.br";

export type PessoaCadastro = {
  origemId: string;
  nome: string;
  email: string;
  perfil: PerfilAcesso;
  departamento: string;
  origem: string;
};

function normalizar(valor: string) {
  return (valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function sugerirEmail(nome: string) {
  const base = normalizar(nome)
    .replace(/[^a-z0-9\s.]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(".");
  return base ? `${base}@${DOMINIO}` : "";
}

/** Pessoas dos Cadastros do Sistema, com perfil e departamento derivados automaticamente. */
export function usePessoasCadastro(): PessoaCadastro[] {
  const { analistas, supervisores, membros } = useCadastros();

  const deAnalistas: PessoaCadastro[] = analistas.map((a) => {
    const carteira = getCarteiras().find((c) => c.id === a.carteiraId);
    return {
      origemId: a.id,
      nome: a.nome,
      email: a.email || "",
      perfil: "Analista" as PerfilAcesso,
      departamento: carteira ? `Carteira ${carteira.nome}` : "Operações DP",
      origem: "Analista",
    };
  });

  const deSupervisores: PessoaCadastro[] = supervisores.map((s) => {
    const nomes = (s.carteiraIds || [])
      .map((id) => getCarteiras().find((c) => c.id === id)?.nome)
      .filter(Boolean) as string[];
    return {
      origemId: s.id,
      nome: s.nome,
      email: s.email || "",
      perfil: "Supervisor" as PerfilAcesso,
      departamento: nomes.length ? `Carteiras: ${nomes.join(", ")}` : s.departamento || "Supervisão",
      origem: "Supervisor",
    };
  });

  const deMembros: PessoaCadastro[] = membros.map((m) => ({
    origemId: m.id,
    nome: m.nome,
    email: m.email || "",
    perfil: (/coorden/i.test(m.cargo) ? "Coordenador" : /gerent|diret/i.test(m.cargo) ? "Gerente" : /auditor/i.test(m.cargo) ? "Coordenador" : "Analista") as PerfilAcesso,
    departamento: m.cargo + (m.nivel ? ` · ${m.nivel}` : ""),
    origem: m.cargo || "Equipe",
  }));

  return [...deSupervisores, ...deMembros, ...deAnalistas].filter((p) => p.nome.trim());
}

export function AcessosCadastros() {
  const pessoas = usePessoasCadastro();
  const { usuarios } = useAuth();
  const [selecionada, setSelecionada] = useState<PessoaCadastro | null>(null);

  const temAcesso = (p: PessoaCadastro) =>
    usuarios.some(
      (u) =>
        normalizar(u.nome) === normalizar(p.nome) ||
        (p.email && normalizar(u.email) === normalizar(p.email)),
    );

  const pendentes = pessoas.filter((p) => !temAcesso(p));

  return (
    <section className="surface-panel p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Acessos a partir dos Cadastros do Sistema
          </h2>
        </div>
        <Badge variant="outline" className="text-[11px]">
          {pendentes.length} sem acesso · {pessoas.length - pendentes.length} liberados
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Nome, perfil e área vêm automaticamente dos cadastros (supervisores, analistas e equipe).
        Você define apenas o e-mail e a senha de acesso.
      </p>

      {pessoas.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
          Nenhuma pessoa cadastrada ainda em Cadastros do Sistema.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Nome</th>
                <th className="px-3 py-2 text-left font-medium">Perfil</th>
                <th className="px-3 py-2 text-left font-medium">Área / Carteiras</th>
                <th className="px-3 py-2 text-left font-medium">Situação</th>
                <th className="px-3 py-2 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {pessoas.map((p) => {
                const liberado = temAcesso(p);
                return (
                  <tr key={`${p.origem}-${p.origemId}`} className="border-t">
                    <td className="px-3 py-2 font-medium text-foreground">{p.nome}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">{p.perfil}</Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{p.departamento}</td>
                    <td className="px-3 py-2">
                      {liberado ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Com acesso
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sem acesso</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!liberado && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-[11px]"
                          onClick={() => setSelecionada(p)}
                        >
                          <KeyRound className="h-3.5 w-3.5" /> Definir acesso
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DefinirAcessoDialog pessoa={selecionada} onClose={() => setSelecionada(null)} />
    </section>
  );
}

const PERFIS: PerfilAcesso[] = [
  "Administrador",
  "Gerente",
  "Coordenador",
  "Supervisor",
  "Analista",
];

function DefinirAcessoDialog({
  pessoa,
  onClose,
}: {
  pessoa: PessoaCadastro | null;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("123456");
  const [perfil, setPerfil] = useState<PerfilAcesso>("Analista");
  const [salvando, setSalvando] = useState(false);
  const [pessoaAtual, setPessoaAtual] = useState<string | null>(null);

  if (pessoa && pessoaAtual !== pessoa.origemId) {
    setPessoaAtual(pessoa.origemId);
    setEmail(pessoa.email || sugerirEmail(pessoa.nome));
    setSenha("123456");
    setPerfil(pessoa.perfil);
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pessoa) return;
    const emailLimpo = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLimpo)) {
      toast.error("Informe um e-mail válido (ex.: nome@mabitcontabilidade.com.br).");
      return;
    }
    if (senha.trim().length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setSalvando(true);
    try {
      await addUsuario({
        nome: pessoa.nome,
        email: emailLimpo,
        senha: senha.trim(),
        perfil,
        departamento: pessoa.departamento,
        status: "ativo",
      });
      toast.success(`Acesso criado para ${pessoa.nome} (${perfil}).`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar acesso.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={!!pessoa} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-6 sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <UserPlus className="h-4 w-4 text-primary" /> Definir acesso
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Os dados abaixo vêm do cadastro. Defina apenas e-mail e senha.
          </DialogDescription>
        </DialogHeader>

        {pessoa && (
          <form onSubmit={salvar} className="mt-2 space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-xs">
              <p className="font-semibold text-foreground">{pessoa.nome}</p>
              <p className="text-muted-foreground">Perfil: {pessoa.perfil}</p>
              <p className="text-muted-foreground">Área: {pessoa.departamento}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="acessoEmail" className="text-xs font-medium">E-mail de acesso</Label>
              <Input
                id="acessoEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="acessoSenha" className="text-xs font-medium">Senha inicial</Label>
              <Input
                id="acessoSenha"
                type="text"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 border-t pt-3">
              <Button type="button" variant="outline" className="text-xs" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-1 text-xs" disabled={salvando}>
                <CheckCircle2 className="h-4 w-4" /> {salvando ? "Criando..." : "Criar acesso"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
