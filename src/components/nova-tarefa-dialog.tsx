import { useState } from "react";
import { Plus, ClipboardList, CheckCircle2, Repeat } from "lucide-react";
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
import { createTarefa, type NovaTarefaForm } from "@/lib/tarefas-store";
import { CATEGORIAS_ROTINA, PERIODICIDADES } from "@/lib/rotinas-view";
import type { PeriodicidadeRotina } from "@/lib/mock-data";

const EMPTY_FORM: NovaTarefaForm = {
  titulo: "",
  descricao: "",
  periodicidade: "Mensal",
  prioridade: "media",
  prazo: "",
  horasPrevistas: 2,
  status: "backlog",
  checklistItens: "",
  dataInicio: "",
  categoria: "Folha",
  observacoes: "",
};

export function NovaTarefaDialog({
  trigger,
  onSuccess,
  defaultStatus,
}: {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  defaultStatus?: NovaTarefaForm["status"];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NovaTarefaForm>({
    ...EMPTY_FORM,
    status: defaultStatus ?? "backlog",
  });

  const set = (field: keyof NovaTarefaForm, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.titulo.trim()) {
      toast.error("Informe o título da rotina.");
      return;
    }

    if (!form.prazo) {
      toast.error("Informe a data-base / prazo da rotina.");
      return;
    }

    try {
      const t = createTarefa(form);
      toast.success(`Rotina "${t.titulo}" criada com sucesso!`);
      setOpen(false);
      setForm({ ...EMPTY_FORM, status: defaultStatus ?? "backlog" });
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar rotina.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Nova Rotina
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Nova Rotina Geral</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastre rotinas compartilhadas com todos os analistas no calendário.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="nt-titulo" className="text-xs font-medium">
              Título da Rotina <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nt-titulo"
              placeholder="Ex: Fechamento Mensal da Folha de Pagamento"
              value={form.titulo}
              onChange={(e) => set("titulo", e.target.value)}
              required
            />
          </div>

          {/* Descrição resumida */}
          <div className="space-y-1.5">
            <Label htmlFor="nt-desc" className="text-xs font-medium">
              Descrição (opcional)
            </Label>
            <Input
              id="nt-desc"
              placeholder="Ex: Realizar conferência e fechamento mensal das folhas"
              value={form.descricao ?? ""}
              onChange={(e) => set("descricao", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Periodicidade */}
            <div className="space-y-1.5">
              <Label htmlFor="nt-periodicidade" className="text-xs font-medium flex items-center gap-1">
                <Repeat className="h-3 w-3 text-primary" /> Periodicidade <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.periodicidade ?? "Mensal"}
                onValueChange={(v) => set("periodicidade", v as PeriodicidadeRotina)}
              >
                <SelectTrigger id="nt-periodicidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODICIDADES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label htmlFor="nt-categoria" className="text-xs font-medium">Categoria</Label>
              <Select value={form.categoria ?? "Folha"} onValueChange={(v) => set("categoria", v)}>
                <SelectTrigger id="nt-categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_ROTINA.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data-base / Prazo */}
            <div className="space-y-1.5">
              <Label htmlFor="nt-prazo" className="text-xs font-medium">
                Data-base / Prazo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nt-prazo"
                type="date"
                value={form.prazo}
                onChange={(e) => set("prazo", e.target.value)}
                required
              />
            </div>

            {/* Data de início */}
            <div className="space-y-1.5">
              <Label htmlFor="nt-inicio" className="text-xs font-medium">
                Data de Início (Gantt)
              </Label>
              <Input
                id="nt-inicio"
                type="date"
                value={form.dataInicio ?? ""}
                onChange={(e) => set("dataInicio", e.target.value)}
              />
            </div>

            {/* Prioridade */}
            <div className="space-y-1.5">
              <Label htmlFor="nt-prioridade" className="text-xs font-medium">Prioridade</Label>
              <Select
                value={form.prioridade}
                onValueChange={(v) => set("prioridade", v as NovaTarefaForm["prioridade"])}
              >
                <SelectTrigger id="nt-prioridade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">🟢 Baixa</SelectItem>
                  <SelectItem value="media">🟡 Média</SelectItem>
                  <SelectItem value="alta">🟠 Alta</SelectItem>
                  <SelectItem value="critica">🔴 Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status inicial */}
            <div className="space-y-1.5">
              <Label htmlFor="nt-status" className="text-xs font-medium">Status Inicial</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as NovaTarefaForm["status"])}
              >
                <SelectTrigger id="nt-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="fazendo">Em Andamento</SelectItem>
                  <SelectItem value="revisao">Em Revisão</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Horas previstas */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nt-horas" className="text-xs font-medium">Horas Previstas</Label>
              <Input
                id="nt-horas"
                type="number"
                min={0.5}
                step={0.5}
                value={form.horasPrevistas}
                onChange={(e) => set("horasPrevistas", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-1.5">
            <Label htmlFor="nt-checklist" className="text-xs font-medium">
              Checklist Operacional (um item por linha — opcional)
            </Label>
            <Textarea
              id="nt-checklist"
              rows={3}
              placeholder={"Ex:\nVerificar fechamento de ponto\nCalcular horas extras e adicionais\nGerar guias FGTS / DCTFWeb"}
              value={form.checklistItens}
              onChange={(e) => set("checklistItens", e.target.value)}
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="nt-obs" className="text-xs font-medium">
              Observações adicionais
            </Label>
            <Textarea
              id="nt-obs"
              rows={2}
              placeholder="Instruções ou observações para a equipe"
              value={form.observacoes ?? ""}
              onChange={(e) => set("observacoes", e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 border-t pt-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" className="gap-1.5 text-xs">
              <CheckCircle2 className="h-4 w-4" /> Criar Rotina
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
