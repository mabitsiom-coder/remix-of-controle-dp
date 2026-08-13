export type StatusObrigacao = "transmitido" | "pendente" | "erro" | "atrasado";
export type Prioridade = "baixa" | "media" | "alta" | "critica";

export type Kpi = {
  label: string;
  value: number | string;
  delta?: string;
  tone?: "info" | "success" | "warning" | "danger";
};

export const kpis: Kpi[] = [];

export const transmissoes: {
  mes: string;
  eSocial: number;
  dctfweb: number;
  fgts: number;
  reinf: number;
}[] = [];

export const errosPorTipo: { tipo: string; qtd: number }[] = [];

export const pendenciasPorEmpresa: { empresa: string; qtd: number }[] = [];

export const distribuicaoTarefas: { name: string; value: number }[] = [];

export const rankingAnalistas: {
  nome: string;
  concluidas: number;
  sla: number;
  erros: number;
}[] = [];

export type Empresa = {
  id: string;
  nome: string;
  cnpj: string;
  regime: string;
  tipo?: "com-movimento" | "sem-movimento" | "domestico-pf";
  codigoDominio?: string;
  grupoId?: string;
  responsavel: string;
  carteira: string;
  analista: string;
  supervisor: string;
  funcionarios: number;
  convenio: string;
  certificadoDigital: string;
  procuracao: string;
  risco: "baixo" | "medio" | "alto";
  status: "ativa" | "atencao" | "atraso";
  /** Exclusão lógica (soft delete): a empresa sai dos controles ativos mas o histórico é preservado. */
  excluida?: boolean;
  excluidaEm?: string;
  excluidaPor?: string;
  carteiraAnterior?: string;
  ultimaRevisao: string;
  diasSemRevisao: number;
  particularidades: {
    fechamento: string;
    envio: string;
    duplaConferencia: boolean;
    fluxoAprovacao: string;
    rubricas: string[];
    eventos: string[];
    observacoes: string;
  };
  historico: { data: string; usuario: string; descricao: string }[];
};

export const empresas: Empresa[] = [];

export type Obrigacao = {
  id: string;
  empresa: string;
  tipo: string;
  competencia: string;
  prazo: string;
  status: StatusObrigacao;
  responsavel: string;
  protocolo?: string;
};

export const obrigacoes: Obrigacao[] = [];

export type EventoSST = {
  id: string;
  empresa: string;
  colaborador: string;
  tipo: string;
  evento: string;
  vencimento: string;
  diasRestantes: number;
  clinica: string;
};

export const eventosSST: EventoSST[] = [];

export const etapasFolha = [
  "Recebimento",
  "Conferência",
  "Processamento",
  "Revisão",
  "Publicação",
  "Entrega",
] as const;

export type Folha = {
  id: string;
  empresa: string;
  competencia: string;
  etapa: (typeof etapasFolha)[number];
  responsavel: string;
  revisor: string;
  supervisor: string;
  progresso: number;
  duplaConferencia: boolean;
};

export const folhas: Folha[] = [];

export type Tarefa = {
  id: string;
  titulo: string;
  empresa: string;
  responsavel: string;
  departamento: string;
  prioridade: Prioridade;
  prazo: string;
  horasPrevistas: number;
  horasGastas: number;
  checklist: { item: string; feito: boolean; obrigatorio: boolean }[];
  status: "backlog" | "fazendo" | "revisao" | "concluida";
  /** Campos compartilhados entre Rotinas, Calendário e Painel de Gantt. */
  descricao?: string;
  carteira?: string;
  dataInicio?: string;
  categoria?: string;
  progresso?: number;
  observacoes?: string;
};

export const tarefas: Tarefa[] = [];

export type Erro = {
  id: string;
  empresa: string;
  competencia: string;
  departamento: string;
  tipo: string;
  descricao: string;
  causaRaiz: string;
  impacto: "baixo" | "medio" | "alto";
  responsavel: string;
  planoAcao: string;
  status: "aberto" | "em_correcao" | "resolvido";
  data: string;
  horasPerdidas: number;
};

export const erros: Erro[] = [];

export const errosPorColaborador: { nome: string; erros: number }[] = [];

export type Evento = {
  id: string;
  titulo: string;
  categoria:
    | "Folha"
    | "Admissões"
    | "Demissões"
    | "Férias"
    | "13º"
    | "SST"
    | "FGTS"
    | "DCTFWeb"
    | "eSocial"
    | "Interno";
  dia: number;
  empresa: string;
  responsavel: string;
};

export const eventos: Evento[] = [];

export type Alerta = {
  id: string;
  titulo: string;
  detalhe: string;
  nivel: "critico" | "alto" | "medio";
};

export const alertas: Alerta[] = [];

export const documentos: {
  id: string;
  nome: string;
  empresa: string;
  categoria: string;
  versao: string;
  data: string;
  autor: string;
}[] = [];

export const treinamentos: {
  id: string;
  titulo: string;
  tipo: string;
  duracao: string;
  concluidoPor: number;
  total: number;
}[] = [];

export const checklistsModelo: {
  id: string;
  nome: string;
  itens: number;
  obrigatorios: number;
  uso: number;
}[] = [];

export const tempoPorProcesso: { processo: string; horas: number }[] = [];

export const slaMensal: { mes: string; sla: number; retrabalho: number }[] = [];

export type TarefaGantt = {
  id: string;
  titulo: string;
  empresa: string;
  responsavel: string;
  categoria: "Folha" | "eSocial" | "SST" | "Obrigações" | "Férias" | "Rescisão" | "Interno";
  inicio: number;
  fim: number;
  progresso: number;
  status: "atrasada" | "andamento" | "planejada" | "concluida";
};

export const tarefasGantt: TarefaGantt[] = [];

export const evolucaoConclusao: { dia: number; planejado: number; concluido: number }[] = [];

export type Reuniao = {
  id: string;
  titulo: string;
  dia: number;
  hora: string;
  participantes: string;
};

export const reunioesIniciais: Reuniao[] = [];
