export type StatusObrigacao = "transmitido" | "pendente" | "erro" | "atrasado";
export type Prioridade = "baixa" | "media" | "alta" | "critica";

export const kpis = [
  { label: "Empresas Ativas", value: 148, delta: "+4", tone: "info" as const },
  { label: "Funcionários", value: 3921, delta: "+87", tone: "info" as const },
  { label: "Folhas Pendentes", value: 23, delta: "-6", tone: "warning" as const },
  { label: "Folhas Concluídas", value: 125, delta: "+18", tone: "success" as const },
  { label: "Obrigações Transmitidas", value: 412, delta: "+33", tone: "success" as const },
  { label: "Obrigações Pendentes", value: 57, delta: "+9", tone: "warning" as const },
  { label: "Eventos SST Pendentes", value: 31, delta: "+2", tone: "warning" as const },
  { label: "Empresas c/ Inconsistência", value: 12, delta: "-3", tone: "danger" as const },
  { label: "Empresas em Atraso", value: 8, delta: "+1", tone: "danger" as const },
  { label: "DCTFWeb Pendentes", value: 19, delta: "-4", tone: "warning" as const },
  { label: "FGTS Digital Pendente", value: 14, delta: "-2", tone: "warning" as const },
  { label: "eSocial Pendente", value: 26, delta: "+5", tone: "warning" as const },
  { label: "Particularidades Desatualizadas", value: 17, delta: "+6", tone: "danger" as const },
  { label: "Chamados em Aberto", value: 42, delta: "-8", tone: "info" as const },
  { label: "Taxa de Erros", value: "2,4%", delta: "-0,6pp", tone: "success" as const },
  { label: "Retrabalho", value: "6,1%", delta: "-1,2pp", tone: "success" as const },
  { label: "SLA", value: "94,3%", delta: "+2,1pp", tone: "success" as const },
  { label: "Tempo Médio de Conclusão", value: "3,7h", delta: "-0,4h", tone: "success" as const },
];

export const transmissoes = [
  { mes: "Jan", eSocial: 320, dctfweb: 210, fgts: 190, reinf: 150 },
  { mes: "Fev", eSocial: 342, dctfweb: 225, fgts: 205, reinf: 162 },
  { mes: "Mar", eSocial: 361, dctfweb: 240, fgts: 214, reinf: 171 },
  { mes: "Abr", eSocial: 355, dctfweb: 233, fgts: 220, reinf: 168 },
  { mes: "Mai", eSocial: 388, dctfweb: 251, fgts: 231, reinf: 180 },
  { mes: "Jun", eSocial: 402, dctfweb: 262, fgts: 244, reinf: 193 },
  { mes: "Jul", eSocial: 418, dctfweb: 271, fgts: 250, reinf: 201 },
];

export const errosPorTipo = [
  { tipo: "Rubrica incorreta", qtd: 34 },
  { tipo: "Admissão fora do prazo", qtd: 22 },
  { tipo: "Afastamento não lançado", qtd: 19 },
  { tipo: "Base FGTS divergente", qtd: 15 },
  { tipo: "ASO vencido", qtd: 12 },
  { tipo: "Rescisão sem verba", qtd: 9 },
];

export const pendenciasPorEmpresa = [
  { empresa: "Metalúrgica Andrade", qtd: 14 },
  { empresa: "Rede Bom Preço", qtd: 11 },
  { empresa: "Transportes Vale", qtd: 9 },
  { empresa: "Clínica Vida Plena", qtd: 7 },
  { empresa: "Construtora Horizonte", qtd: 6 },
];

export const distribuicaoTarefas = [
  { name: "Folha", value: 38 },
  { name: "Obrigações", value: 24 },
  { name: "SST", value: 17 },
  { name: "Admissão/Rescisão", value: 13 },
  { name: "Interno", value: 8 },
];

export const rankingAnalistas = [
  { nome: "Camila Rocha", concluidas: 132, sla: 98, erros: 1 },
  { nome: "Diego Menezes", concluidas: 121, sla: 96, erros: 2 },
  { nome: "Tatiane Lopes", concluidas: 114, sla: 94, erros: 3 },
  { nome: "Rafael Prado", concluidas: 98, sla: 91, erros: 5 },
  { nome: "Juliana Reis", concluidas: 87, sla: 88, erros: 7 },
];

export type Empresa = {
  id: string;
  nome: string;
  cnpj: string;
  regime: string;
  tipo?: "com-movimento" | "sem-movimento" | "domestico-pf";
  codigoDominio?: string;
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

export const empresas: Empresa[] = [
  {
    id: "metalurgica-andrade",
    nome: "Metalúrgica Andrade Ltda",
    cnpj: "12.345.678/0001-90",
    regime: "Lucro Real",
    responsavel: "Carlos Andrade",
    carteira: "Carteira Industrial A",
    analista: "Camila Rocha",
    supervisor: "Paulo Serra",
    funcionarios: 312,
    convenio: "Sindicato Metalúrgicos SP",
    certificadoDigital: "A1 — vence 14/11/2026",
    procuracao: "e-CAC válida até 30/06/2027",
    risco: "alto",
    status: "atraso",
    ultimaRevisao: "12/05/2026",
    diasSemRevisao: 85,
    particularidades: {
      fechamento: "Fechamento no dia 20, com apuração de horas do dia 21 ao 20.",
      envio: "Envio por e-mail ao RH + upload no portal do cliente.",
      duplaConferencia: true,
      fluxoAprovacao: "Analista → Supervisor → Diretoria do cliente",
      rubricas: ["Periculosidade 30%", "Adicional noturno 20%", "Prêmio produção", "Cesta básica"],
      eventos: ["Banco de horas trimestral", "Turno ininterrupto de revezamento"],
      observacoes:
        "Empresa com histórico de autuação trabalhista. Toda rescisão exige homologação sindical.",
    },
    historico: [
      { data: "12/05/2026", usuario: "Camila Rocha", descricao: "Atualizada regra de banco de horas." },
      { data: "03/02/2026", usuario: "Paulo Serra", descricao: "Inclusão de rubrica Prêmio Produção." },
    ],
  },
  {
    id: "rede-bom-preco",
    nome: "Rede Bom Preço Supermercados",
    cnpj: "98.765.432/0001-11",
    regime: "Lucro Presumido",
    responsavel: "Sra. Helena Duarte",
    carteira: "Carteira Varejo",
    analista: "Diego Menezes",
    supervisor: "Paulo Serra",
    funcionarios: 486,
    convenio: "Comerciários",
    certificadoDigital: "A1 — vence 02/03/2027",
    procuracao: "e-CAC válida até 12/12/2026",
    risco: "medio",
    status: "atencao",
    ultimaRevisao: "28/06/2026",
    diasSemRevisao: 38,
    particularidades: {
      fechamento: "Fechamento no dia 25, escalas 6x1 por loja.",
      envio: "Portal do cliente, com planilha resumo por filial.",
      duplaConferencia: true,
      fluxoAprovacao: "Analista → Revisor → RH Corporativo",
      rubricas: ["Quebra de caixa", "Insalubridade 20% (açougue)", "Comissão de vendas"],
      eventos: ["Rateio por centro de custo", "13º parcelado em folha de novembro"],
      observacoes: "12 filiais com CNPJ próprio. Sempre conferir matriz x filiais.",
    },
    historico: [
      { data: "28/06/2026", usuario: "Diego Menezes", descricao: "Nova filial incluída na carteira." },
    ],
  },
  {
    id: "transportes-vale",
    nome: "Transportes Vale S/A",
    cnpj: "45.111.222/0001-33",
    regime: "Lucro Real",
    responsavel: "Roberto Carlos",
    carteira: "Carteira Serviços C",
    analista: "Tatiane Lopes",
    supervisor: "Ana Beatriz",
    funcionarios: 208,
    convenio: "Motoristas Rodoviários",
    certificadoDigital: "A3 — vence 21/09/2026",
    procuracao: "e-CAC válida até 21/09/2026",
    risco: "alto",
    status: "atencao",
    ultimaRevisao: "18/07/2026",
    diasSemRevisao: 18,
    particularidades: {
      fechamento: "Fechamento dia 15 com apuração de diárias e pernoites.",
      envio: "E-mail criptografado à controladoria.",
      duplaConferencia: false,
      fluxoAprovacao: "Analista → Supervisor",
      rubricas: ["Diária de viagem", "Hora de espera (Lei 13.103)", "Periculosidade"],
      eventos: ["Jornada de motorista com tempo de espera", "Controle de jornada por telemetria"],
      observacoes: "Documentação de jornada precisa ser arquivada por 5 anos.",
    },
    historico: [
      { data: "18/07/2026", usuario: "Tatiane Lopes", descricao: "Revisão de rubricas de diárias." },
    ],
  },
  {
    id: "clinica-vida-plena",
    nome: "Clínica Vida Plena",
    cnpj: "77.888.999/0001-55",
    regime: "Simples Nacional",
    responsavel: "Dra. Sofia Camargo",
    carteira: "Carteira Saúde",
    analista: "Rafael Prado",
    supervisor: "Ana Beatriz",
    funcionarios: 64,
    convenio: "Saúde SP",
    certificadoDigital: "A1 — vence 08/01/2027",
    procuracao: "e-CAC válida até 08/01/2027",
    risco: "baixo",
    status: "ativa",
    ultimaRevisao: "30/07/2026",
    diasSemRevisao: 6,
    particularidades: {
      fechamento: "Fechamento dia 28, plantões lançados por escala.",
      envio: "WhatsApp Business + e-mail.",
      duplaConferencia: false,
      fluxoAprovacao: "Analista → Supervisor",
      rubricas: ["Insalubridade 20%", "Plantão extra", "Adicional noturno"],
      eventos: ["Escala 12x36 para enfermagem"],
      observacoes: "Sócios recebem pró-labore com INSS por fora da folha.",
    },
    historico: [
      { data: "30/07/2026", usuario: "Rafael Prado", descricao: "Revisão periódica concluída." },
    ],
  },
  {
    id: "construtora-horizonte",
    nome: "Construtora Horizonte",
    cnpj: "33.222.111/0001-77",
    regime: "Lucro Presumido",
    responsavel: "Luciana Martins",
    carteira: "Carteira Comercial B",
    analista: "Juliana Reis",
    supervisor: "Paulo Serra",
    funcionarios: 173,
    convenio: "Sinduscon",
    certificadoDigital: "A1 — vence 19/10/2026",
    procuracao: "e-CAC válida até 19/10/2026",
    risco: "medio",
    status: "ativa",
    ultimaRevisao: "22/07/2026",
    diasSemRevisao: 14,
    particularidades: {
      fechamento: "Fechamento dia 20 por obra/centro de custo.",
      envio: "Portal do cliente.",
      duplaConferencia: true,
      fluxoAprovacao: "Analista → Revisor → Supervisor",
      rubricas: ["Insalubridade 40%", "Periculosidade", "Ajuda de custo obra"],
      eventos: ["Contrato de experiência 45+45", "CNO por obra"],
      observacoes: "Cada obra tem matrícula CNO própria — atenção no eSocial.",
    },
    historico: [
      { data: "22/07/2026", usuario: "Juliana Reis", descricao: "Nova obra cadastrada (CNO)." },
    ],
  },
];

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

export const obrigacoes: Obrigacao[] = [
  { id: "o1", empresa: "Metalúrgica Andrade", tipo: "eSocial", competencia: "07/2026", prazo: "15/08/2026", status: "erro", responsavel: "Camila Rocha" },
  { id: "o2", empresa: "Metalúrgica Andrade", tipo: "DCTFWeb", competencia: "07/2026", prazo: "15/08/2026", status: "pendente", responsavel: "Camila Rocha" },
  { id: "o3", empresa: "Rede Bom Preço", tipo: "FGTS Digital", competencia: "07/2026", prazo: "07/08/2026", status: "transmitido", responsavel: "Diego Menezes", protocolo: "FGTS-2026-887421" },
  { id: "o4", empresa: "Transportes Vale", tipo: "EFD-Reinf", competencia: "07/2026", prazo: "15/08/2026", status: "pendente", responsavel: "Tatiane Lopes" },
  { id: "o5", empresa: "Clínica Vida Plena", tipo: "eSocial", competencia: "07/2026", prazo: "15/08/2026", status: "transmitido", responsavel: "Rafael Prado", protocolo: "ESOC-1.9-552310" },
  { id: "o6", empresa: "Construtora Horizonte", tipo: "MIT", competencia: "07/2026", prazo: "20/08/2026", status: "pendente", responsavel: "Juliana Reis" },
  { id: "o7", empresa: "Transportes Vale", tipo: "DCTFWeb", competencia: "06/2026", prazo: "15/07/2026", status: "atrasado", responsavel: "Tatiane Lopes" },
  { id: "o8", empresa: "Rede Bom Preço", tipo: "eSocial", competencia: "07/2026", prazo: "15/08/2026", status: "transmitido", responsavel: "Diego Menezes", protocolo: "ESOC-1.9-552417" },
  { id: "o9", empresa: "Construtora Horizonte", tipo: "FGTS Digital", competencia: "07/2026", prazo: "07/08/2026", status: "erro", responsavel: "Juliana Reis" },
  { id: "o10", empresa: "Clínica Vida Plena", tipo: "SST (S-2220)", competencia: "07/2026", prazo: "15/08/2026", status: "pendente", responsavel: "Rafael Prado" },
];

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

export const eventosSST: EventoSST[] = [
  { id: "s1", empresa: "Metalúrgica Andrade", colaborador: "João Ferreira", tipo: "ASO Periódico", evento: "S-2220", vencimento: "10/08/2026", diasRestantes: 5, clinica: "Clínica Ocupacional Sul" },
  { id: "s2", empresa: "Construtora Horizonte", colaborador: "Marcos Lima", tipo: "ASO Admissional", evento: "S-2220", vencimento: "07/08/2026", diasRestantes: 2, clinica: "Med Trabalho Norte" },
  { id: "s3", empresa: "Transportes Vale", colaborador: "Ricardo Souza", tipo: "Mudança de Função", evento: "S-2240", vencimento: "18/08/2026", diasRestantes: 13, clinica: "Med Trabalho Norte" },
  { id: "s4", empresa: "Rede Bom Preço", colaborador: "Aline Castro", tipo: "Retorno ao Trabalho", evento: "S-2220", vencimento: "03/08/2026", diasRestantes: -2, clinica: "Clínica Ocupacional Sul" },
  { id: "s5", empresa: "Clínica Vida Plena", colaborador: "—", tipo: "PCMSO", evento: "Documento", vencimento: "30/09/2026", diasRestantes: 56, clinica: "SESMT Interno" },
  { id: "s6", empresa: "Metalúrgica Andrade", colaborador: "—", tipo: "PGR", evento: "Documento", vencimento: "12/08/2026", diasRestantes: 7, clinica: "Eng. Segurança Prime" },
  { id: "s7", empresa: "Transportes Vale", colaborador: "—", tipo: "LTCAT", evento: "Documento", vencimento: "22/08/2026", diasRestantes: 17, clinica: "Eng. Segurança Prime" },
  { id: "s8", empresa: "Construtora Horizonte", colaborador: "Paulo Nunes", tipo: "ASO Demissional", evento: "S-2299", vencimento: "06/08/2026", diasRestantes: 1, clinica: "Med Trabalho Norte" },
];

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

export const folhas: Folha[] = [
  { id: "f1", empresa: "Metalúrgica Andrade", competencia: "07/2026", etapa: "Conferência", responsavel: "Camila Rocha", revisor: "Paulo Serra", supervisor: "Paulo Serra", progresso: 35, duplaConferencia: true },
  { id: "f2", empresa: "Rede Bom Preço", competencia: "07/2026", etapa: "Revisão", responsavel: "Diego Menezes", revisor: "Ana Beatriz", supervisor: "Paulo Serra", progresso: 70, duplaConferencia: true },
  { id: "f3", empresa: "Transportes Vale", competencia: "07/2026", etapa: "Processamento", responsavel: "Tatiane Lopes", revisor: "—", supervisor: "Ana Beatriz", progresso: 55, duplaConferencia: false },
  { id: "f4", empresa: "Clínica Vida Plena", competencia: "07/2026", etapa: "Entrega", responsavel: "Rafael Prado", revisor: "Ana Beatriz", supervisor: "Ana Beatriz", progresso: 100, duplaConferencia: false },
  { id: "f5", empresa: "Construtora Horizonte", competencia: "07/2026", etapa: "Recebimento", responsavel: "Juliana Reis", revisor: "—", supervisor: "Paulo Serra", progresso: 10, duplaConferencia: true },
  { id: "f6", empresa: "Rede Bom Preço", competencia: "06/2026", etapa: "Publicação", responsavel: "Diego Menezes", revisor: "Ana Beatriz", supervisor: "Paulo Serra", progresso: 90, duplaConferencia: true },
];

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
};

export const tarefas: Tarefa[] = [
  {
    id: "t1", titulo: "Fechamento da folha 07/2026", empresa: "Metalúrgica Andrade", responsavel: "Camila Rocha",
    departamento: "Folha", prioridade: "critica", prazo: "08/08/2026", horasPrevistas: 6, horasGastas: 3.5, status: "fazendo",
    checklist: [
      { item: "Receber apontamento de horas", feito: true, obrigatorio: true },
      { item: "Conferir afastamentos", feito: true, obrigatorio: true },
      { item: "Validar rubricas de periculosidade", feito: false, obrigatorio: true },
      { item: "Dupla conferência do supervisor", feito: false, obrigatorio: true },
    ],
  },
  {
    id: "t2", titulo: "Transmitir DCTFWeb 07/2026", empresa: "Rede Bom Preço", responsavel: "Diego Menezes",
    departamento: "Obrigações", prioridade: "alta", prazo: "15/08/2026", horasPrevistas: 2, horasGastas: 0, status: "backlog",
    checklist: [
      { item: "Fechar eSocial", feito: false, obrigatorio: true },
      { item: "Conferir EFD-Reinf", feito: false, obrigatorio: true },
      { item: "Gerar DARF", feito: false, obrigatorio: true },
    ],
  },
  {
    id: "t3", titulo: "Agendar ASO periódico (12 colaboradores)", empresa: "Transportes Vale", responsavel: "Tatiane Lopes",
    departamento: "SST", prioridade: "media", prazo: "12/08/2026", horasPrevistas: 3, horasGastas: 1, status: "fazendo",
    checklist: [
      { item: "Listar vencimentos", feito: true, obrigatorio: true },
      { item: "Agendar clínica", feito: false, obrigatorio: true },
      { item: "Enviar convocação", feito: false, obrigatorio: false },
    ],
  },
  {
    id: "t4", titulo: "Rescisão — Paulo Nunes", empresa: "Construtora Horizonte", responsavel: "Juliana Reis",
    departamento: "Rescisão", prioridade: "alta", prazo: "06/08/2026", horasPrevistas: 2.5, horasGastas: 2, status: "revisao",
    checklist: [
      { item: "Calcular verbas rescisórias", feito: true, obrigatorio: true },
      { item: "ASO demissional", feito: true, obrigatorio: true },
      { item: "Enviar S-2299", feito: false, obrigatorio: true },
    ],
  },
  {
    id: "t5", titulo: "Revisar particularidades do cliente", empresa: "Metalúrgica Andrade", responsavel: "Paulo Serra",
    departamento: "Cadastro", prioridade: "critica", prazo: "09/08/2026", horasPrevistas: 1.5, horasGastas: 0, status: "backlog",
    checklist: [{ item: "Validar rubricas ativas", feito: false, obrigatorio: true }],
  },
  {
    id: "t6", titulo: "Folha 07/2026 entregue", empresa: "Clínica Vida Plena", responsavel: "Rafael Prado",
    departamento: "Folha", prioridade: "media", prazo: "05/08/2026", horasPrevistas: 4, horasGastas: 3.8, status: "concluida",
    checklist: [
      { item: "Processar folha", feito: true, obrigatorio: true },
      { item: "Publicar recibos", feito: true, obrigatorio: true },
    ],
  },
];

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

export const erros: Erro[] = [
  { id: "e1", empresa: "Metalúrgica Andrade", competencia: "06/2026", departamento: "Folha", tipo: "Rubrica incorreta", descricao: "Periculosidade aplicada sobre salário + adicionais.", causaRaiz: "Parametrização antiga não revisada.", impacto: "alto", responsavel: "Camila Rocha", planoAcao: "Corrigir parâmetro e refazer cálculo; incluir item no checklist.", status: "em_correcao", data: "18/07/2026", horasPerdidas: 6 },
  { id: "e2", empresa: "Rede Bom Preço", competencia: "06/2026", departamento: "Obrigações", tipo: "Admissão fora do prazo", descricao: "S-2200 enviado após início das atividades.", causaRaiz: "Cliente informou admissão com atraso.", impacto: "alto", responsavel: "Diego Menezes", planoAcao: "Criar alerta D-1 e treinar RH do cliente.", status: "aberto", data: "24/07/2026", horasPerdidas: 3 },
  { id: "e3", empresa: "Transportes Vale", competencia: "05/2026", departamento: "SST", tipo: "ASO vencido", descricao: "Colaborador em atividade com ASO vencido há 40 dias.", causaRaiz: "Painel de vencimentos sem revisão semanal.", impacto: "medio", responsavel: "Tatiane Lopes", planoAcao: "Rotina semanal de conferência do painel SST.", status: "resolvido", data: "02/06/2026", horasPerdidas: 2 },
  { id: "e4", empresa: "Construtora Horizonte", competencia: "06/2026", departamento: "Folha", tipo: "Base FGTS divergente", descricao: "Divergência entre FGTS Digital e folha.", causaRaiz: "Rubrica de ajuda de custo com incidência errada.", impacto: "medio", responsavel: "Juliana Reis", planoAcao: "Revisar incidências e conferir guia antes do envio.", status: "em_correcao", data: "29/07/2026", horasPerdidas: 4 },
];

export const errosPorColaborador = [
  { nome: "Juliana Reis", erros: 7 },
  { nome: "Rafael Prado", erros: 5 },
  { nome: "Tatiane Lopes", erros: 3 },
  { nome: "Diego Menezes", erros: 2 },
  { nome: "Camila Rocha", erros: 1 },
];

export type Evento = {
  id: string;
  titulo: string;
  categoria: "Folha" | "Admissões" | "Demissões" | "Férias" | "13º" | "SST" | "FGTS" | "DCTFWeb" | "eSocial" | "Interno";
  dia: number;
  empresa: string;
  responsavel: string;
};

export const eventos: Evento[] = [
  { id: "c1", titulo: "Fechamento folha", categoria: "Folha", dia: 5, empresa: "Clínica Vida Plena", responsavel: "Rafael Prado" },
  { id: "c2", titulo: "FGTS Digital", categoria: "FGTS", dia: 7, empresa: "Todas", responsavel: "Equipe DP" },
  { id: "c3", titulo: "Admissão — 4 colaboradores", categoria: "Admissões", dia: 10, empresa: "Rede Bom Preço", responsavel: "Diego Menezes" },
  { id: "c4", titulo: "ASO periódico", categoria: "SST", dia: 12, empresa: "Transportes Vale", responsavel: "Tatiane Lopes" },
  { id: "c5", titulo: "DCTFWeb", categoria: "DCTFWeb", dia: 15, empresa: "Todas", responsavel: "Equipe Fiscal" },
  { id: "c6", titulo: "eSocial periódicos", categoria: "eSocial", dia: 15, empresa: "Todas", responsavel: "Equipe DP" },
  { id: "c7", titulo: "Férias coletivas", categoria: "Férias", dia: 18, empresa: "Metalúrgica Andrade", responsavel: "Camila Rocha" },
  { id: "c8", titulo: "Rescisão", categoria: "Demissões", dia: 20, empresa: "Construtora Horizonte", responsavel: "Juliana Reis" },
  { id: "c9", titulo: "Treinamento eSocial S-1200", categoria: "Interno", dia: 22, empresa: "Interno", responsavel: "Paulo Serra" },
  { id: "c10", titulo: "Provisão 13º", categoria: "13º", dia: 26, empresa: "Todas", responsavel: "Equipe DP" },
  { id: "c11", titulo: "Fechamento folha", categoria: "Folha", dia: 20, empresa: "Metalúrgica Andrade", responsavel: "Camila Rocha" },
  { id: "c12", titulo: "Reunião de carteira", categoria: "Interno", dia: 28, empresa: "Interno", responsavel: "Ana Beatriz" },
];

export const alertas = [
  { id: "a1", titulo: "ASO vencido há 2 dias", detalhe: "Aline Castro — Rede Bom Preço", nivel: "critico" as const },
  { id: "a2", titulo: "Certificado digital vence em 45 dias", detalhe: "Transportes Vale S/A (A3)", nivel: "alto" as const },
  { id: "a3", titulo: "Particularidades sem revisão há 85 dias", detalhe: "Metalúrgica Andrade Ltda", nivel: "critico" as const },
  { id: "a4", titulo: "DCTFWeb 06/2026 em atraso", detalhe: "Transportes Vale S/A", nivel: "critico" as const },
  { id: "a5", titulo: "Checklist de folha incompleto", detalhe: "Metalúrgica Andrade — 07/2026", nivel: "alto" as const },
  { id: "a6", titulo: "Empresa sem movimentação há 60 dias", detalhe: "Comércio Delta ME", nivel: "medio" as const },
  { id: "a7", titulo: "Procuração e-CAC vence em 47 dias", detalhe: "Transportes Vale S/A", nivel: "medio" as const },
];

export const documentos = [
  { id: "d1", nome: "Folha_072026.pdf", empresa: "Metalúrgica Andrade", categoria: "Folha", versao: "v3", data: "05/08/2026", autor: "Camila Rocha" },
  { id: "d2", nome: "ASO_JoaoFerreira.pdf", empresa: "Metalúrgica Andrade", categoria: "ASOs", versao: "v1", data: "02/08/2026", autor: "Tatiane Lopes" },
  { id: "d3", nome: "DARF_DCTFWeb_072026.pdf", empresa: "Rede Bom Preço", categoria: "DCTFWeb", versao: "v1", data: "04/08/2026", autor: "Diego Menezes" },
  { id: "d4", nome: "Guia_FGTS_072026.pdf", empresa: "Rede Bom Preço", categoria: "FGTS", versao: "v2", data: "04/08/2026", autor: "Diego Menezes" },
  { id: "d5", nome: "LTCAT_2026.pdf", empresa: "Transportes Vale", categoria: "Laudos", versao: "v1", data: "20/07/2026", autor: "Tatiane Lopes" },
  { id: "d6", nome: "Procuracao_eCAC.pdf", empresa: "Construtora Horizonte", categoria: "Procurações", versao: "v1", data: "19/06/2026", autor: "Juliana Reis" },
  { id: "d7", nome: "Contrato_Experiencia_MarcosLima.pdf", empresa: "Construtora Horizonte", categoria: "Contratos", versao: "v1", data: "01/08/2026", autor: "Juliana Reis" },
  { id: "d8", nome: "Certificado_A1.pfx", empresa: "Clínica Vida Plena", categoria: "Certificados", versao: "v1", data: "08/01/2026", autor: "Rafael Prado" },
];

export const treinamentos = [
  { id: "tr1", titulo: "eSocial — Eventos periódicos S-1200", tipo: "Vídeo", duracao: "42 min", concluidoPor: 8, total: 12 },
  { id: "tr2", titulo: "POP — Fechamento de folha", tipo: "POP", duracao: "18 páginas", concluidoPor: 12, total: 12 },
  { id: "tr3", titulo: "SST — S-2220 na prática", tipo: "Vídeo", duracao: "35 min", concluidoPor: 6, total: 12 },
  { id: "tr4", titulo: "Fluxograma — Admissão completa", tipo: "Fluxograma", duracao: "—", concluidoPor: 10, total: 12 },
  { id: "tr5", titulo: "DCTFWeb e MIT — o que mudou", tipo: "PDF", duracao: "24 páginas", concluidoPor: 4, total: 12 },
  { id: "tr6", titulo: "Rescisão sem erros — checklist", tipo: "Procedimento", duracao: "12 páginas", concluidoPor: 11, total: 12 },
];

export const checklistsModelo = [
  { id: "cl1", nome: "Folha mensal", itens: 14, obrigatorios: 11, uso: 148 },
  { id: "cl2", nome: "Admissão", itens: 12, obrigatorios: 10, uso: 96 },
  { id: "cl3", nome: "Rescisão", itens: 13, obrigatorios: 12, uso: 74 },
  { id: "cl4", nome: "Férias", itens: 9, obrigatorios: 7, uso: 121 },
  { id: "cl5", nome: "13º salário", itens: 8, obrigatorios: 7, uso: 42 },
  { id: "cl6", nome: "SST", itens: 10, obrigatorios: 8, uso: 63 },
  { id: "cl7", nome: "FGTS Digital", itens: 6, obrigatorios: 6, uso: 148 },
  { id: "cl8", nome: "DCTFWeb", itens: 7, obrigatorios: 6, uso: 148 },
  { id: "cl9", nome: "Cliente novo", itens: 22, obrigatorios: 18, uso: 11 },
  { id: "cl10", nome: "Particularidades", itens: 16, obrigatorios: 12, uso: 148 },
];

export const tempoPorProcesso = [
  { processo: "Folha", horas: 4.2 },
  { processo: "Admissão", horas: 1.4 },
  { processo: "Rescisão", horas: 2.1 },
  { processo: "Férias", horas: 0.9 },
  { processo: "SST", horas: 1.1 },
  { processo: "Obrigações", horas: 1.8 },
];

export const slaMensal = [
  { mes: "Fev", sla: 88, retrabalho: 11 },
  { mes: "Mar", sla: 90, retrabalho: 9.5 },
  { mes: "Abr", sla: 91, retrabalho: 8.8 },
  { mes: "Mai", sla: 92, retrabalho: 7.9 },
  { mes: "Jun", sla: 93, retrabalho: 7.2 },
  { mes: "Jul", sla: 94.3, retrabalho: 6.1 },
];

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

export const tarefasGantt: TarefaGantt[] = [
  { id: "g1", titulo: "Publicação do controle de contrato de experiência", empresa: "Todas", responsavel: "Ana Beatriz", categoria: "Interno", inicio: 1, fim: 6, progresso: 100, status: "concluida" },
  { id: "g2", titulo: "Fechamento das folhas de pagamento do dia 30", empresa: "Metalúrgica Andrade", responsavel: "Camila Rocha", categoria: "Folha", inicio: 1, fim: 4, progresso: 80, status: "atrasada" },
  { id: "g3", titulo: "Envio da solicitação PADRÃO da publicação da folha", empresa: "Todas", responsavel: "Rafael Prado", categoria: "Folha", inicio: 4, fim: 5, progresso: 60, status: "atrasada" },
  { id: "g4", titulo: "Envio do evento S-1200 Remuneração", empresa: "Todas", responsavel: "Diego Menezes", categoria: "eSocial", inicio: 5, fim: 6, progresso: 45, status: "atrasada" },
  { id: "g5", titulo: "Envio do evento S-1210 Pagamento", empresa: "Todas", responsavel: "Diego Menezes", categoria: "eSocial", inicio: 6, fim: 7, progresso: 30, status: "andamento" },
  { id: "g6", titulo: "Envio do evento S-1299 Fechamento", empresa: "Todas", responsavel: "Diego Menezes", categoria: "eSocial", inicio: 8, fim: 9, progresso: 20, status: "andamento" },
  { id: "g7", titulo: "Publicação do controle de férias", empresa: "Rede Bom Preço", responsavel: "Juliana Reis", categoria: "Férias", inicio: 8, fim: 9, progresso: 25, status: "andamento" },
  { id: "g8", titulo: "Controle de aniversariantes do mês seguinte", empresa: "Todas", responsavel: "Ana Beatriz", categoria: "Interno", inicio: 8, fim: 9, progresso: 10, status: "andamento" },
  { id: "g9", titulo: "Calcular provisão de Férias e 13º — rotina automática", empresa: "Todas", responsavel: "Equipe DP", categoria: "Folha", inicio: 8, fim: 31, progresso: 15, status: "andamento" },
  { id: "g10", titulo: "SST — Verificar programas vencendo e atualizar planilha", empresa: "Transportes Vale", responsavel: "Tatiane Lopes", categoria: "SST", inicio: 9, fim: 10, progresso: 0, status: "planejada" },
  { id: "g11", titulo: "SST — Envio do controle de exames médicos", empresa: "Clientes contratantes", responsavel: "Tatiane Lopes", categoria: "SST", inicio: 9, fim: 10, progresso: 0, status: "planejada" },
  { id: "g12", titulo: "SST — Cadastro dos ambientes de trabalho", empresa: "Construtora Horizonte", responsavel: "Tatiane Lopes", categoria: "SST", inicio: 9, fim: 11, progresso: 0, status: "planejada" },
  { id: "g13", titulo: "Adiantamento salarial — rotina em lote", empresa: "Todas", responsavel: "Rafael Prado", categoria: "Folha", inicio: 10, fim: 12, progresso: 0, status: "planejada" },
  { id: "g14", titulo: "Consultar arquivo do empréstimo consignado", empresa: "Todas", responsavel: "Rafael Prado", categoria: "Interno", inicio: 10, fim: 12, progresso: 0, status: "planejada" },
  { id: "g15", titulo: "DCTFWeb 07/2026", empresa: "Todas", responsavel: "Equipe Fiscal", categoria: "Obrigações", inicio: 12, fim: 15, progresso: 0, status: "planejada" },
  { id: "g16", titulo: "FGTS Digital — geração e conferência de guias", empresa: "Todas", responsavel: "Equipe DP", categoria: "Obrigações", inicio: 13, fim: 17, progresso: 0, status: "planejada" },
  { id: "g17", titulo: "Rescisão — Paulo Nunes", empresa: "Construtora Horizonte", responsavel: "Juliana Reis", categoria: "Rescisão", inicio: 18, fim: 20, progresso: 0, status: "planejada" },
  { id: "g18", titulo: "Férias coletivas — programação", empresa: "Metalúrgica Andrade", responsavel: "Camila Rocha", categoria: "Férias", inicio: 18, fim: 24, progresso: 0, status: "planejada" },
  { id: "g19", titulo: "Revisão de particularidades da carteira", empresa: "Todas", responsavel: "Paulo Serra", categoria: "Interno", inicio: 22, fim: 28, progresso: 0, status: "planejada" },
  { id: "g20", titulo: "Provisão de 13º salário", empresa: "Todas", responsavel: "Equipe DP", categoria: "Folha", inicio: 24, fim: 31, progresso: 0, status: "planejada" },
];

export const evolucaoConclusao = [
  { dia: 1, planejado: 3, concluido: 3 },
  { dia: 4, planejado: 7, concluido: 6 },
  { dia: 6, planejado: 12, concluido: 9 },
  { dia: 8, planejado: 20, concluido: 15 },
  { dia: 11, planejado: 28, concluido: 22 },
  { dia: 14, planejado: 38, concluido: 31 },
  { dia: 17, planejado: 48, concluido: 40 },
  { dia: 20, planejado: 58, concluido: 49 },
  { dia: 24, planejado: 70, concluido: 60 },
  { dia: 28, planejado: 82, concluido: 71 },
  { dia: 31, planejado: 90, concluido: 79 },
];

export type Reuniao = {
  id: string;
  titulo: string;
  dia: number;
  hora: string;
  participantes: string;
};

export const reunioesIniciais: Reuniao[] = [
  { id: "r1", titulo: "Alinhamento de fechamento da folha", dia: 5, hora: "09:00", participantes: "Camila, Paulo" },
  { id: "r2", titulo: "Reunião de carteira", dia: 14, hora: "14:30", participantes: "Ana Beatriz, equipe DP" },
  { id: "r3", titulo: "Revisão de SST com clínica", dia: 21, hora: "10:00", participantes: "Tatiane, Dr. Lima" },
];
