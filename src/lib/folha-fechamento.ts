export type EtapaStatus = "pendente" | "andamento" | "concluido" | "na";

export const etapaStatusOrder: EtapaStatus[] = ["pendente", "andamento", "concluido", "na"];

export const etapaStatusMeta: Record<EtapaStatus, { label: string; dot: string; text: string; bg: string }> = {
  pendente: { label: "Pendente", dot: "bg-destructive", text: "text-destructive", bg: "bg-destructive/10" },
  andamento: { label: "Em andamento", dot: "bg-warning", text: "text-warning", bg: "bg-warning/10" },
  concluido: { label: "Concluído", dot: "bg-success", text: "text-success", bg: "bg-success/10" },
  na: { label: "Não se aplica", dot: "bg-muted-foreground/50", text: "text-muted-foreground", bg: "bg-muted" },
};

export const etapasChecklist = [
  { key: "aniversariantes", label: "Aniversariantes", obrigatorio: false },
  { key: "pontoConferencia", label: "Ponto p/ Conferência", obrigatorio: true },
  { key: "folhaAnalise", label: "Folha p/ Análise", obrigatorio: true },
  { key: "lancVariaveis", label: "Lanç. de Variáveis", obrigatorio: true },
  { key: "quinzena", label: "Quinzena", obrigatorio: false },
  { key: "sindicato", label: "Sindicato", obrigatorio: false },
  { key: "folhaPagamento", label: "Folha de Pagamento", obrigatorio: true },
  { key: "relatorioIRRF", label: "Relatório de IRRF", obrigatorio: true },
  { key: "emprestimoConsignado", label: "Empréstimo Consignado", obrigatorio: false },
  { key: "relatorioLiquido", label: "Relatório Líquido", obrigatorio: true },
  { key: "guiaFGTS", label: "Guia de FGTS Digital", obrigatorio: true },
] as const;

export type EtapaKey = (typeof etapasChecklist)[number]["key"];

export const statusFolhaOrder = [
  "nao_iniciada",
  "andamento",
  "aguardando",
  "conferencia",
  "concluida",
] as const;

export type StatusFolha = (typeof statusFolhaOrder)[number];

export const statusFolhaMeta: Record<StatusFolha, { label: string; className: string }> = {
  nao_iniciada: { label: "Não iniciada", className: "bg-muted text-muted-foreground border-border" },
  andamento: { label: "Em andamento", className: "bg-info/15 text-info border-info/30" },
  aguardando: { label: "Aguardando informações", className: "bg-warning/15 text-warning border-warning/30" },
  conferencia: { label: "Em conferência", className: "bg-primary/15 text-primary border-primary/30" },
  concluida: { label: "Concluída", className: "bg-success/15 text-success border-success/30" },
};

export const tiposPonto = ["—", "C/D", "Digital", "Manual", "Cartão"];

export type FolhaTarefa = {
  id: string;
  codigo: string;
  empresa: string;
  grupo: string;
  carteira: string;
  tipoEmpresa: "com-movimento" | "sem-movimento" | "domestico-pf";
  competencia: string;
  responsavel: string;
  status: StatusFolha;
  dataConclusao: string;
  dataPublicacao: string;
  observacoes: string;
  tipoPonto: string;
  aprendizes: number;
  empregados: number;
  etapas: Record<EtapaKey, EtapaStatus>;
};

export const competencias = ["07/2026", "08/2026", "09/2026"];

const base = [
  { codigo: "1522", empresa: "B Borges Lima (Pró-labore)", grupo: "Grupo Borges", carteira: "RH - G - 01", tipoEmpresa: "sem-movimento" as const, responsavel: "Camila Rocha", empregados: 1, aprendizes: 0, tipoPonto: "—" },
  { codigo: "788", empresa: "Inez S S Silva (Pró-labore)", grupo: "Grupo Silva", carteira: "RH - G - 01", tipoEmpresa: "sem-movimento" as const, responsavel: "Camila Rocha", empregados: 1, aprendizes: 0, tipoPonto: "C/D" },
  { codigo: "1041", empresa: "Metalúrgica Andrade Ltda", grupo: "Grupo Andrade", carteira: "RH - G - 06", tipoEmpresa: "com-movimento" as const, responsavel: "Camila Rocha", empregados: 312, aprendizes: 8, tipoPonto: "Digital" },
  { codigo: "1190", empresa: "Rede Bom Preço", grupo: "Varejo", carteira: "RH - G - 05", tipoEmpresa: "com-movimento" as const, responsavel: "Diego Menezes", empregados: 178, aprendizes: 5, tipoPonto: "Digital" },
  { codigo: "1233", empresa: "Transportes Vale", grupo: "Logística", carteira: "RH - G - 04", tipoEmpresa: "com-movimento" as const, responsavel: "Tatiane Lopes", empregados: 96, aprendizes: 2, tipoPonto: "C/D" },
  { codigo: "1345", empresa: "Clínica Vida Plena", grupo: "Saúde", carteira: "RH - G - 03", tipoEmpresa: "com-movimento" as const, responsavel: "Rafael Prado", empregados: 44, aprendizes: 1, tipoPonto: "Digital" },
  { codigo: "1408", empresa: "Construtora Horizonte", grupo: "Construção", carteira: "RH - G - 02", tipoEmpresa: "com-movimento" as const, responsavel: "Juliana Reis", empregados: 231, aprendizes: 6, tipoPonto: "Manual" },
  { codigo: "1512", empresa: "Padaria Estrela do Sul", grupo: "Varejo", carteira: "RH - G - 05", tipoEmpresa: "com-movimento" as const, responsavel: "Diego Menezes", empregados: 27, aprendizes: 1, tipoPonto: "Cartão" },
];

function etapasPor(preenchidas: number): Record<EtapaKey, EtapaStatus> {
  const out = {} as Record<EtapaKey, EtapaStatus>;
  etapasChecklist.forEach((e, i) => {
    out[e.key] = i < preenchidas ? "concluido" : i === preenchidas ? "andamento" : "pendente";
  });
  return out;
}

function todasConcluidas(): Record<EtapaKey, EtapaStatus> {
  const out = {} as Record<EtapaKey, EtapaStatus>;
  etapasChecklist.forEach((e) => (out[e.key] = "concluido"));
  return out;
}

export const folhaTarefasSeed: FolhaTarefa[] = competencias.flatMap((competencia, ci) =>
  base.map((b, bi) => {
    const concluida = ci === 0 || (ci === 1 && bi < 2);
    const preenchidas = ci === 0 ? 11 : ci === 1 ? Math.max(0, 11 - ((bi * 2) % 12)) : bi % 3;
    const status: StatusFolha = concluida
      ? "concluida"
      : preenchidas === 0
        ? "nao_iniciada"
        : preenchidas >= 9
          ? "conferencia"
          : preenchidas >= 5
            ? "andamento"
            : "aguardando";
    const dataConclusao = concluida ? `27/${competencia.slice(0, 2)}/2026` : "";
    return {
      id: `${b.codigo}-${competencia}`,
      codigo: b.codigo,
      empresa: b.empresa,
      grupo: b.grupo,
      carteira: b.carteira,
      tipoEmpresa: b.tipoEmpresa,
      competencia,
      responsavel: b.responsavel,
      status,
      dataConclusao,
      dataPublicacao: dataConclusao,
      observacoes: "",
      tipoPonto: b.tipoPonto,
      aprendizes: b.aprendizes,
      empregados: b.empregados,
      etapas: concluida ? todasConcluidas() : etapasPor(preenchidas),
    } satisfies FolhaTarefa;
  }),
);

const STORAGE_KEY = "dp_control_folha_tarefas_v3";

export function getStoredFolhaTarefas(): FolhaTarefa[] {
  if (typeof window === "undefined") return folhaTarefasSeed;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(folhaTarefasSeed));
      return folhaTarefasSeed;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error("Erro ao ler folha tarefas do localStorage:", error);
    return folhaTarefasSeed;
  }
}

export function saveFolhaTarefas(lista: FolhaTarefa[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent("folha-tarefas-updated"));
  } catch (error) {
    console.error("Erro ao salvar folha tarefas no localStorage:", error);
  }
}

export function progressoTarefa(t: FolhaTarefa) {
  const aplicaveis = etapasChecklist.filter((e) => t.etapas[e.key] !== "na");
  const feitas = aplicaveis.filter((e) => t.etapas[e.key] === "concluido").length;
  const total = aplicaveis.length || 1;
  return { feitas, total, pct: Math.round((feitas / total) * 100) };
}

export function obrigatoriasOk(t: FolhaTarefa) {
  return etapasChecklist
    .filter((e) => e.obrigatorio)
    .every((e) => t.etapas[e.key] === "concluido" || t.etapas[e.key] === "na");
}

/** Recalcula o StatusFolha automaticamente com base nas etapas */
export function calcularStatusAutomatico(etapas: Record<EtapaKey, EtapaStatus>): StatusFolha {
  const obrigatorias = etapasChecklist.filter((e) => e.obrigatorio);
  const todas = etapasChecklist;

  const todasConcluidas = todas.every((e) => etapas[e.key] === "concluido" || etapas[e.key] === "na");
  if (todasConcluidas) return "concluida";

  const obrigatoriasFeitas = obrigatorias.every(
    (e) => etapas[e.key] === "concluido" || etapas[e.key] === "na",
  );
  const ultimasEm = obrigatorias.filter((e) => etapas[e.key] === "concluido").length;
  if (obrigatoriasFeitas) return "conferencia";

  const algumaConcluida = todas.some((e) => etapas[e.key] === "concluido");
  const algumaAndamento = todas.some((e) => etapas[e.key] === "andamento");

  if (ultimasEm >= Math.ceil(obrigatorias.length / 2)) return "andamento";
  if (algumaConcluida || algumaAndamento) return "aguardando";

  return "nao_iniciada";
}
