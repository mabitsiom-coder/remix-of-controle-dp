import { useState } from "react";
import { Plus, HeartPulse, CheckCircle2 } from "lucide-react";
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
import { createEventoSST, type NovoEventoSSTForm } from "@/lib/sst-store";
import { useEmpresas } from "@/lib/empresas-store";

const TIPOS = ["ASO Admissional", "ASO Periódico", "ASO Demissional", "ASO Mudança de Função", "PCMSO", "PGR", "LTCAT"];
const EVENTOS = ["S-2210", "S-2220", "S-2240", "Documento interno"];

const EMPTY: NovoEventoSSTForm = {
  empresa: "",
  colaborador: "",
  tipo: "ASO Periódico",
  evento: "S-2220",
  vencimento: "",
  clinica: "",
};

export function NovoEventoSSTDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NovoEventoSSTForm>(EMPTY);
  const { empresas } = useEmpresas();

  const set = (field: keyof NovoEventoSSTForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa.trim()) {
      toast.error("Selecione a empresa.");
      return;
    }
    if (!form.vencimento) {
      toast.error("Informe a data de vencimento.");
      return;
    }
    createEventoSST(form);
    toast.success("Registro de SST cadastrado com sucesso!");
    setForm(EMPTY);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Novo Registro SST
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Novo Registro de SST</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                ASOs, eventos do eSocial e documentos com controle de vencimento.
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
              <Label htmlFor="sst-colab" className="text-xs font-medium">Colaborador</Label>
              <Input
                id="sst-colab"
                placeholder="Nome do colaborador"
                value={form.colaborador}
                onChange={(e) => set("colaborador", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo</Label>
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
              <Label className="text-xs font-medium">Evento</Label>
              <Select value={form.evento} onValueChange={(v) => set("evento", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENTOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sst-venc" className="text-xs font-medium">
                Vencimento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sst-venc"
                type="date"
                value={form.vencimento}
                onChange={(e) => set("vencimento", e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sst-clinica" className="text-xs font-medium">Clínica / Responsável</Label>
              <Input
                id="sst-clinica"
                placeholder="Ex: Clínica Vida — Dr. Paulo"
                value={form.clinica}
                onChange={(e) => set("clinica", e.target.value)}
              />
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
