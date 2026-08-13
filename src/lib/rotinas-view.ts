/**
 * Fonte única de verdade das ROTINAS (tarefas).
 *
 * Rotinas, Calendário e Painel de Gantt são apenas visualizações diferentes
 * dos mesmos registros (`dp_control_tarefas_v1`). Nenhuma dessas telas deve
 * manter listas próprias de eventos ou de barras de cronograma.
 */
import type { Tarefa } from "./mock-data";

export const CATEGORIAS_ROTINA = [
  "Folha",
  "Admissões",
  "Demissões",
  "Férias",
  "13º",
  "SST",
  "FGTS",
  "DCTFWeb",
  "eSocial",
  "Interno",
] as const;

export type StatusCronograma = "planejada" | "andamento" | "atrasada" | "concluida";

export type EventoRotina = {
  id: string;
  dia: number;
  titulo: string;
  empresa: string;
  responsavel: string;
  categoria: string;
  status: StatusCronograma;
  tarefa: Tarefa;
};

export type BarraGantt = {
  id: string;
  titulo: string;
  empresa: string;
  responsavel: string;
  inicio: number;
  fim: number;
  progresso: number;
  status: StatusCronograma;
};

/** Aceita "YYYY-MM-DD" e "DD/MM/YYYY". */
export function parseData(valor?: string | null): Date | null {
  const v = (valor ?? "").trim();
  if (!v) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(v);
  if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function categoriaDaRotina(t: Tarefa): string {
  if (t.categoria && t.categoria.trim()) return t.categoria.trim();
  const dep = (t.departamento || "").toUpperCase();
  if (dep === "SST") return "SST";
  const titulo = (t.titulo || "").toLowerCase();
  if (titulo.includes("folha")) return "Folha";
  if (titulo.includes("admiss")) return "Admissões";
  if (titulo.includes("demiss") || titulo.includes("rescis")) return "Demissões";
  if (titulo.includes("féri") || titulo.includes("feri")) return "Férias";
  if (titulo.includes("13")) return "13º";
  if (titulo.includes("fgts")) return "FGTS";
  if (titulo.includes("dctf")) return "DCTFWeb";
  if (titulo.includes("esocial")) return "eSocial";
  return "Interno";
}

export function statusCronograma(t: Tarefa, hoje = new Date()): StatusCronograma {
  if (t.status === "concluida") return "concluida";
  const prazo = parseData(t.prazo);
  if (prazo) {
    const ref = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    if (prazo.getTime() < ref.getTime()) return "atrasada";
  }
  if (t.status === "fazendo" || t.status === "revisao") return "andamento";
  return "planejada";
}

export function progressoDaRotina(t: Tarefa): number {
  if (typeof t.progresso === "number") return Math.min(100, Math.max(0, t.progresso));
  if (t.status === "concluida") return 100;
  const lista = t.checklist ?? [];
  if (lista.length > 0) {
    return Math.round((lista.filter((c) => c.feito).length / lista.length) * 100);
  }
  return t.status === "revisao" ? 75 : t.status === "fazendo" ? 40 : 0;
}

/** Data usada no calendário: prazo da rotina (fallback: data de início). */
export function dataDaRotina(t: Tarefa): Date | null {
  return parseData(t.prazo) ?? parseData(t.dataInicio);
}

export function eventosDoMes(tarefas: Tarefa[], ano: number, mes: number): EventoRotina[] {
  const eventos: EventoRotina[] = [];
  for (const t of tarefas) {
    const d = dataDaRotina(t);
    if (!d || d.getFullYear() !== ano || d.getMonth() !== mes) continue;
    eventos.push({
      id: t.id,
      dia: d.getDate(),
      titulo: t.titulo,
      empresa: t.empresa || "Geral",
      responsavel: t.responsavel || "—",
      categoria: categoriaDaRotina(t),
      status: statusCronograma(t),
      tarefa: t,
    });
  }
  return eventos.sort((a, b) => a.dia - b.dia);
}

export function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes + 1, 0).getDate();
}

/** Barras do Gantt para o mês: recortadas ao intervalo do mês. */
export function barrasDoMes(tarefas: Tarefa[], ano: number, mes: number): BarraGantt[] {
  const total = diasNoMes(ano, mes);
  const primeiro = new Date(ano, mes, 1).getTime();
  const ultimo = new Date(ano, mes, total).getTime();
  const barras: BarraGantt[] = [];

  for (const t of tarefas) {
    const fimData = dataDaRotina(t);
    if (!fimData) continue;
    const inicioData = parseData(t.dataInicio) ?? fimData;
    if (fimData.getTime() < primeiro || inicioData.getTime() > ultimo) continue;

    const inicio = inicioData.getTime() < primeiro ? 1 : inicioData.getDate();
    const fim = fimData.getTime() > ultimo ? total : fimData.getDate();

    barras.push({
      id: t.id,
      titulo: t.titulo,
      empresa: t.empresa || "Geral",
      responsavel: t.responsavel || "—",
      inicio: Math.min(inicio, fim),
      fim: Math.max(inicio, fim),
      progresso: progressoDaRotina(t),
      status: statusCronograma(t),
    });
  }

  return barras.sort((a, b) => a.inicio - b.inicio);
}

/** Evolução acumulada planejado x concluído ao longo do mês. */
export function evolucaoDoMes(tarefas: Tarefa[], ano: number, mes: number) {
  const total = diasNoMes(ano, mes);
  const eventos = eventosDoMes(tarefas, ano, mes);
  let planejado = 0;
  let concluido = 0;
  return Array.from({ length: total }, (_, i) => {
    const dia = i + 1;
    for (const e of eventos.filter((ev) => ev.dia === dia)) {
      planejado += 1;
      if (e.status === "concluida") concluido += 1;
    }
    return { dia, planejado, concluido };
  });
}

export const NOMES_MES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
