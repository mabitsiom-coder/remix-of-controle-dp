import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type Tarefa, updateTarefa } from "@/lib/tarefas-store";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";

export function TarefasDoDiaDialog({
  dia,
  mes,
  ano,
  tarefas,
  open,
  onOpenChange,
}: {
  dia: number;
  mes: string;
  ano: number;
  tarefas: Tarefa[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Tarefas do dia {dia} de {mes} de {ano}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {tarefas.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Nenhuma tarefa para este dia.
            </p>
          ) : (
            tarefas.map((tarefa) => (
              <TarefaItem key={tarefa.id} tarefa={tarefa} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TarefaItem({ tarefa }: { tarefa: Tarefa }) {
  const [status, setStatus] = useState(tarefa.status);
  const [observacoes, setObservacoes] = useState(tarefa.observacoes ?? "");

  const handleSave = () => {
    updateTarefa(tarefa.id, {
      status,
      observacoes: observacoes.trim() || undefined,
    });
    toast.success("Tarefa atualizada com sucesso!");
  };

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-muted/10">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-sm">{tarefa.titulo}</h4>
          {tarefa.descricao && (
            <p className="text-xs text-muted-foreground mt-0.5">{tarefa.descricao}</p>
          )}
        </div>
        <StatusBadge status={tarefa.prioridade} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Status</label>
          <Select value={status} onValueChange={(v) => setStatus(v as Tarefa["status"])}>
            <SelectTrigger className="h-8 text-xs">
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

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Observações</label>
          <Textarea 
            value={observacoes} 
            onChange={(e) => setObservacoes(e.target.value)}
            className="min-h-[60px] text-xs resize-none"
            placeholder="Adicione observações aqui..."
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button size="sm" onClick={handleSave} className="h-7 text-xs gap-1.5">
          <Save className="h-3.5 w-3.5" /> Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
