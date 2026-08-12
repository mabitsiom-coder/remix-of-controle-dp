import { useState } from "react";
import { Plus, ClipboardList, CheckCircle2 } from "lucide-react";
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
import { useEmpresas } from "@/lib/empresas-store";
import { useCadastros } from "@/lib/cadastros-store";

const EMPTY_FORM: NovaTarefaForm = {
  titulo: "",
  empresa: "",
  responsavel: "",
  departamento: "DP",
  prioridade: "media",
  prazo: "",
  horasPrevistas: 2,
  status: "backlog",
  checklistItens: "",
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

  const { empresas } = useEmpresas();
  const { analistas } = useCadastros();

  const set = (field: keyof NovaTarefaForm, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.titulo.trim()) {
      toast.error("Informe o título da tarefa.");
      return;
    }

    try {
      const t = createTarefa(form);
      toast.success(`Tarefa "${t.titulo}" criada com sucesso!`);
      setOpen(false);
      setForm({ ...EMPTY_FORM, status: defaultStatus ?? "backlog" });
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar tarefa.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Nova Tarefa
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Nova Tarefa</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Preencha os dados da tarefa. O checklist é opcional.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="nt-titulo" className="text-xs font-medium">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nt-titulo"
              placeholder="Ex: Processar folha de pagamento — Agosto/2026"
              value={form.titulo}
              onChange={(e) => set("titulo", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Empresa */}
            <div className="space-y-1.5">
              <Label htmlFor="nt-empresa" className="text-xs font-medium">Empresa</Label>
              <Select value={form.empresa} onValueChange={(v) => set("empresa", v)}>
                <SelectTrigger id="nt-empresa">
                  <SelectValue placeholder="Selecione ou deixe em branco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">— Geral (sem empresa) —</SelectItem>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.nome}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Responsável */}
            <div className="space-y-1.5">
              <Label htmlFor="nt-responsavel" className="text-xs font-medium">Responsável</Label>
              <Select value={form.responsavel} onValueChange={(v) => set("responsavel", v)}>
                <SelectTrigger id="nt-responsavel">
                  <SelectValue placeholder="Selecione o analista" />
                </SelectTrigger>
                <SelectContent>
                  {analistas.map((a) => (
                    <SelectItem key={a.id} value={a.nome}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Departamento */}
            <div className="space-y-1.5">
              <Label htmlFor="nt-depto" className="text-xs font-medium">Departamento</Label>
              <Select value={form.departamento} onValueChange={(v) => set("departamento", v)}>
                <SelectTrigger id="nt-depto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DP">DP (Departamento Pessoal)</SelectItem>
                  <SelectItem value="Contábil">Contábil</SelectItem>
                  <SelectItem value="Fiscal">Fiscal</SelectItem>
                  <SelectItem value="SST">SST</SelectItem>
                  <SelectItem value="Jurídico">Jurídico</SelectItem>
                  <SelectItem value="Interno">Interno</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Prazo */}
            <div className="space-y-1.5">
              <Label htmlFor="nt-prazo" className="text-xs font-medium">Prazo</Label>
              <Input
                id="nt-prazo"
                type="date"
                value={form.prazo}
                onChange={(e) => set("prazo", e.target.value)}
              />
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
              Checklist (um item por linha — opcional)
            </Label>
            <Textarea
              id="nt-checklist"
              rows={4}
              placeholder={"Ex:\nVerificar ponto eletrônico\nCalcular horas extras\nGerar FGTS"}
              value={form.checklistItens}
              onChange={(e) => set("checklistItens", e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 border-t pt-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" className="gap-1.5 text-xs">
              <CheckCircle2 className="h-4 w-4" /> Criar Tarefa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
