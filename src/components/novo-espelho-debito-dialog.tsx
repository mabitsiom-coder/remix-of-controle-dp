import { useState } from "react";
import { Plus, Receipt, CheckCircle2 } from "lucide-react";
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
import { createEspelhoDebito, type RegEspelhoDebito } from "@/lib/espelho-debito-store";
import { useEmpresas } from "@/lib/empresas-store";

type FormRegEspelhoDebito = Omit<RegEspelhoDebito, "id">;

const EMPTY_FORM: FormRegEspelhoDebito = {
  ord: 1,
  codigo: "",
  empresa: "",
  cnpjCpf: "",
  tipo: "C/M",
  debitos: "—",
  omissao: "NÃO",
  enviadoCliente: "—",
  obsAnalistaSolicitacao: "—",
  obsAnalistaData: "—",
  obsCsFerramenta: "—",
  obsCsData: "—",
};

export function NovoEspelhoDebitoDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormRegEspelhoDebito>(EMPTY_FORM);
  const { empresas } = useEmpresas();

  const set = <K extends keyof FormRegEspelhoDebito>(field: K, value: FormRegEspelhoDebito[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleEmpresaSelect = (nomeEmpresa: string) => {
    const emp = empresas.find((e) => e.nome === nomeEmpresa);
    setForm((prev) => ({
      ...prev,
      empresa: nomeEmpresa,
      codigo: emp?.codigoDominio || emp?.id || prev.codigo,
      cnpjCpf: emp?.cnpj || prev.cnpjCpf,
      carteira: (emp?.carteira || prev.carteira) ?? "",
      analista: (emp?.analista || prev.analista) ?? "",
      supervisor: (emp?.supervisor || prev.supervisor) ?? "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa.trim()) {
      toast.error("Informe a empresa.");
      return;
    }
    createEspelhoDebito(form);
    toast.success("Registro de Espelho de Débito cadastrado com sucesso!");
    setForm(EMPTY_FORM);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Novo Espelho de Débito
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Novo Espelho de Débito</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Controle de débitos tributários/previdenciários, omissões e solicitações.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ORD.</Label>
              <Input
                type="number"
                min={1}
                value={form.ord}
                onChange={(e) => set("ord", Number(e.target.value))}
              />
            </div>

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
                placeholder="Ex: 1522"
                value={form.codigo}
                onChange={(e) => set("codigo", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">CNPJ / CPF</Label>
              <Input
                placeholder="00.000.000/0000-00"
                value={form.cnpjCpf}
                onChange={(e) => set("cnpjCpf", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo", v as "C/M" | "S/M")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C/M">C/M (Com Movimento)</SelectItem>
                  <SelectItem value="S/M">S/M (Sem Movimento)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Omissão</Label>
              <Select value={form.omissao} onValueChange={(v) => set("omissao", v as "SIM" | "NÃO" | "—")}>
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
              <Label className="text-xs font-medium">Débitos</Label>
              <Input
                placeholder="Ex: 02 e 05/2026-INSS ou —"
                value={form.debitos}
                onChange={(e) => set("debitos", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Enviado Ao Cliente</Label>
              <Select value={form.enviadoCliente} onValueChange={(v) => set("enviadoCliente", v as "SIM" | "NÃO" | "—")}>
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

          {/* Seção Obs. Analista */}
          <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Obs. Analista
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Solicitação</Label>
                <Input
                  placeholder="Ex: 50294 ou —"
                  value={form.obsAnalistaSolicitacao}
                  onChange={(e) => set("obsAnalistaSolicitacao", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Data</Label>
                <Input
                  placeholder="Ex: 16/07/2026 ou —"
                  value={form.obsAnalistaData}
                  onChange={(e) => set("obsAnalistaData", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Seção Obs. CS */}
          <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Obs. CS
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Ferramenta</Label>
                <Input
                  placeholder="Ex: WhatsApp / Email ou —"
                  value={form.obsCsFerramenta}
                  onChange={(e) => set("obsCsFerramenta", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Data / Status CS</Label>
                <Input
                  placeholder="Ex: Informado: 23/07, Guia foi paga ou —"
                  value={form.obsCsData}
                  onChange={(e) => set("obsCsData", e.target.value)}
                />
              </div>
            </div>
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
