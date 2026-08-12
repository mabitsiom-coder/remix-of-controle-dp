import { useState } from "react";
import { Plus, FileCheck2, CheckCircle2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createObrigacao, type NovaObrigacaoForm } from "@/lib/obrigacoes-store";
import { useEmpresas } from "@/lib/empresas-store";
import { useCadastros } from "@/lib/cadastros-store";

const TIPOS = ["eSocial", "DCTFWeb", "FGTS Digital", "EFD-Reinf", "MIT", "SST (S-2220)"];

const EMPTY: NovaObrigacaoForm = {
  empresa: "",
  tipo: "eSocial",
  competencia: "",
  prazo: "",
  status: "pendente",
  responsavel: "",
  protocolo: "",
};

export function NovaObrigacaoDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NovaObrigacaoForm>(EMPTY);
  const { empresas } = useEmpresas();
  const { analistas } = useCadastros();

  const set = (field: keyof NovaObrigacaoForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa.trim()) {
      toast.error("Selecione a empresa.");
      return;
    }
    if (!form.competencia.trim()) {
      toast.error("Informe a competência (ex: 07/2026).");
      return;
    }
    createObrigacao(form);
    toast.success("Obrigação cadastrada com sucesso!");
    setForm(EMPTY);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Nova Obrigação
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Nova Obrigação</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastre a obrigação acessória, prazo e responsável.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Empresa <span className="text-destructive">*</span>
            </Label>
            {empresas.length > 0 ? (
              <Select value={form.empresa} onValueChange={(v) => set("empresa", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.nome}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Razão social da empresa"
                value={form.empresa}
                onChange={(e) => set("empresa", e.target.value)}
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Obrigação</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ob-comp" className="text-xs font-medium">
                Competência <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ob-comp"
                placeholder="07/2026"
                value={form.competencia}
                onChange={(e) => set("competencia", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ob-prazo" className="text-xs font-medium">Prazo</Label>
              <Input
                id="ob-prazo"
                type="date"
                value={form.prazo}
                onChange={(e) => set("prazo", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as NovaObrigacaoForm["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="transmitido">Transmitido</SelectItem>
                  <SelectItem value="erro">Com erro</SelectItem>
                  <SelectItem value="atrasado">Em atraso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Responsável</Label>
              {analistas.length > 0 ? (
                <Select value={form.responsavel} onValueChange={(v) => set("responsavel", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {analistas.map((a) => (
                      <SelectItem key={a.id} value={a.nome}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Nome do responsável"
                  value={form.responsavel}
                  onChange={(e) => set("responsavel", e.target.value)}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ob-prot" className="text-xs font-medium">Protocolo</Label>
              <Input
                id="ob-prot"
                placeholder="Opcional"
                value={form.protocolo}
                onChange={(e) => set("protocolo", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t pt-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" className="gap-1.5 text-xs">
              <CheckCircle2 className="h-4 w-4" /> Salvar Obrigação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
