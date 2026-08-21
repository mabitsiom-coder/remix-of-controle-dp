/**
 * Dashboard Aggregator — camada de leitura consolidada.
 *
 * Este arquivo contém funções puras que calculam os indicadores
 * exibidos no Dashboard Executivo a partir dos registros salvos pelos
 * módulos operacionais. Não armazena dados próprios.
 *
 * Fontes oficiais:
 *  - Folha de Pagamento : RegistroFolha[] / FolhaTarefa[]
 *  - Obrigações         : Obrigacao[] + RegDCTFWeb[] + RegFGTSTrimestral[] + RegEspelhoDebito[]
 *  - Rotinas            : Tarefa[] (dp_control_tarefas_v1)
 *  - SST                : RegSST[]
 *  - Empresas           : Empresa[]
 */

import type { FolhaTarefa, StatusFolha } from "./folha-fechamento";
import { statusFolhaMeta } from "./folha-fechamento";
import type { Obrigacao } from "./mock-data";
import type { Empresa, Tarefa } from "./mock-data";
import type { RegDCTFWeb } from "./dctfweb-store";
import type { RegFGTSTrimestral } from "./fgts-trimestral-store";
import type { RegEspelhoDebito } from "./espelho-debito-store";
import type { RegSST } from "./sst-store";
import type { RegParticularidade } from "./particularidades-store";
import {
  normalizarCarteira,
  TODAS_CARTEIRAS,
  pertenceACarteira,
} from "./carteiras-core";
import {
  eventosDoMes,
  statusCronograma,
  dataDaRotina,
  parseData,
} from "./rotinas-view";
import { parseCompetencia } from "./bi-service";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ResumoFolha = {
  totalEmpresas: number;
  processadas: number;
  pctConclusao: number;
  porStatus: { status: string; label: string; total: number; className: string }[];
  emAtraso: number;
};

export type ResumoObrigacoes = {
  totalPrevisto: number;
  transmitidos: number;
  pendentes: number;
  conferidos: number;
  revisados: number;
  emAtraso: number;
  pctTransmitido: number;
};

export type ItemTransmissao = {
  obrigacao: string;
  previstas: number;
  transmitidas: number;
  pendentes: number;
  emAtraso: number;
  pctConclusao: number;
};

export type ResumoRotinas = {
  previstas: number;
  concluidas: number;
  emAndamento: number;
  pendentes: number;
  emAtraso: number;
  pctExecucao: number;
};

export type ProximaRotina = {
  id: string;
  titulo: string;
  vencimento: string;
  periodicidade: string;
  status: "planejada" | "andamento" | "atrasada" | "concluida";
  diasAteVencimento: number;
};

export type ResumoSST = {
  totalMonitoradas: number;
  comExamesVencidos: number;
  semProgramas: number;
  sstNaMabit: number;
  semSST: number;
  pctEnviados: number;
};

export type PendenciaCritica = {
  area: "Folha" | "Obrigações" | "Rotinas" | "SST";
  empresa: string;
  demanda: string;
  vencimento: string;
  diasEmAtraso: number;
  responsavel: string;
};

export type PendenciaPorEmpresa = {
  empresa: string;
  totalPendencias: number;
  folha: number;
  obrigacoes: number;
  sst: number;
  rotinas: number;
};

export type DemandaPorArea = {
  area: string;
  demandas: number;
  concluidas: number;
  pendentes: number;
  pctConclusao: number;
};

export type VencimentosResumo = {
  hoje: number;
  em3Dias: number;
  em7Dias: number;
  atrasadas: number;
};

export type DistribuicaoDemanda = {
  name: string;
  value: number;
  color: string;
};

export type PontoEvolucaoTransmissao = {
  mes: string;
  DCTFWeb: number;
  FGTSTrimestral: number;
  EspelhoDebito: number;
  Obrigacoes: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hoje(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diasAte(data: Date): number {
  return Math.floor((data.getTime() - hoje().getTime()) / (1000 * 60 * 60 * 24));
}

function prazoCompetencia(competencia: string): Date {
  const [mesRaw, anoRaw] = competencia.split("/").map(Number);
  const mes = mesRaw ?? 1;
  const ano = anoRaw ?? new Date().getFullYear();
  // Vencimento padrão: dia 7 do mês seguinte à competência
  return new Date(ano, mes, 7);
}

function isAtrasado(dataVenc: Date): boolean {
  return dataVenc.getTime() < hoje().getTime();
}

// ─── Folha de Pagamento ───────────────────────────────────────────────────────

export function calcularResumoFolha(
  folhaTarefas: FolhaTarefa[],
  empresas: Empresa[],
  competencia: string,
  carteira: string,
): ResumoFolha {
  const isAll = !carteira || carteira === TODAS_CARTEIRAS;
  const empresasAtivas = empresas.filter((e) => e && !e.excluida);
  const empresasFiltradas = isAll
    ? empresasAtivas
    : empresasAtivas.filter(
        (e) => normalizarCarteira(e.carteira) === normalizarCarteira(carteira),
      );

  const folhaComp = folhaTarefas.filter((t) => t.competencia === competencia);
  const folhaFiltrada = isAll
    ? folhaComp
    : folhaComp.filter(
        (t) => normalizarCarteira(t.carteira) === normalizarCarteira(carteira),
      );

  const totalEmpresas = empresasFiltradas.length;
  const processadas = folhaFiltrada.length;

  // Contagem por status
  const countByStatus: Record<string, number> = {};
  for (const t of folhaFiltrada) {
    countByStatus[t.status] = (countByStatus[t.status] ?? 0) + 1;
  }

  // Empresas não iniciadas = total - registradas
  const naoIniciadas = Math.max(0, totalEmpresas - processadas);
  countByStatus["nao_iniciada"] = (countByStatus["nao_iniciada"] ?? 0) + naoIniciadas;

  const ordemStatus = ["nao_iniciada", "andamento", "aguardando", "conferencia", "concluida"] as const;
  const porStatus = ordemStatus.map((s) => ({
    status: s,
    label: statusFolhaMeta[s].label,
    total: countByStatus[s] ?? 0,
    className: statusFolhaMeta[s].className,
  }));

  const concluidas = countByStatus["concluida"] ?? 0;
  const pctConclusao =
    totalEmpresas > 0 ? Math.round((concluidas / totalEmpresas) * 100) : 0;

  // Atraso: não concluídas com competência anterior
  const venc = prazoCompetencia(competencia);
  const emAtraso = isAtrasado(venc)
    ? folhaFiltrada.filter((t) => t.status !== "concluida").length +
      (isAtrasado(venc) ? naoIniciadas : 0)
    : 0;

  return {
    totalEmpresas,
    processadas,
    pctConclusao,
    porStatus,
    emAtraso,
  };
}

// ─── Obrigações ───────────────────────────────────────────────────────────────

export function calcularResumoObrigacoes(
  obrigacoes: Obrigacao[],
  dctfweb: RegDCTFWeb[],
  fgts: RegFGTSTrimestral[],
  espelho: RegEspelhoDebito[],
  competencia: string,
  carteira: string,
): ResumoObrigacoes {
  // Obrigações genéricas: filtrar por competência apenas (não têm campo carteira)
  const obrigFiltradas = obrigacoes.filter(
    (o) => !competencia || o.competencia === competencia,
  );

  const dctfFiltrados = dctfweb.filter((d) =>
    pertenceACarteira(d.carteira, carteira),
  );
  const fgtsFiltrados = fgts.filter((f) =>
    pertenceACarteira(f.carteira, carteira),
  );
  const espelhoFiltrados = espelho.filter((e) =>
    pertenceACarteira(e.carteira, carteira),
  );

  // DCTFWeb: transmitido = tem data em transmissaoPublicacao (não vazio, não "PUBLICADO NA MTZ" sem data)
  const dctfTransmitidos = dctfFiltrados.filter(
    (d) =>
      d.transmissaoPublicacao &&
      d.transmissaoPublicacao !== "" &&
      d.transmissaoPublicacao !== "—",
  ).length;
  const dctfConferidos = dctfFiltrados.filter(
    (d) => d.conferidoAnalista === "CONFERIDO",
  ).length;
  const dctfRevisados = dctfFiltrados.filter(
    (d) => d.revisadoSupervisao === "REVISADO",
  ).length;
  const dctfPendentes = dctfFiltrados.filter(
    (d) =>
      !d.transmissaoPublicacao ||
      d.transmissaoPublicacao === "" ||
      d.transmissaoPublicacao === "—",
  ).length;

  // FGTS Trimestral
  const fgtsEnviados = fgtsFiltrados.filter(
    (f) => f.enviadoCliente === "SIM",
  ).length;
  const fgtsPendentes = fgtsFiltrados.filter(
    (f) => f.enviadoCliente !== "SIM",
  ).length;

  // Espelho de Débito
  const espelhoEnviados = espelhoFiltrados.filter(
    (e) => e.enviadoCliente === "SIM",
  ).length;
  const espelhoPendentes = espelhoFiltrados.filter(
    (e) => e.enviadoCliente !== "SIM",
  ).length;

  // Obrigações genéricas
  const obrTransmitidas = obrigFiltradas.filter(
    (o) => o.status === "transmitido",
  ).length;
  const obrPendentes = obrigFiltradas.filter(
    (o) => o.status === "pendente",
  ).length;
  const obrAtraso = obrigFiltradas.filter(
    (o) => o.status === "atrasado",
  ).length;

  const totalPrevisto =
    dctfFiltrados.length +
    fgtsFiltrados.length +
    espelhoFiltrados.length +
    obrigFiltradas.length;

  const transmitidos = dctfTransmitidos + fgtsEnviados + espelhoEnviados + obrTransmitidas;
  const pendentes = dctfPendentes + fgtsPendentes + espelhoPendentes + obrPendentes;
  const conferidos = dctfConferidos;
  const revisados = dctfRevisados;
  const emAtraso = obrAtraso;

  const pctTransmitido =
    totalPrevisto > 0 ? Math.round((transmitidos / totalPrevisto) * 100) : 0;

  return {
    totalPrevisto,
    transmitidos,
    pendentes,
    conferidos,
    revisados,
    emAtraso,
    pctTransmitido,
  };
}

// ─── Status das Transmissões por obrigação ────────────────────────────────────

export function calcularStatusTransmissoes(
  obrigacoes: Obrigacao[],
  dctfweb: RegDCTFWeb[],
  fgts: RegFGTSTrimestral[],
  espelho: RegEspelhoDebito[],
  competencia: string,
  carteira: string,
): ItemTransmissao[] {
  const result: ItemTransmissao[] = [];

  // DCTFWeb
  const dctfFiltrados = dctfweb.filter((d) =>
    pertenceACarteira(d.carteira, carteira),
  );
  if (dctfFiltrados.length > 0) {
    const transmitidas = dctfFiltrados.filter(
      (d) =>
        d.transmissaoPublicacao &&
        d.transmissaoPublicacao !== "" &&
        d.transmissaoPublicacao !== "—",
    ).length;
    const pendentes = dctfFiltrados.length - transmitidas;
    result.push({
      obrigacao: "DCTFWeb",
      previstas: dctfFiltrados.length,
      transmitidas,
      pendentes,
      emAtraso: 0, // sem data de vencimento por registro no store atual
      pctConclusao:
        dctfFiltrados.length > 0
          ? Math.round((transmitidas / dctfFiltrados.length) * 100)
          : 0,
    });
  }

  // FGTS Trimestral
  const fgtsFiltrados = fgts.filter((f) =>
    pertenceACarteira(f.carteira, carteira),
  );
  if (fgtsFiltrados.length > 0) {
    const enviados = fgtsFiltrados.filter(
      (f) => f.enviadoCliente === "SIM",
    ).length;
    const pendentes = fgtsFiltrados.length - enviados;
    result.push({
      obrigacao: "Pesq. FGTS Trimestral",
      previstas: fgtsFiltrados.length,
      transmitidas: enviados,
      pendentes,
      emAtraso: fgtsFiltrados.filter((f) => f.pendenciaFgts === "SIM").length,
      pctConclusao:
        fgtsFiltrados.length > 0
          ? Math.round((enviados / fgtsFiltrados.length) * 100)
          : 0,
    });
  }

  // Espelho de Débito
  const espelhoFiltrados = espelho.filter((e) =>
    pertenceACarteira(e.carteira, carteira),
  );
  if (espelhoFiltrados.length > 0) {
    const enviados = espelhoFiltrados.filter(
      (e) => e.enviadoCliente === "SIM",
    ).length;
    const pendentes = espelhoFiltrados.length - enviados;
    const comOmissao = espelhoFiltrados.filter(
      (e) => e.omissao === "SIM",
    ).length;
    result.push({
      obrigacao: "Espelho de Débito",
      previstas: espelhoFiltrados.length,
      transmitidas: enviados,
      pendentes,
      emAtraso: comOmissao,
      pctConclusao:
        espelhoFiltrados.length > 0
          ? Math.round((enviados / espelhoFiltrados.length) * 100)
          : 0,
    });
  }

  // Obrigações genéricas filtradas por competência e tipo
  const obrigFiltradas = obrigacoes.filter(
    (o) => !competencia || o.competencia === competencia,
  );
  const tiposObrig = [...new Set(obrigFiltradas.map((o) => o.tipo))];
  for (const tipo of tiposObrig) {
    const deTipo = obrigFiltradas.filter((o) => o.tipo === tipo);
    const transmitidas = deTipo.filter((o) => o.status === "transmitido").length;
    const emAtrasoTipo = deTipo.filter((o) => o.status === "atrasado").length;
    const pendentes = deTipo.length - transmitidas;
    result.push({
      obrigacao: tipo,
      previstas: deTipo.length,
      transmitidas,
      pendentes,
      emAtraso: emAtrasoTipo,
      pctConclusao:
        deTipo.length > 0
          ? Math.round((transmitidas / deTipo.length) * 100)
          : 0,
    });
  }

  return result.sort((a, b) => b.previstas - a.previstas);
}

// ─── Rotinas ─────────────────────────────────────────────────────────────────

export function calcularResumoRotinas(
  tarefas: Tarefa[],
  competencia: string,
  carteira: string,
): ResumoRotinas {
  const { mes, ano } = parseCompetencia(competencia);
  const h = hoje();

  const tarefasFiltradas = tarefas.filter((t) => {
    if (!t) return false;
    if (!pertenceACarteira(t.carteira, carteira)) return false;
    return true;
  });

  const eventos = eventosDoMes(tarefasFiltradas, ano, mes);
  const previstas = eventos.length;
  const concluidas = eventos.filter((e) => e.status === "concluida").length;
  const emAndamento = eventos.filter((e) => e.status === "andamento").length;
  const emAtraso = eventos.filter((e) => e.status === "atrasada").length;
  const pendentes = previstas - concluidas - emAndamento - emAtraso;

  const pctExecucao =
    previstas > 0 ? Math.round((concluidas / previstas) * 100) : 0;

  return {
    previstas,
    concluidas,
    emAndamento,
    pendentes: Math.max(0, pendentes),
    emAtraso,
    pctExecucao,
  };
}

export function calcularProximasRotinas(
  tarefas: Tarefa[],
  carteira: string,
  limite = 10,
): ProximaRotina[] {
  const h = hoje();
  const resultado: ProximaRotina[] = [];

  const tarefasFiltradas = tarefas.filter(
    (t) => t && pertenceACarteira(t.carteira, carteira),
  );

  for (const t of tarefasFiltradas) {
    const data = dataDaRotina(t);
    if (!data) continue;
    const dias = diasAte(data);
    // Mostrar: não concluídas que vencem em até 14 dias ou já atrasadas
    if (t.status === "concluida" && dias > 0) continue;
    if (dias > 14) continue;

    resultado.push({
      id: t.id,
      titulo: t.titulo,
      vencimento: data
        .toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      periodicidade: t.periodicidade ?? "—",
      status: statusCronograma(t),
      diasAteVencimento: dias,
    });
  }

  return resultado
    .sort((a, b) => a.diasAteVencimento - b.diasAteVencimento)
    .slice(0, limite);
}

// ─── SST ─────────────────────────────────────────────────────────────────────

export function calcularResumoSST(
  registros: RegSST[],
  carteira: string,
): ResumoSST {
  const filtrados = registros.filter((r) =>
    pertenceACarteira(r.carteira, carteira),
  );

  const totalMonitoradas = filtrados.length;
  const sstNaMabit = filtrados.filter((r) => r.sstNaMabit === "SIM").length;
  const semSST = filtrados.filter((r) => r.sstNaMabit === "NÃO").length;
  const comExamesVencidos = filtrados.filter(
    (r) => r.examesVencidos === "SIM",
  ).length;
  const semProgramas = filtrados.filter(
    (r) => r.possuiProgramas === "NÃO",
  ).length;

  const pctEnviados =
    totalMonitoradas > 0
      ? Math.round((sstNaMabit / totalMonitoradas) * 100)
      : 0;

  return {
    totalMonitoradas,
    comExamesVencidos,
    semProgramas,
    sstNaMabit,
    semSST,
    pctEnviados,
  };
}

// ─── Pendências Críticas ──────────────────────────────────────────────────────

export function calcularPendenciasCriticas(
  folhaTarefas: FolhaTarefa[],
  obrigacoes: Obrigacao[],
  tarefas: Tarefa[],
  registrosSST: RegSST[],
  competencia: string,
  carteira: string,
  limite = 20,
): PendenciaCritica[] {
  const h = hoje();
  const lista: PendenciaCritica[] = [];

  // Folha em atraso (competência anterior finalizada sem conclusão)
  const vencFolha = prazoCompetencia(competencia);
  if (isAtrasado(vencFolha)) {
    const diasAtrasoFolha = Math.abs(diasAte(vencFolha));
    const folhaComp = folhaTarefas.filter(
      (t) =>
        t.competencia === competencia &&
        t.status !== "concluida" &&
        pertenceACarteira(t.carteira, carteira),
    );
    for (const t of folhaComp) {
      lista.push({
        area: "Folha",
        empresa: t.empresa || "—",
        demanda: `Folha ${competencia} — ${statusFolhaMeta[t.status].label}`,
        vencimento: vencFolha.toLocaleDateString("pt-BR"),
        diasEmAtraso: diasAtrasoFolha,
        responsavel: t.responsavel || "—",
      });
    }
  }

  // Obrigações atrasadas
  const obrigFiltradas = obrigacoes.filter(
    (o) =>
      (!competencia || o.competencia === competencia) &&
      (o.status === "atrasado" || o.status === "pendente"),
  );
  for (const o of obrigFiltradas) {
    const prazo = parseData(o.prazo);
    if (!prazo || !isAtrasado(prazo)) continue;
    lista.push({
      area: "Obrigações",
      empresa: o.empresa,
      demanda: o.tipo,
      vencimento: o.prazo,
      diasEmAtraso: Math.abs(diasAte(prazo)),
      responsavel: o.responsavel || "—",
    });
  }

  // Rotinas atrasadas
  const tarefasFiltradas = tarefas.filter(
    (t) => t && pertenceACarteira(t.carteira, carteira),
  );
  for (const t of tarefasFiltradas) {
    if (t.status === "concluida") continue;
    const prazo = parseData(t.prazo);
    if (!prazo || !isAtrasado(prazo)) continue;
    lista.push({
      area: "Rotinas",
      empresa: t.empresa || "Geral",
      demanda: t.titulo,
      vencimento: prazo.toLocaleDateString("pt-BR"),
      diasEmAtraso: Math.abs(diasAte(prazo)),
      responsavel: t.responsavel || "—",
    });
  }

  // SST com exames vencidos
  const sstFiltrados = registrosSST.filter((r) =>
    pertenceACarteira(r.carteira, carteira),
  );
  for (const r of sstFiltrados) {
    if (r.examesVencidos === "SIM") {
      lista.push({
        area: "SST",
        empresa: r.empresa,
        demanda: "Exames vencidos / Programas pendentes",
        vencimento: "—",
        diasEmAtraso: 0,
        responsavel: r.analista || "—",
      });
    }
  }

  return lista.sort((a, b) => b.diasEmAtraso - a.diasEmAtraso).slice(0, limite);
}

// ─── Pendências por Empresa ───────────────────────────────────────────────────

export function calcularPendenciasPorEmpresa(
  folhaTarefas: FolhaTarefa[],
  obrigacoes: Obrigacao[],
  tarefas: Tarefa[],
  registrosSST: RegSST[],
  competencia: string,
  carteira: string,
  topN = 10,
): PendenciaPorEmpresa[] {
  const mapa = new Map<string, PendenciaPorEmpresa>();

  const garantir = (empresa: string): PendenciaPorEmpresa => {
    if (!mapa.has(empresa)) {
      mapa.set(empresa, {
        empresa,
        totalPendencias: 0,
        folha: 0,
        obrigacoes: 0,
        sst: 0,
        rotinas: 0,
      });
    }
    return mapa.get(empresa)!;
  };

  // Folha
  folhaTarefas
    .filter(
      (t) =>
        t.competencia === competencia &&
        t.status !== "concluida" &&
        pertenceACarteira(t.carteira, carteira),
    )
    .forEach((t) => {
      const p = garantir(t.empresa || "—");
      p.folha++;
      p.totalPendencias++;
    });

  // Obrigações
  obrigacoes
    .filter(
      (o) =>
        (!competencia || o.competencia === competencia) &&
        (o.status === "pendente" || o.status === "atrasado"),
    )
    .forEach((o) => {
      const p = garantir(o.empresa);
      p.obrigacoes++;
      p.totalPendencias++;
    });

  // Rotinas
  tarefas
    .filter(
      (t) =>
        t &&
        t.status !== "concluida" &&
        pertenceACarteira(t.carteira, carteira),
    )
    .forEach((t) => {
      const prazo = parseData(t.prazo);
      if (prazo && isAtrasado(prazo)) {
        const p = garantir(t.empresa || "Geral");
        p.rotinas++;
        p.totalPendencias++;
      }
    });

  // SST
  registrosSST
    .filter(
      (r) =>
        pertenceACarteira(r.carteira, carteira) &&
        (r.examesVencidos === "SIM" || r.possuiProgramas === "NÃO"),
    )
    .forEach((r) => {
      const p = garantir(r.empresa);
      p.sst++;
      p.totalPendencias++;
    });

  return Array.from(mapa.values())
    .filter((p) => p.totalPendencias > 0)
    .sort((a, b) => b.totalPendencias - a.totalPendencias)
    .slice(0, topN);
}

// ─── Demandas por Área ───────────────────────────────────────────────────────

export function calcularDemandaPorArea(
  folhaTarefas: FolhaTarefa[],
  obrigacoes: Obrigacao[],
  tarefas: Tarefa[],
  registrosSST: RegSST[],
  dctfweb: RegDCTFWeb[],
  fgts: RegFGTSTrimestral[],
  espelho: RegEspelhoDebito[],
  competencia: string,
  carteira: string,
): DemandaPorArea[] {
  // Folha
  const folhaComp = folhaTarefas.filter(
    (t) =>
      t.competencia === competencia && pertenceACarteira(t.carteira, carteira),
  );
  const folhaConcluidas = folhaComp.filter((t) => t.status === "concluida").length;

  // Obrigações totais
  const obrFiltradas = obrigacoes.filter(
    (o) => !competencia || o.competencia === competencia,
  );
  const dctfFiltrados = dctfweb.filter((d) => pertenceACarteira(d.carteira, carteira));
  const fgtsFiltrados = fgts.filter((f) => pertenceACarteira(f.carteira, carteira));
  const espelhoFiltrados = espelho.filter((e) => pertenceACarteira(e.carteira, carteira));
  const totalObrig =
    obrFiltradas.length + dctfFiltrados.length + fgtsFiltrados.length + espelhoFiltrados.length;
  const concluidasObrig =
    obrFiltradas.filter((o) => o.status === "transmitido").length +
    dctfFiltrados.filter((d) => d.transmissaoPublicacao && d.transmissaoPublicacao !== "" && d.transmissaoPublicacao !== "—").length +
    fgtsFiltrados.filter((f) => f.enviadoCliente === "SIM").length +
    espelhoFiltrados.filter((e) => e.enviadoCliente === "SIM").length;

  // Rotinas
  const { mes, ano } = parseCompetencia(competencia);
  const tarefasFiltradas = tarefas.filter(
    (t) => t && pertenceACarteira(t.carteira, carteira),
  );
  const eventosRotinas = eventosDoMes(tarefasFiltradas, ano, mes);
  const rotinasTotal = eventosRotinas.length;
  const rotinasConcluidas = eventosRotinas.filter(
    (e) => e.status === "concluida",
  ).length;

  // SST
  const sstFiltrados = registrosSST.filter((r) =>
    pertenceACarteira(r.carteira, carteira),
  );
  const sstTotal = sstFiltrados.length;
  const sstOk = sstFiltrados.filter(
    (r) => r.sstNaMabit === "SIM" && r.examesVencidos !== "SIM",
  ).length;

  const areas: DemandaPorArea[] = [
    {
      area: "Folha",
      demandas: folhaComp.length,
      concluidas: folhaConcluidas,
      pendentes: folhaComp.length - folhaConcluidas,
      pctConclusao:
        folhaComp.length > 0
          ? Math.round((folhaConcluidas / folhaComp.length) * 100)
          : 0,
    },
    {
      area: "Obrigações",
      demandas: totalObrig,
      concluidas: concluidasObrig,
      pendentes: totalObrig - concluidasObrig,
      pctConclusao:
        totalObrig > 0 ? Math.round((concluidasObrig / totalObrig) * 100) : 0,
    },
    {
      area: "Rotinas",
      demandas: rotinasTotal,
      concluidas: rotinasConcluidas,
      pendentes: rotinasTotal - rotinasConcluidas,
      pctConclusao:
        rotinasTotal > 0
          ? Math.round((rotinasConcluidas / rotinasTotal) * 100)
          : 0,
    },
    {
      area: "SST",
      demandas: sstTotal,
      concluidas: sstOk,
      pendentes: sstTotal - sstOk,
      pctConclusao:
        sstTotal > 0 ? Math.round((sstOk / sstTotal) * 100) : 0,
    },
  ];

  return areas.filter((a) => a.demandas > 0);
}

// ─── Distribuição Geral das Demandas ─────────────────────────────────────────

export function calcularDistribuicaoDemandas(
  folhaTarefas: FolhaTarefa[],
  tarefas: Tarefa[],
  obrigacoes: Obrigacao[],
  competencia: string,
  carteira: string,
): DistribuicaoDemanda[] {
  const { mes, ano } = parseCompetencia(competencia);
  const h = hoje();

  // Tarefas gerais
  const tarefasFiltradas = tarefas.filter(
    (t) => t && pertenceACarteira(t.carteira, carteira),
  );
  const naoIniciadas = tarefasFiltradas.filter(
    (t) => t.status === "backlog",
  ).length;
  const emAndamento = tarefasFiltradas.filter(
    (t) => t.status === "fazendo",
  ).length;
  const emRevisao = tarefasFiltradas.filter(
    (t) => t.status === "revisao",
  ).length;
  const concluidas = tarefasFiltradas.filter(
    (t) => t.status === "concluida",
  ).length;

  // Folha
  const folhaComp = folhaTarefas.filter(
    (t) =>
      t.competencia === competencia && pertenceACarteira(t.carteira, carteira),
  );
  const folhaConcluidas = folhaComp.filter((t) => t.status === "concluida").length;
  const folhaAndamento = folhaComp.filter(
    (t) => t.status === "andamento" || t.status === "conferencia",
  ).length;
  const folhaAguardando = folhaComp.filter(
    (t) => t.status === "aguardando",
  ).length;

  // Obrigações
  const obrFiltradas = obrigacoes.filter(
    (o) => !competencia || o.competencia === competencia,
  );
  const obrTransmitidas = obrFiltradas.filter(
    (o) => o.status === "transmitido",
  ).length;
  const obrPendentes = obrFiltradas.filter(
    (o) => o.status === "pendente",
  ).length;
  const obrAtraso = obrFiltradas.filter(
    (o) => o.status === "atrasado",
  ).length;

  const distribuicao = [
    {
      name: "Não Iniciadas",
      value: naoIniciadas + (folhaComp.length - folhaComp.length),
      color: "var(--muted-foreground)",
    },
    {
      name: "Em Andamento",
      value: emAndamento + folhaAndamento,
      color: "var(--chart-2)",
    },
    {
      name: "Aguardando Info",
      value: emRevisao + folhaAguardando,
      color: "var(--chart-4)",
    },
    {
      name: "Concluídas",
      value: concluidas + folhaConcluidas + obrTransmitidas,
      color: "var(--chart-3)",
    },
    {
      name: "Em Atraso",
      value: obrAtraso,
      color: "var(--destructive)",
    },
  ];

  return distribuicao.filter((d) => d.value > 0);
}

// ─── Próximos Vencimentos ─────────────────────────────────────────────────────

export function calcularProximosVencimentos(
  tarefas: Tarefa[],
  folhaTarefas: FolhaTarefa[],
  obrigacoes: Obrigacao[],
  competencia: string,
  carteira: string,
): VencimentosResumo {
  const h = hoje();
  let hoje_ = 0;
  let em3Dias = 0;
  let em7Dias = 0;
  let atrasadas = 0;

  const verificar = (prazoStr: string | undefined, concluido: boolean) => {
    if (concluido || !prazoStr) return;
    const d = parseData(prazoStr);
    if (!d) return;
    const dias = diasAte(d);
    if (dias < 0) atrasadas++;
    else if (dias === 0) hoje_++;
    else if (dias <= 3) em3Dias++;
    else if (dias <= 7) em7Dias++;
  };

  // Rotinas
  tarefas
    .filter((t) => t && pertenceACarteira(t.carteira, carteira))
    .forEach((t) => verificar(t.prazo, t.status === "concluida"));

  // Folha
  const vencFolha = prazoCompetencia(competencia).toISOString().slice(0, 10);
  folhaTarefas
    .filter(
      (t) =>
        t.competencia === competencia && pertenceACarteira(t.carteira, carteira),
    )
    .forEach((t) => verificar(vencFolha, t.status === "concluida"));

  // Obrigações
  obrigacoes
    .filter((o) => !competencia || o.competencia === competencia)
    .forEach((o) =>
      verificar(o.prazo, o.status === "transmitido"),
    );

  return { hoje: hoje_, em3Dias, em7Dias, atrasadas };
}

// ─── Indicador Geral de Conclusão ────────────────────────────────────────────

export type IndicadorGeralConclusao = {
  previstas: number;
  concluidas: number;
  pctGeral: number;
};

export function calcularIndicadorGeralConclusao(
  folhaTarefas: FolhaTarefa[],
  obrigacoes: Obrigacao[],
  tarefas: Tarefa[],
  dctfweb: RegDCTFWeb[],
  fgts: RegFGTSTrimestral[],
  espelho: RegEspelhoDebito[],
  competencia: string,
  carteira: string,
): IndicadorGeralConclusao {
  // Folha
  const folhaComp = folhaTarefas.filter(
    (t) =>
      t.competencia === competencia && pertenceACarteira(t.carteira, carteira),
  );
  const folhaConcluidas = folhaComp.filter((t) => t.status === "concluida").length;

  // Obrigações
  const obrFiltradas = obrigacoes.filter(
    (o) => !competencia || o.competencia === competencia,
  );
  const dctfFiltrados = dctfweb.filter((d) => pertenceACarteira(d.carteira, carteira));
  const fgtsFiltrados = fgts.filter((f) => pertenceACarteira(f.carteira, carteira));
  const espelhoFiltrados = espelho.filter((e) => pertenceACarteira(e.carteira, carteira));

  const totalObrig =
    obrFiltradas.length + dctfFiltrados.length + fgtsFiltrados.length + espelhoFiltrados.length;
  const obrConcluidas =
    obrFiltradas.filter((o) => o.status === "transmitido").length +
    dctfFiltrados.filter((d) => d.transmissaoPublicacao && d.transmissaoPublicacao !== "" && d.transmissaoPublicacao !== "—").length +
    fgtsFiltrados.filter((f) => f.enviadoCliente === "SIM").length +
    espelhoFiltrados.filter((e) => e.enviadoCliente === "SIM").length;

  // Rotinas
  const { mes, ano } = parseCompetencia(competencia);
  const tarefasFiltradas = tarefas.filter(
    (t) => t && pertenceACarteira(t.carteira, carteira),
  );
  const eventosRotinas = eventosDoMes(tarefasFiltradas, ano, mes);
  const rotinasConcluidas = eventosRotinas.filter(
    (e) => e.status === "concluida",
  ).length;

  const previstas = folhaComp.length + totalObrig + eventosRotinas.length;
  const concluidas = folhaConcluidas + obrConcluidas + rotinasConcluidas;
  const pctGeral =
    previstas > 0 ? Math.round((concluidas / previstas) * 100) : 0;

  return { previstas, concluidas, pctGeral };
}

// ─── Transmissão da Folha por Vencimento ─────────────────────────────────────

export type EmpresaFolhaVencimento = {
  id: string;
  codigo: string;
  nome: string;
  carteira: string;
  responsavel: string;
  status: StatusFolha;
  transmitida: boolean;
  dataConclusao?: string;
  tipoPonto?: string;
  empregados?: number;
};

export type ItemTransmissaoFolhaVencimento = {
  dia: string;
  label: string;
  tituloCard: string;
  subtitulo?: string;
  isDomestica?: boolean;
  total: number;
  transmitidas: number;
  pendentes: number;
  emAtraso: number;
  pctTransmitido: number;
  porStatus: {
    concluida: number;
    conferencia: number;
    andamento: number;
    aguardando: number;
    nao_iniciada: number;
  };
  empresas: EmpresaFolhaVencimento[];
};

export type ResumoTransmissoesFolhaVencimento = {
  totalGeral: number;
  totalTransmitidas: number;
  totalPendentes: number;
  totalEmAtraso: number;
  pctGeralTransmitido: number;
  itens: ItemTransmissaoFolhaVencimento[];
};

export function isEmpresaDomestica(empresa: Empresa): boolean {
  if (empresa.tipo === "domestico-pf") return true;
  const texto = `${empresa.nome} ${empresa.regime || ""} ${empresa.convenio || ""} ${empresa.particularidades?.fechamento || ""}`.toLowerCase();
  return (
    texto.includes("domestico") ||
    texto.includes("doméstic") ||
    texto.includes("domestica") ||
    texto.includes("esocial domestico") ||
    texto.includes("e-social domestico") ||
    texto.includes("empregador doméstico") ||
    texto.includes("empregador domestico")
  );
}

export function extrairDiaFechamento(
  empresa: Empresa,
  particularidadesMap?: Map<string, RegParticularidade>,
): string {
  const part = particularidadesMap?.get(empresa.id);
  if (part?.diaFolha && part.diaFolha !== "") {
    return part.diaFolha;
  }

  const textoFolha = (part?.folhaPagamento || "").trim();
  const textoEmpresa = (empresa.particularidades?.fechamento || "").trim();
  const texto = textoFolha || textoEmpresa;

  if (!texto) return "20";

  // Busca menções explícitas a dia de envio ou fechamento
  const matchEnvio = texto.match(/envio\s+(?:até\s+)?(?:dia\s+)?(\d{1,2})/i);
  if (matchEnvio && matchEnvio[1]) {
    return String(parseInt(matchEnvio[1], 10)).padStart(2, "0");
  }

  const matchDia = texto.match(/(?:dia|fechamento|vencimento|do|ao|até)\s*(\d{1,2})/i);
  if (matchDia && matchDia[1]) {
    return String(parseInt(matchDia[1], 10)).padStart(2, "0");
  }

  if (/\b25\b/.test(texto)) return "25";
  if (/\b30\b/.test(texto)) return "30";
  if (/\b20\b/.test(texto)) return "20";
  if (/\b0?5\b/.test(texto)) return "05";
  if (/\b10\b/.test(texto)) return "10";
  if (/\b15\b/.test(texto)) return "15";

  return "20";
}

export function calcularTransmissoesFolhaPorVencimento(
  folhaTarefas: FolhaTarefa[],
  empresas: Empresa[],
  particularidades: RegParticularidade[],
  competencia: string,
  carteira: string,
): ResumoTransmissoesFolhaVencimento {
  const isAll = !carteira || carteira === TODAS_CARTEIRAS;
  const empresasAtivas = empresas.filter((e) => e && !e.excluida);
  const empresasFiltradas = isAll
    ? empresasAtivas
    : empresasAtivas.filter(
        (e) => normalizarCarteira(e.carteira) === normalizarCarteira(carteira),
      );

  const folhaComp = folhaTarefas.filter((t) => t.competencia === competencia);
  const folhaMap = new Map<string, FolhaTarefa>();
  for (const t of folhaComp) {
    if (t.id) folhaMap.set(t.id, t);
    if (t.codigo) folhaMap.set(t.codigo, t);
    if (t.empresa) folhaMap.set(t.empresa.trim().toLowerCase(), t);
  }

  const partMap = new Map<string, RegParticularidade>();
  for (const p of particularidades) {
    if (p.empresaId) partMap.set(p.empresaId, p);
  }

  const gruposMap = new Map<string, EmpresaFolhaVencimento[]>();
  gruposMap.set("20", []);
  gruposMap.set("25", []);
  gruposMap.set("30", []);
  gruposMap.set("domestica", []);

  for (const emp of empresasFiltradas) {
    const isDom = isEmpresaDomestica(emp);
    const chaveGrupo = isDom
      ? "domestica"
      : (() => {
          const diaRaw = extrairDiaFechamento(emp, partMap);
          return diaRaw.length === 1 ? `0${diaRaw}` : diaRaw;
        })();

    if (!gruposMap.has(chaveGrupo)) {
      gruposMap.set(chaveGrupo, []);
    }

    const tarefa =
      folhaMap.get(`${emp.codigoDominio || emp.id}-${competencia}`) ||
      folhaMap.get(`${emp.id}::${competencia}`) ||
      folhaMap.get(emp.codigoDominio || "") ||
      folhaMap.get(emp.id) ||
      folhaMap.get(emp.nome.trim().toLowerCase());

    const status: StatusFolha = tarefa?.status || "nao_iniciada";
    const transmitida = status === "concluida" || Boolean(tarefa?.dataConclusao || tarefa?.dataPublicacao);

    gruposMap.get(chaveGrupo)!.push({
      id: emp.id,
      codigo: emp.codigoDominio || emp.id,
      nome: emp.nome,
      carteira: emp.carteira || "Sem Carteira",
      responsavel: emp.responsavel || emp.analista || "Não informado",
      status,
      transmitida,
      dataConclusao: tarefa?.dataConclusao || tarefa?.dataPublicacao,
      tipoPonto: tarefa?.tipoPonto,
      empregados: tarefa?.empregados ?? emp.funcionarios ?? 0,
    });
  }

  const [mesRaw, anoRaw] = competencia.split("/").map(Number);
  const mesComp = mesRaw ?? 1;
  const anoComp = anoRaw ?? new Date().getFullYear();
  const hojeD = hoje();

  const itens: ItemTransmissaoFolhaVencimento[] = [];
  
  // Ordenação: 20, 25, 30, outros dias e Doméstica (como 4º card)
  const chaves = Array.from(gruposMap.keys());
  const diasNumericos = chaves
    .filter((k) => k !== "domestica" && !isNaN(Number(k)))
    .sort((a, b) => Number(a) - Number(b));
  const outrosDias = chaves.filter((k) => k !== "domestica" && isNaN(Number(k)));
  const chavesOrdenadas = [
    ...diasNumericos,
    ...outrosDias,
    ...(gruposMap.has("domestica") ? ["domestica"] : []),
  ];

  let totalGeral = 0;
  let totalTransmitidas = 0;
  let totalPendentes = 0;
  let totalEmAtraso = 0;

  for (const chave of chavesOrdenadas) {
    const listaEmpresas = gruposMap.get(chave) || [];
    const isDom = chave === "domestica";

    // Mantém grupos padrão (20, 25, 30 e domestica) sempre visíveis
    if (listaEmpresas.length === 0 && chave !== "20" && chave !== "25" && chave !== "30" && !isDom) {
      continue;
    }

    const diaNum = isDom ? 7 : (Number(chave) || 20);
    const dataVenc = new Date(anoComp, mesComp, diaNum);
    const prazoVencido = dataVenc.getTime() < hojeD.getTime();

    let transmitidas = 0;
    let pendentes = 0;
    let emAtraso = 0;

    const porStatus = {
      concluida: 0,
      conferencia: 0,
      andamento: 0,
      aguardando: 0,
      nao_iniciada: 0,
    };

    for (const emp of listaEmpresas) {
      porStatus[emp.status] = (porStatus[emp.status] ?? 0) + 1;

      if (emp.transmitida) {
        transmitidas++;
      } else {
        pendentes++;
        if (prazoVencido) {
          emAtraso++;
        }
      }
    }

    const total = listaEmpresas.length;
    const pctTransmitido = total > 0 ? Math.round((transmitidas / total) * 100) : 0;

    totalGeral += total;
    totalTransmitidas += transmitidas;
    totalPendentes += pendentes;
    totalEmAtraso += emAtraso;

    itens.push({
      dia: chave,
      label: isDom ? "Folhas Domésticas (PF)" : `Folhas do Dia ${chave}`,
      tituloCard: isDom ? "Folhas Domésticas" : `Folhas do ${Number(chave)}`,
      subtitulo: isDom ? "eSocial Doméstico / DAE (PF)" : `Vencimento dia ${chave}`,
      isDomestica: isDom,
      total,
      transmitidas,
      pendentes,
      emAtraso,
      pctTransmitido,
      porStatus,
      empresas: listaEmpresas,
    });
  }

  const pctGeralTransmitido =
    totalGeral > 0 ? Math.round((totalTransmitidas / totalGeral) * 100) : 0;

  return {
    totalGeral,
    totalTransmitidas,
    totalPendentes,
    totalEmAtraso,
    pctGeralTransmitido,
    itens,
  };
}

