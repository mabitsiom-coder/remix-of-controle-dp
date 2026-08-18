import { useState } from "react";
import {
  CalendarDays,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Repeat,
  Tag,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { StatusBadge } from "@/components/status-badge";
import {
  updateTarefa,
  deleteTarefa,
  toggleChecklistItem,
  type Tarefa,
  type PeriodicidadeRotina,
} from "@/lib/tarefas-store";
import { CATEGORIAS_ROTINA, PERIODICIDADES, progressoDaRotina } from "@/lib/rotinas-view";

const CORES_CATEGORIA: Record<string, string> = {
  Folha: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  Admissões: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  Demissões: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  Férias: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  "13º": "bg-chart-3/15 text-chart-3 border-chart-3/30",
  SST: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  FGTS: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  DCTFWeb: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  eSocial: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  Interno: "bg-muted text-muted-foreground border-border",
};

export function DetalhesRotinaDialog({
  tarefa,
  open,
  onOpenChange,
  onDeleted,
}: {
  tarefa: Tarefa | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Edit form state
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [periodicidade, setPeriodicidade] = useState<PeriodicidadeRotina>("Mensal");
  const [categoria, setCategoria] = useState("Folha");
  const [prioridade, setPrioridade] = useState<Tarefa["prioridade"]>("media");
  const [status, setStatus] = useState<Tarefa["status"]>("backlog");
  const [prazo, setPrazo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [horasPrevistas, setHorasPrevistas] = useState(2);
  const [observacoes, setObservacoes] = useState("");

  if (!tarefa) return null;

  const startEdit = () => {
    setTitulo(tarefa.titulo);
    setDescricao(tarefa.descricao ?? "");
    setPeriodicidade(tarefa.periodicidade ?? "Mensal");
    setCategoria(tarefa.categoria ?? "Folha");
    setPrioridade(tarefa.prioridade);
    setStatus(tarefa.status);
    setPrazo(tarefa.prazo ?? "");
    setDataInicio(tarefa.dataInicio ?? "");
    setHorasPrevistas(tarefa.horasPrevistas ?? 2);
    setObservacoes(tarefa.observacoes ?? "");
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("O título não pode ser vazio.");
      return;
    }

    updateTarefa(tarefa.id, {
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      periodicidade,
      categoria,
      prioridade,
      status,
      prazo,
      dataInicio: dataInicio || undefined,
      horasPrevistas: Number(horasPrevistas) || 1,
      observacoes: observacoes.trim() || undefined,
    });

    toast.success("Rotina atualizada com sucesso!");
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteTarefa(tarefa.id);
    toast.success("Rotina excluída com sucesso.");
    setShowConfirmDelete(false);
    onOpenChange(false);
    onDeleted?.();
  };

  const progresso = progressoDaRotina(tarefa);
  const checklist = tarefa.checklist ?? [];
  const concluidos = checklist.filter((c) => c.feito).length;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setIsEditing(false);
          onOpenChange(v);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:rounded-xl p-6">
          {!isEditing ? (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          CORES_CATEGORIA[tarefa.categoria ?? "Folha"] ??
                          CORES_CATEGORIA["Interno"]
                        }`}
                      >
                        {tarefa.categoria ?? "Folha"}
                      </span>
                      {tarefa.periodicidade && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <Repeat className="h-3 w-3" /> {tarefa.periodicidade}
                        </span>
                      )}
                      <StatusBadge status={tarefa.prioridade} />
                    </div>
                    <DialogTitle className="text-lg font-bold leading-tight mt-1">
                      {tarefa.titulo}
                    </DialogTitle>
                    {tarefa.descricao && (
                      <DialogDescription className="text-xs text-muted-foreground">
                        {tarefa.descricao}
                      </DialogDescription>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Informações Principais */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" /> Data-base / Prazo:
                  </span>
                  <p className="font-semibold tabular-nums">
                    {tarefa.prazo ? tarefa.prazo : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Horas Previstas:
                  </span>
                  <p className="font-semibold tabular-nums">
                    {tarefa.horasGastas ?? 0}h / {tarefa.horasPrevistas ?? 1}h
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <Tag className="h-3.5 w-3.5 text-primary" /> Status Atual:
                  </span>
                  <p className="font-semibold capitalize">
                    {tarefa.status === "fazendo"
                      ? "Em andamento"
                      : tarefa.status === "revisao"
                      ? "Em revisão"
                      : tarefa.status === "concluida"
                      ? "Concluída"
                      : "Backlog"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <Repeat className="h-3.5 w-3.5 text-primary" /> Recorrência:
                  </span>
                  <p className="font-semibold">
                    {tarefa.periodicidade ? `${tarefa.periodicidade} (Automática)` : "Pontual"}
                  </p>
                </div>
              </div>

              {/* Checklist Interativo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Checklist Operacional</span>
                  <span className="text-muted-foreground tabular-nums text-[11px]">
                    {concluidos}/{checklist.length} ({progresso}%)
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
                {checklist.length > 0 ? (
                  <ul className="space-y-1.5 rounded-lg border p-3">
                    {checklist.map((item, idx) => (
                      <li
                        key={idx}
                        onClick={() => toggleChecklistItem(tarefa.id, idx)}
                        className="flex items-center gap-2 text-xs cursor-pointer select-none rounded p-1 hover:bg-muted/40 transition-colors"
                      >
                        {item.feito ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground hover:text-primary" />
                        )}
                        <span className={item.feito ? "line-through text-muted-foreground" : ""}>
                          {item.item}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic rounded-lg border border-dashed p-3 text-center">
                    Nenhum item de checklist cadastrado para esta rotina.
                  </p>
                )}
              </div>

              {/* Observações */}
              {tarefa.observacoes && (
                <div className="space-y-1 rounded-lg border bg-muted/10 p-3 text-xs">
                  <span className="font-semibold flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> Observações:
                  </span>
                  <p className="whitespace-pre-line text-foreground/90">{tarefa.observacoes}</p>
                </div>
              )}

              <DialogFooter className="gap-2 border-t pt-4 flex flex-col sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowConfirmDelete(true)}
                  className="gap-1.5 text-xs self-start sm:self-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir Rotina
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="text-xs"
                  >
                    Fechar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={startEdit}
                    className="gap-1.5 text-xs shadow-sm"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Editar Rotina
                  </Button>
                </div>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Editar Rotina</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Altere os parâmetros e a recorrência desta rotina geral.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <Label htmlFor="ed-titulo" className="text-xs font-medium">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ed-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ed-desc" className="text-xs font-medium">
                  Descrição
                </Label>
                <Input
                  id="ed-desc"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ed-periodicidade" className="text-xs font-medium flex items-center gap-1">
                    <Repeat className="h-3 w-3 text-primary" /> Periodicidade
                  </Label>
                  <Select
                    value={periodicidade}
                    onValueChange={(v) => setPeriodicidade(v as PeriodicidadeRotina)}
                  >
                    <SelectTrigger id="ed-periodicidade">
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

                <div className="space-y-1.5">
                  <Label htmlFor="ed-categoria" className="text-xs font-medium">Categoria</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger id="ed-categoria">
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

                <div className="space-y-1.5">
                  <Label htmlFor="ed-prazo" className="text-xs font-medium">
                    Data-base / Prazo
                  </Label>
                  <Input
                    id="ed-prazo"
                    type="date"
                    value={prazo}
                    onChange={(e) => setPrazo(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ed-inicio" className="text-xs font-medium">
                    Data Início (Gantt)
                  </Label>
                  <Input
                    id="ed-inicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ed-prioridade" className="text-xs font-medium">Prioridade</Label>
                  <Select
                    value={prioridade}
                    onValueChange={(v) => setPrioridade(v as Tarefa["prioridade"])}
                  >
                    <SelectTrigger id="ed-prioridade">
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

                <div className="space-y-1.5">
                  <Label htmlFor="ed-status" className="text-xs font-medium">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as Tarefa["status"])}
                  >
                    <SelectTrigger id="ed-status">
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

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="ed-horas" className="text-xs font-medium">Horas Previstas</Label>
                  <Input
                    id="ed-horas"
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={horasPrevistas}
                    onChange={(e) => setHorasPrevistas(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ed-obs" className="text-xs font-medium">
                  Observações
                </Label>
                <Textarea
                  id="ed-obs"
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>

              <DialogFooter className="gap-2 border-t pt-4 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="gap-1.5 text-xs shadow-sm">
                  <CheckCircle2 className="h-4 w-4" /> Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir a rotina <strong>"{tarefa.titulo}"</strong>? Esta ação removerá a rotina e todas as suas ocorrências do calendário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
