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
import { createRegSST, type RegSST } from "@/lib/sst-store";
import { useEmpresas } from "@/lib/empresas-store";

type FormRegSST = Omit<RegSST, "id">;

const EMPTY_FORM: FormRegSST = {
  codigo: "",
  empresa: "",
  sstNaMabit: "SIM",
  grauDeRisco: "1",
  qtdFunc: 1,
  inicioContrato: "—",
  examesVencidos: "NÃO",
  possuiProgramas: "SIM",
  ltcat: "Indeterminado",
  pcmso: "—",
  pgr: "—",
  ltip: "—",
  dir: "—",
  linkProgramas: "",
  obsAnalista: "",
  obsCS: "",
};

export function NovoEventoSSTDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormRegSST>(EMPTY_FORM);
  const { empresas } = useEmpresas();

  const set = <K extends keyof FormRegSST>(field: K, value: FormRegSST[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleEmpresaSelect = (nomeEmpresa: string) => {
    const emp = empresas.find((e) => e.nome === nomeEmpresa);
    setForm((prev) => ({
      ...prev,
      empresa: nomeEmpresa,
      codigo: emp?.codigoDominio || emp?.id || prev.codigo,
      qtdFunc: emp?.funcionarios || prev.qtdFunc,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa.trim()) {
      toast.error("Informe ou selecione a empresa.");
      return;
    }
    createRegSST(form);
    toast.success("Registro de SST cadastrado com sucesso!");
    setForm(EMPTY_FORM);
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

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Novo Registro de SST</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Controle de programas (LTCAT, PCMSO, PGR, LTIP, DIR), exames e grau de risco.
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
              <Label className="text-xs font-medium">Cód. Empresa</Label>
              <Input
                placeholder="Ex: 1094"
                value={form.codigo}
                onChange={(e) => set("codigo", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">SST Na Mábit</Label>
              <Select value={form.sstNaMabit} onValueChange={(v) => set("sstNaMabit", v as "SIM" | "NÃO")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NÃO">NÃO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Grau de Risco</Label>
              <Select value={form.grauDeRisco} onValueChange={(v) => set("grauDeRisco", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Qtd. Funcionários</Label>
              <Input
                type="number"
                min={0}
                value={form.qtdFunc}
                onChange={(e) => set("qtdFunc", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Início do Contrato</Label>
              <Input
                placeholder="Ex: 09/2024 ou —"
                value={form.inicioContrato}
                onChange={(e) => set("inicioContrato", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Possui Exames Vencidos</Label>
              <Select
                value={form.examesVencidos}
                onValueChange={(v) => set("examesVencidos", v as "SIM" | "NÃO" | "—")}
              >
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
              <Label className="text-xs font-medium">Possui Programas</Label>
              <Select
                value={form.possuiProgramas}
                onValueChange={(v) => set("possuiProgramas", v as "SIM" | "NÃO" | "—")}
              >
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

          {/* Seção Programas */}
          <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Validade dos Programas de SST
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">LTCAT</Label>
                <Input
                  placeholder="Ex: Indeterminado"
                  value={form.ltcat}
                  onChange={(e) => set("ltcat", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">PCMSO / PCMAT</Label>
                <Input
                  placeholder="Ex: 23/09/2025 ou —"
                  value={form.pcmso}
                  onChange={(e) => set("pcmso", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">PGR</Label>
                <Input
                  placeholder="Ex: 21/10/2026 ou —"
                  value={form.pgr}
                  onChange={(e) => set("pgr", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">LTIP</Label>
                <Input
                  placeholder="Ex: Indeterminado ou —"
                  value={form.ltip}
                  onChange={(e) => set("ltip", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">DIR</Label>
                <Input
                  placeholder="Ex: DD/MM/AAAA ou —"
                  value={form.dir}
                  onChange={(e) => set("dir", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Link dos Programas</Label>
                <Input
                  placeholder="Ex: https://drive..."
                  value={form.linkProgramas}
                  onChange={(e) => set("linkProgramas", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Obs.: Analista</Label>
              <Input
                placeholder="Ex: Encaminhado em: 22/07"
                value={form.obsAnalista}
                onChange={(e) => set("obsAnalista", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Obs.: CS</Label>
              <Input
                placeholder="Ex: 1 Pró-Labore"
                value={form.obsCS}
                onChange={(e) => set("obsCS", e.target.value)}
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
