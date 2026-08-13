import { useState } from "react";
import { Plus, FileText, CheckCircle2 } from "lucide-react";
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
import { createDCTFWeb, type RegDCTFWeb } from "@/lib/dctfweb-store";
import { useEmpresas } from "@/lib/empresas-store";

type FormRegDCTFWeb = Omit<RegDCTFWeb, "id">;

const EMPTY_FORM: FormRegDCTFWeb = {
  ord: 1,
  codigo: "",
  empresa: "",
  cnpj: "",
  tipo: "C/M",
  reinf: "SIM",
  eSocial: "SIM",
  nfCprb: "❌",
  nfRetInss: "❌",
  nfRetCsrf: "❌",
  transmissaoPublicacao: "PUBLICADO NA MTZ",
  reciboDocSalvo: "PUBLICADO NA MTZ",
  conferidoAnalista: "CONFERIDO",
  revisadoSupervisao: "PENDENTE",
  observacao: "",
};

export function NovaDCTFWebDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormRegDCTFWeb>(EMPTY_FORM);
  const { empresas } = useEmpresas();

  const set = <K extends keyof FormRegDCTFWeb>(field: K, value: FormRegDCTFWeb[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleEmpresaSelect = (nomeEmpresa: string) => {
    const emp = empresas.find((e) => e.nome === nomeEmpresa);
    setForm((prev) => ({
      ...prev,
      empresa: nomeEmpresa,
      codigo: emp?.codigoDominio || emp?.id || prev.codigo,
      cnpj: emp?.cnpj || prev.cnpj,
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
    createDCTFWeb(form);
    toast.success("Obrigação DCTFWeb cadastrada com sucesso!");
    setForm(EMPTY_FORM);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Nova DCTFWeb
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Nova Obrigação DCTFWeb</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastre ou atualize a posição de fechamento e DARF Previdenciário.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ORD</Label>
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
                placeholder="Ex: 1116"
                value={form.codigo}
                onChange={(e) => set("codigo", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">CNPJ</Label>
              <Input
                placeholder="00.000.000/0001-00"
                value={form.cnpj}
                onChange={(e) => set("cnpj", e.target.value)}
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
              <Label className="text-xs font-medium">EFD-REINF</Label>
              <Select value={form.reinf} onValueChange={(v) => set("reinf", v as "SIM" | "NÃO" | "❌")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NÃO">NÃO</SelectItem>
                  <SelectItem value="❌">❌</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">eSocial</Label>
              <Select value={form.eSocial} onValueChange={(v) => set("eSocial", v as "SIM" | "NÃO" | "❌")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NÃO">NÃO</SelectItem>
                  <SelectItem value="❌">❌</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Transmissão / Publicação</Label>
              <Input
                placeholder="Ex: PUBLICADO NA MTZ ou DD/MM/AAAA"
                value={form.transmissaoPublicacao}
                onChange={(e) => set("transmissaoPublicacao", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Doc. Salvo (Recibo)</Label>
              <Input
                placeholder="Ex: PUBLICADO NA MTZ ou DD/MM/AAAA"
                value={form.reciboDocSalvo}
                onChange={(e) => set("reciboDocSalvo", e.target.value)}
              />
            </div>
          </div>

          {/* Seção Nota Fiscal */}
          <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Nota Fiscal (Retenções / CPRB)
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">CPRB</Label>
                <Select value={form.nfCprb} onValueChange={(v) => set("nfCprb", v as "SIM" | "NÃO" | "❌")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIM">SIM</SelectItem>
                    <SelectItem value="NÃO">NÃO</SelectItem>
                    <SelectItem value="❌">❌</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">RET. INSS</Label>
                <Select value={form.nfRetInss} onValueChange={(v) => set("nfRetInss", v as "SIM" | "NÃO" | "❌")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIM">SIM</SelectItem>
                    <SelectItem value="NÃO">NÃO</SelectItem>
                    <SelectItem value="❌">❌</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">RET. CSRF</Label>
                <Select value={form.nfRetCsrf} onValueChange={(v) => set("nfRetCsrf", v as "SIM" | "NÃO" | "❌")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIM">SIM</SelectItem>
                    <SelectItem value="NÃO">NÃO</SelectItem>
                    <SelectItem value="❌">❌</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seção DARF Previdenciário */}
          <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              DARF Previdenciário
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Conferido (Analista)</Label>
                <Select
                  value={form.conferidoAnalista}
                  onValueChange={(v) => set("conferidoAnalista", v as "CONFERIDO" | "PENDENTE" | "—")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONFERIDO">CONFERIDO</SelectItem>
                    <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                    <SelectItem value="—">—</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Revisado (Supervisão)</Label>
                <Select
                  value={form.revisadoSupervisao}
                  onValueChange={(v) => set("revisadoSupervisao", v as "REVISADO" | "PENDENTE" | "—")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REVISADO">REVISADO</SelectItem>
                    <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                    <SelectItem value="—">—</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Observação</Label>
            <Input
              placeholder="Observações da competência DCTFWeb"
              value={form.observacao}
              onChange={(e) => set("observacao", e.target.value)}
            />
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
