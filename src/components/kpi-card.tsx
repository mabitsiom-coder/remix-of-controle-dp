import { cn } from "@/lib/utils";

const toneClasses = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
} as const;

export function KpiCard({
  label,
  value,
  delta,
  tone = "info",
}: {
  label: string;
  value: string | number;
  delta?: string;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <div className="surface-panel group relative overflow-hidden p-4 transition-colors hover:border-primary/40">
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 opacity-70",
          tone === "info" && "bg-info",
          tone === "success" && "bg-success",
          tone === "warning" && "bg-warning",
          tone === "danger" && "bg-destructive",
        )}
      />
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {delta && <span className={cn("text-xs font-medium", toneClasses[tone])}>{delta}</span>}
      </div>
    </div>
  );
}
