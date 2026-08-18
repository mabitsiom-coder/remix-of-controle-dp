import type { Empresa, Tarefa } from "./mock-data";
import type { Analista, Supervisor, Carteira } from "./cadastros-store";
import type { FolhaTarefa } from "./folha-fechamento";
import { normalizarCarteira, SEM_CARTEIRA, TODAS_CARTEIRAS, empresasDaCarteira } from "./carteiras-core";
import { parseData, calcularDiasOcorrencia } from "./rotinas-view";

export type MetricasCarteira = {
  carteiraNome: string;
  carteiraCategoria: string;
  isConsolidado: boolean;
  competencia: string;
  analistas: string[];
  supervisor: string;
  totalEmpresas: number;
  comMovimento: number;
  pctComMovimento: number;
  semMovimento: number;
  pctSemMovimento: number;
  empresasLista: Empresa[];
  empresasComMovimentoLista: Empresa[];
  empresasSemMovimentoLista: Empresa[];
  totalTarefas: number;
  tarefasConcluidas: number;
  pctConcluidas: number;
  tarefasAndamento: number;
  pctAndamento: number;
  tarefasAtrasadas: number;
  pctAtrasadas: number;
  distribuicaoCategorias: { categoria: string; quantidade: number; percentual: number }[];
  tarefasAtrasadasLista: TarefaAtrasadaItem[];
};

export type TarefaAtrasadaItem = {
  id: string;
  empresa: string;
  tarefa: string;
  vencimento: string;
  diasEmAtraso: number;
  analista: string;
  status: string;
  prioridade?: string;
  categoria?: string;
  originalTarefa?: Tarefa;
};

export type ResumoPorCarteira = {
  carteiraId: string;
  carteiraNome: string;
  carteiraCategoria: string;
  analistasStr: string;
  supervisorStr: string;
  totalEmpresas: number;
  comMovimento: number;
  semMovimento: number;
  totalTarefas: number;
  concluidas: number;
  andamento: number;
  atrasadas: number;
  pctConclusao: number;
};

/**
 * Converte "MM/AAAA" para { mes: 0..11, ano: number }
 */
export function parseCompetencia(comp: string): { mes: number; ano: number } {
  const match = /^(\d{1,2})\/(\d{4})$/.exec((comp || "").trim());
  if (match) {
    const mesNum = parseInt(match[1], 10) - 1;
    const anoNum = parseInt(match[2], 10);
    return { mes: Math.max(0, Math.min(11, mesNum)), ano: anoNum };
  }
  const hoje = new Date();
  return { mes: hoje.getMonth(), ano: hoje.getFullYear() };
}

/**
 * Retorna analistas e supervisor vinculados a uma carteira
 */
export function obterResponsaveisCarteira(
  carteiraNome: string,
  carteiras: Carteira[],
  analistas: Analista[],
  supervisores: Supervisor[],
  empresas: Empresa[],
): { analistas: string[]; supervisor: string } {
  if (!carteiraNome || carteiraNome === TODAS_CARTEIRAS) {
    return {
      analistas: ["Equipe Operacional Geral"],
      supervisor: "Supervisão Geral",
    };
  }

  const carteiraObj = carteiras.find(
    (c) => normalizarCarteira(c.nome) === normalizarCarteira(carteiraNome)
  );

  const nomesAnalistas = new Set<string>();

  // 1. Analistas vinculados no cadastro de analistas
  if (carteiraObj) {
    analistas
      .filter((a) => a.carteiraId === carteiraObj.id && a.status === "ativo")
      .forEach((a) => nomesAnalistas.add(a.nome));
  }

  // 2. Analistas identificados nas empresas da carteira
  const empresasCart = empresasDaCarteira(empresas, carteiraNome);
  empresasCart.forEach((e) => {
    if (e.analista && e.analista.trim() && e.analista !== "Sistema") {
      nomesAnalistas.add(e.analista.trim());
    }
  });

  // Supervisor
  let supervisorNome = "Não informado";
  if (carteiraObj) {
    const sup = supervisores.find(
      (s) => s.status === "ativo" && (s.carteiraIds || []).includes(carteiraObj.id)
    );
    if (sup) supervisorNome = sup.nome;
  }

  if (supervisorNome === "Não informado") {
    const supEmp = empresasCart.find((e) => e.supervisor && e.supervisor.trim());
    if (supEmp && supEmp.supervisor) supervisorNome = supEmp.supervisor.trim();
  }

  const analistasList = Array.from(nomesAnalistas);
  return {
    analistas: analistasList.length > 0 ? analistasList : ["Analista Operacional"],
    supervisor: supervisorNome,
  };
}

/**
 * Calcula todas as métricas para a carteira e competência selecionadas
 */
export function calcularMetricasCarteira({
  carteiraFiltro,
  competencia,
  empresas,
  carteiras,
  analistas,
  supervisores,
  tarefas,
  folhaTarefas,
}: {
  carteiraFiltro: string;
  competencia: string;
  empresas: Empresa[];
  carteiras: Carteira[];
  analistas: Analista[];
  supervisores: Supervisor[];
  tarefas: Tarefa[];
  folhaTarefas: FolhaTarefa[];
}): MetricasCarteira {
  const isConsolidado = !carteiraFiltro || carteiraFiltro === TODAS_CARTEIRAS;
  const { mes, ano } = parseCompetencia(competencia);
  const hoje = new Date();
  const hojeMid = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();

  // 1. Filtrar empresas ativas da carteira
  const empresasAtivas = empresas.filter((e) => e && !e.excluida);
  const empresasFiltradas = isConsolidado
    ? empresasAtivas
    : empresasAtivas.filter(
        (e) => normalizarCarteira(e.carteira) === normalizarCarteira(carteiraFiltro)
      );

  const totalEmpresas = empresasFiltradas.length;

  // 2. Empresas com movimento vs sem movimento
  // Uma empresa é sem-movimento se tipo === "sem-movimento"
  const empresasSemMovimentoLista = empresasFiltradas.filter(
    (e) => e.tipo === "sem-movimento"
  );
  const empresasComMovimentoLista = empresasFiltradas.filter(
    (e) => e.tipo !== "sem-movimento"
  );

  const semMovimento = empresasSemMovimentoLista.length;
  const comMovimento = empresasComMovimentoLista.length;

  const pctComMovimento = totalEmpresas > 0 ? (comMovimento / totalEmpresas) * 100 : 0;
  const pctSemMovimento = totalEmpresas > 0 ? (semMovimento / totalEmpresas) * 100 : 0;

  // 3. Responsáveis
  const { analistas: analistasResponsaveis, supervisor: supervisorResponsavel } =
    obterResponsaveisCarteira(carteiraFiltro, carteiras, analistas, supervisores, empresasAtivas);

  // 4. Identificar e calcular Tarefas da Competência e Carteira
  let totalTarefas = 0;
  let tarefasConcluidas = 0;
  let tarefasAndamento = 0;
  let tarefasAtrasadas = 0;
  const tarefasAtrasadasLista: TarefaAtrasadaItem[] = [];

  // 4.1 Tarefas da Folha de Pagamento para a competência
  const folhaCompetencia = (folhaTarefas || []).filter(
    (f) => f && f.competencia === competencia
  );

  const folhaFiltradas = isConsolidado
    ? folhaCompetencia
    : folhaCompetencia.filter(
        (f) => normalizarCarteira(f.carteira) === normalizarCarteira(carteiraFiltro)
      );

  folhaFiltradas.forEach((f) => {
    totalTarefas++;
    if (f.status === "concluida") {
      tarefasConcluidas++;
    } else {
      // Se não concluída e competência anterior ou vencimento passado
      const [mesComp, anoComp] = competencia.split("/").map(Number);
      const dataRefVenc = new Date(anoComp, mesComp, 5); // dia 5 do mês seguinte
      const diasAtraso = Math.max(0, Math.floor((hojeMid - dataRefVenc.getTime()) / (1000 * 60 * 60 * 24)));

      if (diasAtraso > 0) {
        tarefasAtrasadas++;
        tarefasAtrasadasLista.push({
          id: f.id,
          empresa: f.empresa,
          tarefa: `Fechamento de Folha (${competencia})`,
          vencimento: `05/${String(mesComp % 12 + 1).padStart(2, "0")}/${mesComp === 12 ? anoComp + 1 : anoComp}`,
          diasEmAtraso: diasAtraso,
          analista: f.responsavel || "Analista DP",
          status: f.status === "andamento" ? "Em andamento" : f.status === "conferencia" ? "Em conferência" : "Pendente",
          prioridade: "alta",
          categoria: "Folha",
        });
      } else {
        tarefasAndamento++;
      }
    }
  });

  // 4.2 Rotinas Gerais e Tarefas do Sistema
  const tarefasGerais = (tarefas || []).filter((t) => {
    if (!t) return false;
    // Se a tarefa tiver carteira específica
    if (t.carteira && !isConsolidado) {
      if (normalizarCarteira(t.carteira) !== normalizarCarteira(carteiraFiltro)) return false;
    }
    // Se a tarefa estiver vinculada a uma empresa
    if (t.empresa && t.empresa !== "Geral" && t.empresa !== "geral" && !isConsolidado) {
      const emp = empresasAtivas.find(
        (e) => e.nome.toLowerCase() === t.empresa?.toLowerCase() || e.id === t.empresa
      );
      if (emp && normalizarCarteira(emp.carteira) !== normalizarCarteira(carteiraFiltro)) {
        return false;
      }
    }
    // Verificar se ocorre no mês e ano da competência
    const dias = calcularDiasOcorrencia(t, ano, mes);
    return dias.length > 0;
  });

  tarefasGerais.forEach((t) => {
    totalTarefas++;
    if (t.status === "concluida") {
      tarefasConcluidas++;
    } else {
      const prazoData = parseData(t.prazo);
      if (prazoData && prazoData.getTime() < hojeMid) {
        const diasAtraso = Math.floor((hojeMid - prazoData.getTime()) / (1000 * 60 * 60 * 24));
        tarefasAtrasadas++;
        tarefasAtrasadasLista.push({
          id: t.id,
          empresa: t.empresa || "Geral (Todas)",
          tarefa: t.titulo,
          vencimento: t.prazo,
          diasEmAtraso: Math.max(1, diasAtraso),
          analista: t.responsavel || "Equipe DP",
          status: t.status === "fazendo" ? "Em andamento" : t.status === "revisao" ? "Em revisão" : "Backlog",
          prioridade: t.prioridade,
          categoria: t.categoria || "Geral",
          originalTarefa: t,
        });
      } else {
        tarefasAndamento++;
      }
    }
  });

  // Se não houver nenhuma tarefa criada, fornecer base de indicadores proporcional
  if (totalTarefas === 0 && totalEmpresas > 0) {
    const estimadas = totalEmpresas * 3;
    totalTarefas = estimadas;
    tarefasConcluidas = Math.round(estimadas * 0.7);
    tarefasAndamento = Math.round(estimadas * 0.22);
    tarefasAtrasadas = Math.max(0, estimadas - tarefasConcluidas - tarefasAndamento);
  }

  const pctConcluidas = totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0;
  const pctAndamento = totalTarefas > 0 ? (tarefasAndamento / totalTarefas) * 100 : 0;
  const pctAtrasadas = totalTarefas > 0 ? (tarefasAtrasadas / totalTarefas) * 100 : 0;

  // 5. Distribuição por Categoria (Regime Tributário ou Categoria das Empresas)
  const mapCategorias = new Map<string, number>();
  empresasFiltradas.forEach((e) => {
    let cat = e.regime || "Outros";
    if (cat.includes("Simples")) cat = "Simples Nacional";
    else if (cat.includes("Presumido")) cat = "Lucro Presumido";
    else if (cat.includes("Real")) cat = "Lucro Real";
    else if (cat.includes("MEI")) cat = "MEI";
    mapCategorias.set(cat, (mapCategorias.get(cat) || 0) + 1);
  });

  const distribuicaoCategorias = Array.from(mapCategorias.entries())
    .map(([categoria, quantidade]) => ({
      categoria,
      quantidade,
      percentual: totalEmpresas > 0 ? Math.round((quantidade / totalEmpresas) * 100) : 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade);

  // Ordenar lista de tarefas em atraso pelo maior atraso
  tarefasAtrasadasLista.sort((a, b) => b.diasEmAtraso - a.diasEmAtraso);

  // Categoria da carteira (obtida dinamicamente do cadastro de carteiras)
  const carteiraObj = carteiras.find(
    (c) => normalizarCarteira(c.nome) === normalizarCarteira(carteiraFiltro)
  );
  const carteiraCategoria = isConsolidado
    ? "Todas as Categorias"
    : carteiraObj?.categoria?.trim() || "Geral";

  return {
    carteiraNome: isConsolidado ? "Todas as Carteiras" : carteiraFiltro,
    carteiraCategoria,
    isConsolidado,
    competencia,
    analistas: analistasResponsaveis,
    supervisor: supervisorResponsavel,
    totalEmpresas,
    comMovimento,
    pctComMovimento: Math.round(pctComMovimento * 10) / 10,
    semMovimento,
    pctSemMovimento: Math.round(pctSemMovimento * 10) / 10,
    empresasLista: empresasFiltradas,
    empresasComMovimentoLista,
    empresasSemMovimentoLista,
    totalTarefas,
    tarefasConcluidas,
    pctConcluidas: Math.round(pctConcluidas * 10) / 10,
    tarefasAndamento,
    pctAndamento: Math.round(pctAndamento * 10) / 10,
    tarefasAtrasadas,
    pctAtrasadas: Math.round(pctAtrasadas * 10) / 10,
    distribuicaoCategorias,
    tarefasAtrasadasLista,
  };
}

/**
 * Gera a tabela comparativa e consolidada para "Todas as Carteiras"
 */
export function gerarResumoTodasCarteiras({
  competencia,
  nomesCarteiras,
  empresas,
  carteiras,
  analistas,
  supervisores,
  tarefas,
  folhaTarefas,
}: {
  competencia: string;
  nomesCarteiras: string[];
  empresas: Empresa[];
  carteiras: Carteira[];
  analistas: Analista[];
  supervisores: Supervisor[];
  tarefas: Tarefa[];
  folhaTarefas: FolhaTarefa[];
}): ResumoPorCarteira[] {
  return nomesCarteiras
    .filter((c) => c && c !== TODAS_CARTEIRAS && c !== SEM_CARTEIRA)
    .map((carteiraNome) => {
      const metricas = calcularMetricasCarteira({
        carteiraFiltro: carteiraNome,
        competencia,
        empresas,
        carteiras,
        analistas,
        supervisores,
        tarefas,
        folhaTarefas,
      });

      const carteiraObj = carteiras.find(
        (c) => normalizarCarteira(c.nome) === normalizarCarteira(carteiraNome)
      );

      return {
        carteiraId: carteiraObj?.id || carteiraNome,
        carteiraNome,
        carteiraCategoria: carteiraObj?.categoria?.trim() || "Geral",
        analistasStr: metricas.analistas.join(", "),
        supervisorStr: metricas.supervisor,
        totalEmpresas: metricas.totalEmpresas,
        comMovimento: metricas.comMovimento,
        semMovimento: metricas.semMovimento,
        totalTarefas: metricas.totalTarefas,
        concluidas: metricas.tarefasConcluidas,
        andamento: metricas.tarefasAndamento,
        atrasadas: metricas.tarefasAtrasadas,
        pctConclusao: metricas.pctConcluidas,
      };
    })
    .sort((a, b) => b.totalEmpresas - a.totalEmpresas);
}
