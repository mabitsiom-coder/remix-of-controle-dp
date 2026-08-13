import { useState } from "react";
import { Plus, Search, CheckCircle2 } from "lucide-react";
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
import { createFGTSTrimestral, type RegFGTSTrimestral } from "@/lib/fgts-trimestral-store";
import { useEmpresas } from "@/lib/empresas-store";

type FormRegFGTS = Omit<RegFGTSTrimestral, "id">;

const EMPTY_FORM: FormRegFGTS = {
  codigo: "",
  empresa: "",
  cnpj: "",
  numPis: "—",
  pedidoExtConsolidado: "—",
  baixadoExtConsolidado: "—",
  pendenciaFgts: "NÃO",
  enviadoCliente: "—",
  obsAnalistaSolicitacao: "—",
  obsCS: "—",
};

export function NovoFGTSTrimestralDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormRegFGTS>(EMPTY_FORM);
  const { empresas } = useEmpresas();

  const set = <K extends keyof FormRegFGTS>(field: K, value: FormRegFGTS[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleEmpresaSelect = (nomeEmpresa: string) => {
    const emp = empresas.find((e) => e.nome === nomeEmpresa);
    setForm((prev) => ({
      ...prev,
      empresa: nomeEmpresa,
      codigo: emp?.codigoDominio || emp?.id || prev.codigo,
      cnpj: emp?.cnpj || prev.cnpj,
      carteira: emp?.carteira || prev.carteira || "",
      analista: emp?.analista || prev.analista || "",
      supervisor: emp?.supervisor || prev.supervisor || "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa.trim()) {
      toast.error("Informe a empresa.");
      return;
    }
    createFGTSTrimestral(form);
    toast.success("Registro de Pesquisa FGTS Trimestral cadastrado com sucesso!");
    setForm(EMPTY_FORM);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Nova Pesquisa FGTS
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Nova Pesquisa FGTS Trimestral</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastro e acompanhamento trimestral de extrato consolidado e pendências de FGTS.
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
                placeholder="Ex: 416"
                value={form.codigo}
                onChange={(e) => set("codigo", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">CNPJ</Label>
              <Input
                placeholder="00.000.000/0000-00"
                value={form.cnpj}
                onChange={(e) => set("cnpj", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nº PIS</Label>
              <Input
                placeholder="Ex: 12626871038 / 12585726039"
                value={form.numPis}
                onChange={(e) => set("numPis", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pedido de Ext. Consolidado</Label>
              <Input
                placeholder="Ex: 18/06/2026 ou —"
                value={form.pedidoExtConsolidado}
                onChange={(e) => set("pedidoExtConsolidado", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Baixado Ext. Consolidado</Label>
              <Input
                placeholder="Ex: 22/06/2026 ou —"
                value={form.baixadoExtConsolidado}
                onChange={(e) => set("baixadoExtConsolidado", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pendência de FGTS</Label>
              <Select value={form.pendenciaFgts} onValueChange={(v) => set("pendenciaFgts", v as "SIM" | "NÃO" | "—")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">SIM (Possui pendências)</SelectItem>
                  <SelectItem value="NÃO">NÃO (Sem pendências)</SelectItem>
                  <SelectItem value="—">—</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Obs. Analista / Nº da Solicitação</Label>
            <Textarea
              rows={2}
              placeholder="Ex: 08,10 e 12/2022, 10/2023, 01,04,05,07/2024..."
              value={form.obsAnalistaSolicitacao}
              onChange={(e) => set("obsAnalistaSolicitacao", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Obs. CS</Label>
            <Input
              placeholder="Observações da equipe de CS"
              value={form.obsCS}
              onChange={(e) => set("obsCS", e.target.value)}
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
