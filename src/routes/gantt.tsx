import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarPlus, CheckCircle2, Clock, PlayCircle, TriangleAlert, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { reunioesIniciais, type Reuniao } from "@/lib/mock-data";
import { NovaTarefaDialog } from "@/components/nova-tarefa-dialog";
import { useTarefas } from "@/lib/tarefas-store";
import type { Tarefa } from "@/lib/mock-data";
import { barrasDoMes, diasNoMes, evolucaoDoMes, NOMES_MES } from "@/lib/rotinas-view";

export const Route = createFileRoute("/gantt")({
  head: () => ({
    meta: [
      { title: "Painel Gantt de Tarefas — DP Control" },
      {
        name: "description",
        content:
          "Cronograma Gantt do Departamento Pessoal com evolução de conclusão das tarefas e marcação de reuniões na linha do tempo.",
      },
      { property: "og:title", content: "Painel Gantt de Tarefas — DP Control" },
      {
        property: "og:description",
        content: "Acompanhe a evolução das tarefas do DP em cronograma Gantt e marque reuniões no mês.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PainelGantt,
});

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const corStatus: Record<string, string> = {
  atrasada: "bg-destructive",
  andamento: "bg-chart-1",
  planejada: "bg-muted-foreground/40",
  concluida: "bg-chart-2",
};

const rotuloStatus: Record<string, string> = {
  atrasada: "Atrasada",
  andamento: "Em andamento",
  planejada: "Planejada",
  concluida: "Concluída",
};

const STATUS_ROTINA: { value: Tarefa["status"]; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "fazendo", label: "Em andamento" },
  { value: "revisao", label: "Em revisão" },
  { value: "concluida", label: "Concluída" },
];

function PainelGantt() {
  const [reunioes, setReunioes] = useState<Reuniao[]>(reunioesIniciais);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ titulo: "", dia: "1", hora: "09:00", participantes: "" });

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const DIAS = diasNoMes(ano, mes);
  const OFFSET = new Date(ano, mes, 1).getDay();

  // Mesma fonte de dados de Rotinas e do Calendário
  const { tarefas, updateTarefa } = useTarefas();
  const tarefasGantt = useMemo(() => barrasDoMes(tarefas, ano, mes), [tarefas, ano, mes]);
  const evolucaoConclusao = useMemo(() => evolucaoDoMes(tarefas, ano, mes), [tarefas, ano, mes]);

  const mudarStatus = (id: string, titulo: string, novo: Tarefa["status"]) => {
    const patch: Partial<Tarefa> =
      novo === "concluida"
        ? { status: novo, progresso: 100 }
        : novo === "backlog"
          ? { status: novo, progresso: 0 }
          : { status: novo };
    const ok = updateTarefa(id, patch);
    if (ok) toast.success(`"${titulo}" → ${STATUS_ROTINA.find((s) => s.value === novo)?.label}`);
    else toast.error("Não foi possível atualizar a rotina.");
  };

  const kpis = useMemo(() => {
    const c = (st: string) => tarefasGantt.filter((t) => t.status === st).length;
    return { atrasada: c("atrasada"), andamento: c("andamento"), planejada: c("planejada"), concluida: c("concluida") };
  }, [tarefasGantt]);

  const adicionarReuniao = () => {
    if (!form.titulo.trim()) return;
    setReunioes((r) => [
      ...r,
      {
        id: `r${Date.now()}`,
        titulo: form.titulo.trim(),
        dia: Math.min(DIAS, Math.max(1, Number(form.dia) || 1)),
        hora: form.hora,
        participantes: form.participantes.trim() || "Equipe DP",
      },
    ]);
    setForm({ titulo: "", dia: "1", hora: "09:00", participantes: "" });
    setAberto(false);
  };

  const diaDaSemana = (dia: number) => SEMANA[(OFFSET + dia - 1) % 7];
  const fimDeSemana = (dia: number) => [0, 6].includes((OFFSET + dia - 1) % 7);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel Gantt de Rotinas"
        description={`${NOMES_MES[mes]} de ${ano} · mesma base de dados das Rotinas e do Calendário`}
        actions={
          <div className="flex items-center gap-2">
          <NovaTarefaDialog />
          <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
              <Button size="sm">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Marcar reunião
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova reunião</DialogTitle>
                <DialogDescription>
                  A marcação aparece como um marcador vertical no cronograma de agosto.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="titulo">Assunto</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex.: Alinhamento de fechamento da folha"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dia">Dia (agosto)</Label>
                    <Input
                      id="dia"
                      type="number"
                      min={1}
                      max={31}
                      value={form.dia}
                      onChange={(e) => setForm({ ...form, dia: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hora">Horário</Label>
                    <Input
                      id="hora"
                      type="time"
                      value={form.hora}
                      onChange={(e) => setForm({ ...form, hora: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="part">Participantes</Label>
                  <Input
                    id="part"
                    placeholder="Ex.: Camila, Paulo Serra"
                    value={form.participantes}
                    onChange={(e) => setForm({ ...form, participantes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setAberto(false)}>
                  Cancelar
                </Button>
                <Button onClick={adicionarReuniao}>Salvar reunião</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Vencidas neste mês", valor: kpis.atrasada, icon: TriangleAlert, cor: "text-destructive" },
          { label: "Em andamento", valor: kpis.andamento, icon: PlayCircle, cor: "text-chart-1" },
          { label: "Planejadas", valor: kpis.planejada, icon: Clock, cor: "text-muted-foreground" },
          { label: "Concluídas", valor: kpis.concluida, icon: CheckCircle2, cor: "text-chart-2" },
        ].map((k) => (
          <div key={k.label} className="surface-panel p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <k.icon className={`h-4 w-4 ${k.cor}`} />
              {k.label}
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{k.valor}</p>
            <p className="text-xs text-muted-foreground">tarefas</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-panel p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold">Evolução de conclusão</h2>
          <p className="text-xs text-muted-foreground">Acumulado de tarefas planejadas x concluídas ao longo do mês</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucaoConclusao}>
                <defs>
                  <linearGradient id="gPlan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gConc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <RTooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="planejado"
                  name="Planejado"
                  stroke="hsl(var(--chart-3))"
                  fill="url(#gPlan)"
                />
                <Area
                  type="monotone"
                  dataKey="concluido"
                  name="Concluído"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#gConc)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-panel flex flex-col p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4" /> Reuniões marcadas
          </h2>
          <p className="text-xs text-muted-foreground">{reunioes.length} reuniões em {NOMES_MES[mes]?.toLowerCase()}</p>
          <div className="mt-3 space-y-2 overflow-y-auto">
            {reunioes
              .slice()
              .sort((a, b) => a.dia - b.dia)
              .map((r) => (
                <div key={r.id} className="flex items-start gap-3 rounded-lg border p-2.5">
                  <div className="w-9 shrink-0 rounded-md bg-chart-5/15 py-1 text-center">
                    <p className="text-sm font-semibold tabular-nums text-chart-5">{r.dia}</p>
                    <p className="text-[9px] uppercase text-muted-foreground">{NOMES_MES[mes]?.slice(0, 3).toLowerCase()}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{r.titulo}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.hora} · {r.participantes}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="surface-panel overflow-x-auto">
        <div className="min-w-[1100px]">
          <div className="flex border-b">
            <div className="w-72 shrink-0 border-r p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Processo
            </div>
            <div className="flex flex-1">
              {Array.from({ length: DIAS }, (_, i) => i + 1).map((dia) => {
                const reuniaoDoDia = reunioes.filter((r) => r.dia === dia);
                return (
                  <div
                    key={dia}
                    className={`relative flex-1 border-r p-1 text-center last:border-r-0 ${
                      fimDeSemana(dia) ? "bg-muted/40" : ""
                    }`}
                  >
                    <p className="text-[9px] lowercase text-muted-foreground">{diaDaSemana(dia)}</p>
                    <p className="text-[11px] font-medium tabular-nums">{dia}</p>
                    {reuniaoDoDia.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="mx-auto mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-chart-5 text-[8px] font-bold text-background">
                              {reuniaoDoDia.length}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {reuniaoDoDia.map((r) => (
                              <p key={r.id} className="text-xs">
                                {r.hora} — {r.titulo}
                              </p>
                            ))}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {tarefasGantt.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhuma rotina com datas neste mês. Cadastre rotinas para vê-las no cronograma.
            </div>
          )}
          {tarefasGantt.map((t) => (
            <div key={t.id} className="flex border-b last:border-0 hover:bg-muted/30">
              <div className="w-72 shrink-0 border-r p-2.5">
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${corStatus[t.status]}`} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium" title={t.titulo}>
                      {t.titulo}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {t.empresa} · {t.responsavel}
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative flex flex-1">
                {Array.from({ length: DIAS }, (_, i) => i + 1).map((dia) => (
                  <div
                    key={dia}
                    className={`relative flex-1 border-r last:border-r-0 ${fimDeSemana(dia) ? "bg-muted/30" : ""}`}
                  >
                    {reunioes.some((r) => r.dia === dia) && (
                      <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-chart-5/50" />
                    )}
                  </div>
                ))}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute top-1/2 h-5 -translate-y-1/2 overflow-hidden rounded-md bg-muted"
                        style={{
                          left: `${((t.inicio - 1) / DIAS) * 100}%`,
                          width: `${((t.fim - t.inicio + 1) / DIAS) * 100}%`,
                        }}
                      >
                        <div className={`h-full ${corStatus[t.status]} opacity-40`} />
                        <div
                          className={`absolute inset-y-0 left-0 ${corStatus[t.status]}`}
                          style={{ width: `${t.progresso}%` }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs font-medium">{t.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.inicio} a {t.fim} de {NOMES_MES[mes]} · {t.progresso}% · {rotuloStatus[t.status]}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        {Object.entries(rotuloStatus).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${corStatus[k]}`} /> {v}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-chart-5" /> Reunião marcada
        </span>
      </div>
    </div>
  );
}
