import { useState, useEffect } from "react";
import { type Empresa } from "./mock-data";
import { vincularEmpresaAoGrupo } from "./grupos-store";
import { registrarAuditoria } from "./auditoria-store";
import { filtrarEmpresasPorEscopo, empresaPertenceAoEscopo } from "./permissoes";
import { getCurrentUser, type Usuario } from "./auth-store";

const mockEmpresas: Empresa[] = [];

const STORAGE_KEY = "dp_control_empresas_v1";
const EVENT_NAME = "empresas-updated";

function sanitizarEmpresas(lista: Empresa[]): Empresa[] {
  return lista.map((e) => {
    if (e && e.tipo === "sem-movimento") {
      return {
        ...e,
        particularidades: {
          ...(e.particularidades || {}),
          fechamento: "Sem Movimento",
          envio: e.particularidades?.envio || "Envio por e-mail e portal do cliente.",
          duplaConferencia: Boolean(e.particularidades?.duplaConferencia),
          fluxoAprovacao: e.particularidades?.fluxoAprovacao || "Analista → Supervisor → Cliente",
          rubricas: e.particularidades?.rubricas || ["Salário base", "INSS", "FGTS", "VT"],
          eventos: e.particularidades?.eventos || ["Folha mensal"],
          observacoes: e.particularidades?.observacoes || "",
        },
      };
    }
    return e;
  });
}

/** TODAS as empresas, inclusive as excluídas logicamente. */
export function getTodasEmpresas(): Empresa[] {
  if (typeof window === "undefined") return sanitizarEmpresas(mockEmpresas);
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) {
      const sanitizadas = sanitizarEmpresas(mockEmpresas);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizadas));
      return sanitizadas;
    }
    const lista = JSON.parse(item);
    return Array.isArray(lista) ? sanitizarEmpresas(lista) : sanitizarEmpresas(mockEmpresas);
  } catch (error) {
    console.error("Erro ao ler empresas do localStorage:", error);
    return sanitizarEmpresas(mockEmpresas);
  }
}

/** Empresas ATIVAS (padrão do sistema: exclui as que passaram por exclusão lógica). */
export function getStoredEmpresas(): Empresa[] {
  return getTodasEmpresas().filter((e) => e && !e.excluida);
}

/** Empresas excluídas logicamente — histórico preservado. */
export function getEmpresasExcluidas(): Empresa[] {
  return getTodasEmpresas().filter((e) => e && e.excluida);
}

export function getEmpresaById(id: string, usuario?: Usuario | null): Empresa | undefined {
  const empresa = getTodasEmpresas().find((e) => e.id === id);
  if (!empresa) return undefined;
  const user = usuario !== undefined ? usuario : getCurrentUser();
  if (user && !empresaPertenceAoEscopo(empresa, user)) {
    return undefined;
  }
  return empresa;
}

export function saveEmpresas(lista: Empresa[]) {
  if (typeof window === "undefined") return;
  try {
    const sanitizadas = sanitizarEmpresas(lista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizadas));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (error) {
    console.error("Erro ao salvar empresas no localStorage:", error);
  }
}

function dataHoje() {
  const hoje = new Date();
  return `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(
    2,
    "0",
  )}/${hoje.getFullYear()}`;
}

/** Exclusão lógica: remove dos controles ativos preservando dados e histórico. */
export function excluirEmpresa(id: string, usuario = "Sistema"): Empresa | undefined {
  const todas = getTodasEmpresas();
  const atual = todas.find((e) => e.id === id);
  if (!atual || atual.excluida) return undefined;
  const data = dataHoje();
  const atualizada: Empresa = {
    ...atual,
    excluida: true,
    excluidaEm: data,
    excluidaPor: usuario,
    carteiraAnterior: atual.carteira || "Sem Carteira",
    historico: [
      { data, usuario, descricao: `Empresa excluída dos controles ativos por ${usuario}. Histórico preservado.` },
      ...(atual.historico ?? []),
    ],
  };
  saveEmpresas(todas.map((e) => (e.id === id ? atualizada : e)));

  registrarAuditoria({
    operacao: "Exclusão de Empresa (Soft Delete)",
    empresaAfetada: atual.nome,
    carteiraAfetada: atual.carteira,
    registroId: id,
    informacaoAnterior: `Status: ${atual.status} | Carteira: ${atual.carteira}`,
    novaInformacao: "Excluída (Histórico Preservado)",
    detalhes: `Excluída por ${usuario}. Proteção com soft delete ativada.`,
  });

  return atualizada;
}

/** Restaura uma empresa excluída, mantendo todos os dados e históricos anteriores. */
export function restaurarEmpresa(id: string, usuario = "Sistema"): Empresa | undefined {
  const todas = getTodasEmpresas();
  const atual = todas.find((e) => e.id === id);
  if (!atual || !atual.excluida) return undefined;
  const data = dataHoje();
  const restaurada: Empresa = {
    ...atual,
    excluida: false,
    carteira: atual.carteira || atual.carteiraAnterior || "",
    historico: [
      { data, usuario, descricao: `Empresa restaurada aos controles ativos por ${usuario}.` },
      ...(atual.historico ?? []),
    ],
  };
  delete restaurada.excluidaEm;
  delete restaurada.excluidaPor;
  saveEmpresas(todas.map((e) => (e.id === id ? restaurada : e)));

  registrarAuditoria({
    operacao: "Restauração de Empresa",
    empresaAfetada: atual.nome,
    carteiraAfetada: restaurada.carteira,
    registroId: id,
    informacaoAnterior: "Excluída",
    novaInformacao: `Ativa na carteira: ${restaurada.carteira}`,
    detalhes: `Restaurada por ${usuario}.`,
  });

  return restaurada;
}

export type NovaEmpresaForm = {
  nome: string;
  cnpj: string;
  regime: string;
  tipo?: "com-movimento" | "sem-movimento" | "domestico-pf";
  funcionariosDomesticos?: string[];
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
  fechamento?: string;
  envio?: string;
  duplaConferencia?: boolean;
  fluxoAprovacao?: string;
  observacoes?: string;
};

function normalizarNome(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export type MotivoDuplicidade = "cnpj" | "codigoDominio" | "nome";

export class EmpresaDuplicadaError extends Error {
  empresa: Empresa;
  motivo: MotivoDuplicidade;
  constructor(empresa: Empresa, motivo: MotivoDuplicidade) {
    super(
      motivo === "cnpj"
        ? `O CNPJ ${empresa.cnpj} já está cadastrado para "${empresa.nome}".`
        : motivo === "codigoDominio"
          ? `O Código no Domínio "${empresa.codigoDominio}" já pertence à empresa "${empresa.nome}".`
          : `Já existe uma empresa cadastrada com o nome "${empresa.nome}".`,
    );
    this.name = "EmpresaDuplicadaError";
    this.empresa = empresa;
    this.motivo = motivo;
  }
}

/** Retorna a empresa já cadastrada que conflita com os dados informados por CNPJ, Código no Domínio ou Nome. */
export function encontrarEmpresaDuplicada(
  nome: string,
  cnpj: string,
  codigoDominio?: string | null,
  ignorarId?: string,
): { empresa: Empresa; motivo: MotivoDuplicidade } | undefined {
  const digitos = (cnpj || "").replace(/\D/g, "");
  const codNorm = (codigoDominio || "").trim();
  const nomeNorm = normalizarNome(nome || "");
  const lista = getTodasEmpresas().filter((e) => e.id !== ignorarId);

  // 1. Verificação prioritária por CNPJ
  if (digitos.length >= 11) {
    const porCnpj = lista.find((e) => e.cnpj && e.cnpj.replace(/\D/g, "") === digitos);
    if (porCnpj) return { empresa: porCnpj, motivo: "cnpj" };
  }

  // 2. Verificação estrita por Código no Domínio
  if (codNorm) {
    const porCodigo = lista.find((e) => {
      if (!e.codigoDominio) return false;
      const codEmp = e.codigoDominio.trim();
      if (!codEmp) return false;
      if (codEmp.toLowerCase() === codNorm.toLowerCase()) return true;
      const numEmp = Number(codEmp);
      const numReq = Number(codNorm);
      if (!isNaN(numEmp) && !isNaN(numReq) && numEmp === numReq && numEmp > 0) return true;
      return false;
    });
    if (porCodigo) return { empresa: porCodigo, motivo: "codigoDominio" };
  }

  // 3. Verificação por Razão Social / Nome Fantasia
  if (nomeNorm) {
    const porNome = lista.find((e) => normalizarNome(e.nome) === nomeNorm);
    if (porNome) return { empresa: porNome, motivo: "nome" };
  }

  return undefined;
}

export function createEmpresa(dados: NovaEmpresaForm, criadoPor?: string): Empresa {
  const duplicada = encontrarEmpresaDuplicada(dados.nome, dados.cnpj, dados.codigoDominio);
  if (duplicada) throw new EmpresaDuplicadaError(duplicada.empresa, duplicada.motivo);

  const slug = dados.nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const id = `${slug}-${Date.now().toString(36)}`;
  const hoje = new Date();
  const dataFormatada = `${String(hoje.getDate()).padStart(2, "0")}/${String(
    hoje.getMonth() + 1,
  ).padStart(2, "0")}/${hoje.getFullYear()}`;

  const usuarioCriador = criadoPor || dados.analista || "Sistema";

  const nova: Empresa = {
    id,
    nome: dados.nome,
    cnpj: dados.cnpj,
    regime: dados.regime || "Optante pelo Simples Nacional",
    tipo: dados.tipo || "com-movimento",
    funcionariosDomesticos: dados.tipo === "domestico-pf" ? (dados.funcionariosDomesticos ?? []) : [],
    codigoDominio: dados.codigoDominio || "",
    responsavel: dados.responsavel || "Não informado",
    carteira: dados.carteira || "Carteira Geral",
    analista: dados.analista || "Camila Rocha",
    supervisor: dados.supervisor || "Paulo Serra",
    funcionarios: Number(dados.funcionarios) || 1,
    convenio: dados.convenio || "Geral",
    certificadoDigital: dados.certificadoDigital || "A1 — Ativo",
    procuracao: dados.procuracao || "e-CAC Válida",
    risco: dados.risco || "baixo",
    status: dados.status || "ativa",
    ultimaRevisao: dataFormatada,
    diasSemRevisao: 0,
    particularidades: {
      fechamento: dados.tipo === "sem-movimento" ? "Sem Movimento" : (dados.fechamento || "Fechamento padrão até dia 20 de cada mês."),
      envio: dados.envio || "Envio por e-mail e portal do cliente.",
      duplaConferencia: Boolean(dados.duplaConferencia),
      fluxoAprovacao: dados.fluxoAprovacao || "Analista → Supervisor → Cliente",
      rubricas: ["Salário base", "INSS", "FGTS", "VT"],
      eventos: ["Folha mensal"],
      observacoes: dados.observacoes || "Empresa cadastrada recentemente.",
    },
    historico: [
      {
        data: dataFormatada,
        usuario: usuarioCriador,
        descricao: `Empresa cadastrada por ${usuarioCriador}.`,
      },
    ],
  };

  const atuais = getTodasEmpresas();
  const atualizadas = [nova, ...atuais];
  saveEmpresas(atualizadas);

  if (dados.grupoId && dados.grupoId !== "none") {
    vincularEmpresaAoGrupo(dados.grupoId, id);
  }

  registrarAuditoria({
    operacao: "Cadastro de Empresa",
    empresaAfetada: nova.nome,
    carteiraAfetada: nova.carteira,
    registroId: nova.id,
    novaInformacao: `CNPJ: ${nova.cnpj} | Carteira: ${nova.carteira} | Analista: ${nova.analista}`,
    detalhes: `Cadastrada por ${usuarioCriador}.`,
  });

  return nova;
}

export function updateEmpresa(id: string, dados: NovaEmpresaForm): Empresa | undefined {
  const duplicada = encontrarEmpresaDuplicada(dados.nome, dados.cnpj, dados.codigoDominio, id);
  if (duplicada) throw new EmpresaDuplicadaError(duplicada.empresa, duplicada.motivo);

  const atuais = getTodasEmpresas();
  const atual = atuais.find((e) => e.id === id);
  if (!atual) return undefined;

  const hoje = new Date();
  const dataFormatada = `${String(hoje.getDate()).padStart(2, "0")}/${String(
    hoje.getMonth() + 1,
  ).padStart(2, "0")}/${hoje.getFullYear()}`;

  const tipoFinal = dados.tipo ?? atual.tipo ?? "com-movimento";
  const fechamentoFinal =
    tipoFinal === "sem-movimento"
      ? "Sem Movimento"
      : dados.fechamento && dados.fechamento !== "Sem Movimento" && dados.fechamento !== "Sem movimento"
        ? dados.fechamento
        : atual.particularidades.fechamento === "Sem Movimento" || atual.particularidades.fechamento === "Sem movimento"
          ? "Fechamento padrão até dia 20 de cada mês."
          : atual.particularidades.fechamento || "Fechamento padrão até dia 20 de cada mês.";

  const carteiraMudou = dados.carteira && dados.carteira !== atual.carteira;
  const analistaMudou = dados.analista && dados.analista !== atual.analista;
  const supervisorMudou = dados.supervisor && dados.supervisor !== atual.supervisor;

  const atualizada: Empresa = {
    ...atual,
    nome: dados.nome.trim() || atual.nome,
    cnpj: dados.cnpj || atual.cnpj,
    regime: dados.regime || atual.regime,
    tipo: tipoFinal,
    funcionariosDomesticos: tipoFinal === "domestico-pf" ? (dados.funcionariosDomesticos ?? atual.funcionariosDomesticos ?? []) : [],
    codigoDominio: dados.codigoDominio ?? atual.codigoDominio ?? "",
    responsavel: dados.responsavel || atual.responsavel,
    carteira: dados.carteira || atual.carteira,
    analista: dados.analista || atual.analista,
    supervisor: dados.supervisor || atual.supervisor,
    funcionarios: Number(dados.funcionarios) || atual.funcionarios,
    convenio: dados.convenio || atual.convenio,
    certificadoDigital: dados.certificadoDigital || atual.certificadoDigital,
    procuracao: dados.procuracao || atual.procuracao,
    risco: dados.risco || atual.risco,
    status: dados.status || atual.status,
    ultimaRevisao: dataFormatada,
    diasSemRevisao: 0,
    particularidades: {
      ...atual.particularidades,
      fechamento: fechamentoFinal,
      envio: dados.envio || atual.particularidades.envio,
      duplaConferencia: Boolean(dados.duplaConferencia),
      fluxoAprovacao: dados.fluxoAprovacao || atual.particularidades.fluxoAprovacao,
      observacoes: dados.observacoes ?? atual.particularidades.observacoes,
    },
    historico: [
      {
        data: dataFormatada,
        usuario: dados.analista || "Sistema",
        descricao: carteiraMudou
          ? `Carteira alterada de "${atual.carteira}" para "${dados.carteira}".`
          : "Cadastro da empresa atualizado.",
      },
      ...atual.historico,
    ],
  };

  saveEmpresas(atuais.map((e) => (e.id === id ? atualizada : e)));

  if (dados.grupoId && dados.grupoId !== "none") {
    vincularEmpresaAoGrupo(dados.grupoId, id);
  }

  if (carteiraMudou) {
    registrarAuditoria({
      operacao: "Alteração de Carteira",
      empresaAfetada: atualizada.nome,
      carteiraAfetada: atualizada.carteira,
      registroId: id,
      informacaoAnterior: `Carteira anterior: ${atual.carteira}`,
      novaInformacao: `Nova carteira: ${atualizada.carteira}`,
      detalhes: `Transferência de empresa entre carteiras.`,
    });
  } else if (analistaMudou || supervisorMudou) {
    registrarAuditoria({
      operacao: "Alteração de Responsáveis",
      empresaAfetada: atualizada.nome,
      carteiraAfetada: atualizada.carteira,
      registroId: id,
      informacaoAnterior: `Analista: ${atual.analista} | Supervisor: ${atual.supervisor}`,
      novaInformacao: `Analista: ${atualizada.analista} | Supervisor: ${atualizada.supervisor}`,
      detalhes: `Equipe responsável atualizada.`,
    });
  } else {
    registrarAuditoria({
      operacao: "Alteração de Empresa",
      empresaAfetada: atualizada.nome,
      carteiraAfetada: atualizada.carteira,
      registroId: id,
      detalhes: `Ficha cadastral atualizada.`,
    });
  }

  return atualizada;
}

export function empresaToForm(empresa: Empresa): NovaEmpresaForm {
  const isSemMov = empresa.tipo === "sem-movimento";
  return {
    nome: empresa.nome,
    cnpj: empresa.cnpj,
    regime: empresa.regime,
    tipo: empresa.tipo ?? "com-movimento",
    funcionariosDomesticos: empresa.funcionariosDomesticos ?? [],
    codigoDominio: empresa.codigoDominio ?? "",
    grupoId: "none",
    responsavel: empresa.responsavel,
    carteira: empresa.carteira,
    analista: empresa.analista,
    supervisor: empresa.supervisor,
    funcionarios: empresa.funcionarios,
    convenio: empresa.convenio,
    certificadoDigital: empresa.certificadoDigital,
    procuracao: empresa.procuracao,
    risco: empresa.risco,
    status: empresa.status,
    fechamento: isSemMov ? "Sem Movimento" : (empresa.particularidades.fechamento || "Fechamento padrão até dia 20 de cada mês."),
    envio: empresa.particularidades.envio,
    duplaConferencia: empresa.particularidades.duplaConferencia,
    fluxoAprovacao: empresa.particularidades.fluxoAprovacao,
    observacoes: empresa.particularidades.observacoes,
  };
}

export function useEmpresas(options?: { ignorarEscopo?: boolean }) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [todasEmpresas, setTodasEmpresas] = useState<Empresa[]>([]);
  const [empresasExcluidas, setEmpresasExcluidas] = useState<Empresa[]>([]);

  useEffect(() => {
    const ler = () => {
      const ativas = getStoredEmpresas();
      const excluidas = getEmpresasExcluidas();
      const user = getCurrentUser();
      setTodasEmpresas(ativas);
      setEmpresasExcluidas(excluidas);
      if (options?.ignorarEscopo) {
        setEmpresas(ativas);
      } else {
        setEmpresas(filtrarEmpresasPorEscopo(ativas, user));
      }
    };
    ler();

    const handleChange = () => ler();

    window.addEventListener(EVENT_NAME, handleChange);
    window.addEventListener("auth-state-changed", handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleChange);
      window.removeEventListener("auth-state-changed", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [options?.ignorarEscopo]);

  return {
    empresas,
    todasEmpresas,
    empresasExcluidas,
    createEmpresa,
    updateEmpresa,
    excluirEmpresa,
    restaurarEmpresa,
    refresh: () => {
      const ativas = getStoredEmpresas();
      const excluidas = getEmpresasExcluidas();
      const user = getCurrentUser();
      setTodasEmpresas(ativas);
      setEmpresasExcluidas(excluidas);
      if (options?.ignorarEscopo) {
        setEmpresas(ativas);
      } else {
        setEmpresas(filtrarEmpresasPorEscopo(ativas, user));
      }
    },
  };
}
