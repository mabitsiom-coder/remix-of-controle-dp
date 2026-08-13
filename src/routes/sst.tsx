import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Trash2,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Building2,
  Edit2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NovoEventoSSTDialog } from "@/components/novo-evento-sst-dialog";
import { useRegSST, deleteRegSST, updateRegSST, type RegSST } from "@/lib/sst-store";

export const Route = createFileRoute("/sst")({
  head: () => ({
    meta: [
      { title: "SST — Saúde e Segurança do Trabalho | DP Control" },
      {
        name: "description",
        content: "Controle de programas LTCAT, PCMSO, PGR, LTIP, DIR, exames e grau de risco por empresa.",
      },
      { property: "og:title", content: "SST — DP Control" },
      { property: "og:description", content: "Matriz de controle de SST e programas ocupacionais." },
    ],
  }),
  component: SST,
});

function SST() {
  const { registros } = useRegSST();
  const [busca, setBusca] = useState("");
  const [editingItem, setEditingItem] = useState<RegSST | null>(null);

  const totalEmpresas = registros.length;
  const sstNaMabit = registros.filter((r) => r.sstNaMabit === "SIM").length;
  const examesVencidos = registros.filter((r) => r.examesVencidos === "SIM").length;
  const comProgramas = registros.filter((r) => r.possuiProgramas === "SIM").length;

  const filtrados = registros.filter((r) => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return (
      r.empresa.toLowerCase().includes(q) ||
      r.codigo.toLowerCase().includes(q) ||
      r.obsAnalista.toLowerCase().includes(q) ||
      r.obsCS.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="SST — Saúde e Segurança do Trabalho"
        description="Controle de programas (LTCAT, PCMSO, PGR, LTIP, DIR), exames e graus de risco por empresa"
        actions={<NovoEventoSSTDialog />}
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="surface-panel flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total de Empresas</p>
            <p className="text-2xl font-bold tabular-nums">{totalEmpresas}</p>
          </div>
        </div>

        <div className="surface-panel flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">SST na Mábit</p>
            <p className="text-2xl font-bold tabular-nums">{sstNaMabit}</p>
          </div>
        </div>

        <div className="surface-panel flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Com Exames Vencidos</p>
            <p className="text-2xl font-bold tabular-nums">{examesVencidos}</p>
          </div>
        </div>

        <div className="surface-panel flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Com Programas</p>
            <p className="text-2xl font-bold tabular-nums">{comProgramas}</p>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="surface-panel flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por código, empresa ou observações..."
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabela de Matriz SST */}
      <div className="surface-panel overflow-x-auto">
        <table className="w-full min-w-[1600px] text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/30 text-center font-bold text-[11px] uppercase tracking-wide text-foreground">
              <th rowSpan={2} className="p-2 border-r text-center w-14">Cód</th>
              <th rowSpan={2} className="p-2 border-r text-left min-w-[180px]">Empresa</th>
              <th rowSpan={2} className="p-2 border-r text-center">SST NA MÁBIT<br/><span className="text-[10px] font-normal text-muted-foreground">Sim/Não</span></th>
              <th rowSpan={2} className="p-2 border-r text-center">Grau de Risco</th>
              <th rowSpan={2} className="p-2 border-r text-center">QTD Func.</th>
              <th rowSpan={2} className="p-2 border-r text-center">Início do contrato</th>
              <th rowSpan={2} className="p-2 border-r text-center">Possui exames vencidos<br/><span className="text-[10px] font-normal text-muted-foreground">SIM/NÃO</span></th>
              <th rowSpan={2} className="p-2 border-r text-center">Possui programas<br/><span className="text-[10px] font-normal text-muted-foreground">SIM/NÃO</span></th>
              
              <th colSpan={6} className="p-2 border-r border-b text-center bg-muted/50 font-bold">
                Programas
              </th>
              
              <th rowSpan={2} className="p-2 border-r text-left min-w-[140px]">Obs.: Analista</th>
              <th rowSpan={2} className="p-2 border-r text-left min-w-[120px]">Obs.: CS</th>
              <th rowSpan={2} className="p-2 text-center w-16">Ações</th>
            </tr>
            <tr className="border-b bg-muted/40 text-center text-[10px] font-semibold text-muted-foreground">
              <th className="p-2 border-r">LTCAT<br/><span className="font-normal text-[9px]">Validade</span></th>
              <th className="p-2 border-r">PCMSO/PCMAT<br/><span className="font-normal text-[9px]">Validade</span></th>
              <th className="p-2 border-r">PGR<br/><span className="font-normal text-[9px]">Validade</span></th>
              <th className="p-2 border-r">LTIP<br/><span className="font-normal text-[9px]">Validade</span></th>
              <th className="p-2 border-r">DIR<br/><span className="font-normal text-[9px]">Validade</span></th>
              <th className="p-2 border-r">LINK</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40 align-middle">
                <td className="p-2 font-semibold text-center tabular-nums border-r">{r.codigo || "—"}</td>
                <td className="p-2 font-bold text-foreground border-r">{r.empresa}</td>
                <td className="p-2 text-center font-bold border-r">
                  <span className={r.sstNaMabit === "SIM" ? "text-success" : "text-destructive"}>
                    {r.sstNaMabit}
                  </span>
                </td>
                <td className="p-2 text-center tabular-nums border-r">{r.grauDeRisco || "—"}</td>
                <td className="p-2 text-center tabular-nums border-r">{r.qtdFunc || 0}</td>
                <td className="p-2 text-center tabular-nums border-r">{r.inicioContrato || "—"}</td>
                <td className="p-2 text-center font-bold border-r">
                  <span className={r.examesVencidos === "SIM" ? "text-destructive font-extrabold" : "text-foreground"}>
                    {r.examesVencidos}
                  </span>
                </td>
                <td className="p-2 text-center font-bold border-r">{r.possuiProgramas}</td>
                
                {/* Programas */}
                <td className="p-2 text-center border-r tabular-nums">{r.ltcat || "—"}</td>
                <td className="p-2 text-center border-r tabular-nums font-medium text-destructive">
                  {r.pcmso || "—"}
                </td>
                <td className="p-2 text-center border-r tabular-nums">{r.pgr || "—"}</td>
                <td className="p-2 text-center border-r tabular-nums">{r.ltip || "—"}</td>
                <td className="p-2 text-center border-r tabular-nums">{r.dir || "—"}</td>
                <td className="p-2 text-center border-r">
                  {r.linkProgramas ? (
                    <a
                      href={r.linkProgramas}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      Acessar Programas <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="p-2 border-r font-medium text-destructive whitespace-nowrap">
                  {r.obsAnalista || "—"}
                </td>
                <td className="p-2 border-r font-medium whitespace-nowrap">{r.obsCS || "—"}</td>
                <td className="p-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => setEditingItem(r)}
                      title="Editar registro"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteRegSST(r.id)}
                      title="Excluir registro"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={17} className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum registro de SST encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição */}
      {editingItem && (
        <EditRegSSTDialog
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function EditRegSSTDialog({ item, onClose }: { item: RegSST; onClose: () => void }) {
  const [form, setForm] = useState<RegSST>(item);

  const set = <K extends keyof RegSST>(field: K, value: RegSST[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRegSST(item.id, form);
    toast.success("Registro de SST atualizado!");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Editar Registro SST — {item.empresa}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Empresa</Label>
              <Input
                value={form.empresa}
                onChange={(e) => set("empresa", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cód. Empresa</Label>
              <Input
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

          <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Validade dos Programas
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">LTCAT</Label>
                <Input value={form.ltcat} onChange={(e) => set("ltcat", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">PCMSO/PCMAT</Label>
                <Input value={form.pcmso} onChange={(e) => set("pcmso", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">PGR</Label>
                <Input value={form.pgr} onChange={(e) => set("pgr", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">LTIP</Label>
                <Input value={form.ltip} onChange={(e) => set("ltip", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">DIR</Label>
                <Input value={form.dir} onChange={(e) => set("dir", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Link dos Programas</Label>
                <Input value={form.linkProgramas} onChange={(e) => set("linkProgramas", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Obs.: Analista</Label>
              <Input value={form.obsAnalista} onChange={(e) => set("obsAnalista", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Obs.: CS</Label>
              <Input value={form.obsCS} onChange={(e) => set("obsCS", e.target.value)} />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t pt-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" className="gap-1.5 text-xs">
              <CheckCircle2 className="h-4 w-4" /> Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
