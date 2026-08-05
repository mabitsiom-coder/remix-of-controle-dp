import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  transmitido: "bg-success/15 text-success border-success/30",
  concluida: "bg-success/15 text-success border-success/30",
  resolvido: "bg-success/15 text-success border-success/30",
  ativa: "bg-success/15 text-success border-success/30",
  baixo: "bg-success/15 text-success border-success/30",
  pendente: "bg-warning/15 text-warning border-warning/30",
  atencao: "bg-warning/15 text-warning border-warning/30",
  em_correcao: "bg-warning/15 text-warning border-warning/30",
  medio: "bg-warning/15 text-warning border-warning/30",
  media: "bg-warning/15 text-warning border-warning/30",
  erro: "bg-destructive/15 text-destructive border-destructive/30",
  atrasado: "bg-destructive/15 text-destructive border-destructive/30",
  atraso: "bg-destructive/15 text-destructive border-destructive/30",
  aberto: "bg-destructive/15 text-destructive border-destructive/30",
  critica: "bg-destructive/15 text-destructive border-destructive/30",
  critico: "bg-destructive/15 text-destructive border-destructive/30",
  alto: "bg-destructive/15 text-destructive border-destructive/30",
  alta: "bg-destructive/15 text-destructive border-destructive/30",
};

const labels: Record<string, string> = {
  em_correcao: "em correção",
  atrasado: "atrasado",
  concluida: "concluída",
  critica: "crítica",
  critico: "crítico",
  media: "média",
  medio: "médio",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        map[status] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}
