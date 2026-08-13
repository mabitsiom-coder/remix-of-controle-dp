import { useState } from "react";
import { Plus, Building2, CheckCircle2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createReajusteSindicato, type RegReajusteSindicato } from "@/lib/reajuste-sindicato-store";
import { useEmpresas } from "@/lib/empresas-store";

type FormRegReajuste = Omit<RegReajusteSindicato, "id">;

const EMPTY_FORM: FormRegReajuste = {
  codigo: "",
  empresa: "",
  ramoAtividade: "",
  sindicato: "",
  numSolicitacao: "—",
  autorizacao: "—",
  reajusteSalarial: "—",
  contribuicaoAssistencial: "—",
  observacao: "",
};

export function NovoReajusteSindicatoDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormRegReajuste>(EMPTY_FORM);
  const { empresas } = useEmpresas();

  const set = <K extends keyof FormRegReajuste>(field: K, value: FormRegReajuste[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleEmpresaSelect = (nomeEmpresa: string) => {
    const emp = empresas.find((e) => e.nome === nomeEmpresa);
    setForm((prev) => ({
      ...prev,
      empresa: nomeEmpresa,
      codigo: emp?.codigoDominio || emp?.id || prev.codigo,
      carteira: emp?.carteira || prev.carteira,
      analista: emp?.analista || prev.analista,
      supervisor: emp?.supervisor || prev.supervisor,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa.trim()) {
      toast.error("Informe a empresa.");
      return;
    }
    createReajusteSindicato(form);
    toast.success("Registro de Reajuste Salarial Sindicato cadastrado com sucesso!");
    setForm(EMPTY_FORM);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Novo Reajuste Sindicato
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Novo Reajuste Salarial Sindicato</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastre as informações de sindicato, autorização, reajuste salarial e contribuição assistencial.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">
                Empresa <span className="text-destructive">*</span>
              </Label>
              {empresas.length > 0 ? (
                <Select value={form.empresa} onValueChange={handleEmpresaSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((e) => (
                      <SelectItem key={e.id} value={e.nome}>
                        {e.codigoDominio ? `[${e.codigoDominio}] ` : ""}{e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Nome da empresa"
                  value={form.empresa}
                  onChange={(e) => set("empresa", e.target.value)}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cód. Domínio</Label>
              <Input
                placeholder="Ex: 371"
                value={form.codigo}
                onChange={(e) => set("codigo", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Ramo de Atividade</Label>
              <Input
                placeholder="Ex: MATERIAIS DE CONSTRUÇÃO"
                value={form.ramoAtividade}
                onChange={(e) => set("ramoAtividade", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Sindicato</Label>
              <Input
                placeholder="Ex: SINDMAT, COMÉRCIO EM GERAL"
                value={form.sindicato}
                onChange={(e) => set("sindicato", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nº da Solicitação</Label>
              <Input
                placeholder="Ex: VIA GESTA, VIA VESTA ou —"
                value={form.numSolicitacao}
                onChange={(e) => set("numSolicitacao", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Autorização</Label>
              <Select value={form.autorizacao} onValueChange={(v) => set("autorizacao", v as "SIM" | "NÃO" | "—")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NÃO">NÃO</SelectItem>
                  <SelectItem value="—">—</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reajuste Salarial</Label>
              <Select value={form.reajusteSalarial} onValueChange={(v) => set("reajusteSalarial", v as "SIM" | "NÃO" | "—")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NÃO">NÃO</SelectItem>
                  <SelectItem value="—">—</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Contribuição Assistencial</Label>
              <Select value={form.contribuicaoAssistencial} onValueChange={(v) => set("contribuicaoAssistencial", v as "SIM" | "NÃO" | "—")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NÃO">NÃO</SelectItem>
                  <SelectItem value="—">—</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Observação</Label>
            <Textarea
              rows={2}
              placeholder="Ex: SEM FUNCIONÁRIOS, CLIENTE NÃO DEU RETORNO..."
              value={form.observacao}
              onChange={(e) => set("observacao", e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 border-t pt-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" className="gap-1.5 text-xs">
              <CheckCircle2 className="h-4 w-4" /> Salvar Registro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
