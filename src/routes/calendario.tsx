import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Repeat } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { NovaTarefaDialog } from "@/components/nova-tarefa-dialog";
import { ImportarRotinasDialog } from "@/components/importar-rotinas-dialog";
import { DetalhesRotinaDialog } from "@/components/detalhes-rotina-dialog";
import { useTarefas, type Tarefa } from "@/lib/tarefas-store";
import { eventosDoMes, diasNoMes, NOMES_MES } from "@/lib/rotinas-view";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário Operacional — DP Control" },
      {
        name: "description",
        content: "Agenda do DP por categoria: folha, admissões, férias, 13º, SST, FGTS, DCTFWeb e eSocial.",
      },
      { property: "og:title", content: "Calendário Operacional — DP Control" },
      { property: "og:description", content: "Visualize prazos e rotinas do Departamento Pessoal por dia, semana e mês." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Calendario,
});

const cores: Record<string, string> = {
  Folha: "bg-chart-1/20 text-chart-1 border-chart-1/40 hover:border-chart-1",
  Admissões: "bg-chart-2/20 text-chart-2 border-chart-2/40 hover:border-chart-2",
  Demissões: "bg-chart-4/20 text-chart-4 border-chart-4/40 hover:border-chart-4",
  Férias: "bg-chart-5/20 text-chart-5 border-chart-5/40 hover:border-chart-5",
  "13º": "bg-chart-3/20 text-chart-3 border-chart-3/40 hover:border-chart-3",
  SST: "bg-chart-2/20 text-chart-2 border-chart-2/40 hover:border-chart-2",
  FGTS: "bg-chart-3/20 text-chart-3 border-chart-3/40 hover:border-chart-3",
  DCTFWeb: "bg-chart-1/20 text-chart-1 border-chart-1/40 hover:border-chart-1",
  eSocial: "bg-chart-5/20 text-chart-5 border-chart-5/40 hover:border-chart-5",
  Interno: "bg-muted text-muted-foreground border-border hover:border-foreground/40",
};

const corCategoria = (cat: string) => cores[cat] ?? cores["Interno"];

const visoes = ["Mês", "Agenda"] as const;
const semana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Calendario() {
  const [visao, setVisao] = useState<(typeof visoes)[number]>("Mês");
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [rotinaSelecionada, setRotinaSelecionada] = useState<Tarefa | null>(null);
  const [detalhesAberto, setDetalhesAberto] = useState(false);

  const { tarefas } = useTarefas();
  const eventos = useMemo(() => eventosDoMes(tarefas, ano, mes), [tarefas, ano, mes]);

  const dias = diasNoMes(ano, mes);
  const offset = new Date(ano, mes, 1).getDay();
  const celulas = Array.from({ length: offset + dias }, (_, i) =>
    i < offset ? null : i - offset + 1,
  );

  const mover = (delta: number) => {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
  };

  const abrirDetalhes = (tarefa: Tarefa) => {
    setRotinaSelecionada(tarefa);
    setDetalhesAberto(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendário Operacional"
        description={`${NOMES_MES[mes]} de ${ano} · rotinas gerais e prazos do DP`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border p-1 bg-background">
              {visoes.map((v) => (
                <button
                  key={v}
                  onClick={() => setVisao(v)}
                  className={
                    visao === v
                      ? "rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                      : "rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  }
                >
                  {v}
                </button>
              ))}
            </div>
            <ImportarRotinasDialog />
            <NovaTarefaDialog />
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {Object.keys(cores).map((c) => (
            <span key={c} className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cores[c]}`}>
              {c}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Repeat className="h-3 w-3 text-primary" /> Rotina Recorrente
          </span>
        </div>
      </div>

      {visao === "Mês" && (
        <div className="surface-panel overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b p-3">
            <Button variant="ghost" size="icon" onClick={() => mover(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">
              {NOMES_MES[mes]} {ano} · {eventos.length} rotina(s) agendada(s)
            </span>
            <Button variant="ghost" size="icon" onClick={() => mover(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 border-b text-center text-[11px] font-medium uppercase text-muted-foreground bg-muted/20">
            {semana.map((d) => (
              <div key={d} className="p-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {celulas.map((dia, i) => (
              <div key={i} className="min-h-28 border-b border-r p-1.5 last:border-r-0 hover:bg-muted/10 transition-colors">
                {dia && (
                  <>
                    <span className="text-xs font-semibold text-muted-foreground">{dia}</span>
                    <div className="mt-1 space-y-1">
                      {eventos
                        .filter((e) => e.dia === dia)
                        .map((e) => (
                          <div
                            key={e.id}
                            onClick={() => abrirDetalhes(e.tarefa)}
                            className={`group flex items-center justify-between cursor-pointer rounded border px-1.5 py-0.5 text-[10px] font-medium transition-all shadow-2xs ${corCategoria(
                              e.categoria,
                            )}`}
                            title={`${e.titulo}${e.periodicidade ? ` (${e.periodicidade})` : ""}`}
                          >
                            <span className="truncate flex-1">{e.titulo}</span>
                            {e.isRecorrente && (
                              <Repeat className="h-2.5 w-2.5 shrink-0 ml-1 opacity-70 group-hover:opacity-100" />
                            )}
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {visao === "Agenda" && (
        <div className="surface-panel divide-y shadow-sm">
          {eventos.length === 0 && (
            <div className="flex flex-col items-center p-12 text-center">
              <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="text-base font-semibold">Nenhuma rotina neste mês</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Cadastre novas rotinas ou importe uma planilha .xlsx para visualizar suas ocorrências.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <ImportarRotinasDialog />
                <NovaTarefaDialog />
              </div>
            </div>
          )}
          {eventos.map((e) => (
            <div
              key={e.id}
              onClick={() => abrirDetalhes(e.tarefa)}
              className="flex items-center gap-4 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
            >
              <div className="w-14 shrink-0 text-center">
                <p className="text-lg font-semibold tabular-nums">{e.dia}</p>
                <p className="text-[10px] uppercase text-muted-foreground">
                  {NOMES_MES[mes]?.slice(0, 3).toLowerCase()}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{e.titulo}</p>
                  {e.isRecorrente && (
                    <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      <Repeat className="h-2.5 w-2.5" /> {e.periodicidade}
                    </span>
                  )}
                </div>
                {e.tarefa.descricao && (
                  <p className="text-xs text-muted-foreground truncate">
                    {e.tarefa.descricao}
                  </p>
                )}
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${corCategoria(e.categoria)}`}>
                {e.categoria}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes e Edição da Rotina */}
      <DetalhesRotinaDialog
        tarefa={rotinaSelecionada}
        open={detalhesAberto}
        onOpenChange={setDetalhesAberto}
      />
    </div>
  );
}

