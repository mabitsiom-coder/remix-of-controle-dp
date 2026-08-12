import { useState, useEffect } from "react";
import { type Empresa } from "./mock-data";

const mockEmpresas: Empresa[] = [];
import { vincularEmpresaAoGrupo } from "./grupos-store";

const STORAGE_KEY = "dp_control_empresas_v1";
const EVENT_NAME = "empresas-updated";

export function getStoredEmpresas(): Empresa[] {
  if (typeof window === "undefined") return mockEmpresas;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockEmpresas));
      return mockEmpresas;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error("Erro ao ler empresas do localStorage:", error);
    return mockEmpresas;
  }
}

export function getEmpresaById(id: string): Empresa | undefined {
  const lista = getStoredEmpresas();
  return lista.find((e) => e.id === id);
}

export function saveEmpresas(lista: Empresa[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (error) {
    console.error("Erro ao salvar empresas no localStorage:", error);
  }
}

export type NovaEmpresaForm = {
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

export class EmpresaDuplicadaError extends Error {
  empresa: Empresa;
  motivo: "cnpj" | "nome";
  constructor(empresa: Empresa, motivo: "cnpj" | "nome") {
    super(
      motivo === "cnpj"
        ? `O CNPJ ${empresa.cnpj} já está cadastrado para "${empresa.nome}".`
        : `Já existe uma empresa cadastrada com o nome "${empresa.nome}".`,
    );
    this.name = "EmpresaDuplicadaError";
    this.empresa = empresa;
    this.motivo = motivo;
  }
}

/** Retorna a empresa já cadastrada que conflita com os dados informados. */
export function encontrarEmpresaDuplicada(
  nome: string,
  cnpj: string,
  ignorarId?: string,
): { empresa: Empresa; motivo: "cnpj" | "nome" } | undefined {
  const digitos = (cnpj || "").replace(/\D/g, "");
  const nomeNorm = normalizarNome(nome || "");
  const lista = getStoredEmpresas().filter((e) => e.id !== ignorarId);

  if (digitos.length >= 11) {
    const porCnpj = lista.find((e) => e.cnpj.replace(/\D/g, "") === digitos);
    if (porCnpj) return { empresa: porCnpj, motivo: "cnpj" };
  }

  if (nomeNorm) {
    const porNome = lista.find((e) => normalizarNome(e.nome) === nomeNorm);
    if (porNome) return { empresa: porNome, motivo: "nome" };
  }

  return undefined;
}

export function createEmpresa(dados: NovaEmpresaForm, criadoPor?: string): Empresa {
  const duplicada = encontrarEmpresaDuplicada(dados.nome, dados.cnpj);
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
      fechamento: dados.fechamento || "Fechamento padrão até dia 20 de cada mês.",
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

  const atuais = getStoredEmpresas();
  const atualizadas = [nova, ...atuais];
  saveEmpresas(atualizadas);

  if (dados.grupoId && dados.grupoId !== "none") {
    vincularEmpresaAoGrupo(dados.grupoId, id);
  }

  return nova;
}

export function updateEmpresa(id: string, dados: NovaEmpresaForm): Empresa | undefined {
  const atuais = getStoredEmpresas();
  const atual = atuais.find((e) => e.id === id);
  if (!atual) return undefined;

  const hoje = new Date();
  const dataFormatada = `${String(hoje.getDate()).padStart(2, "0")}/${String(
    hoje.getMonth() + 1,
  ).padStart(2, "0")}/${hoje.getFullYear()}`;

  const atualizada: Empresa = {
    ...atual,
    nome: dados.nome.trim() || atual.nome,
    cnpj: dados.cnpj || atual.cnpj,
    regime: dados.regime || atual.regime,
    tipo: dados.tipo ?? atual.tipo ?? "com-movimento",
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
      fechamento: dados.fechamento || atual.particularidades.fechamento,
      envio: dados.envio || atual.particularidades.envio,
      duplaConferencia: Boolean(dados.duplaConferencia),
      fluxoAprovacao: dados.fluxoAprovacao || atual.particularidades.fluxoAprovacao,
      observacoes: dados.observacoes ?? atual.particularidades.observacoes,
    },
    historico: [
      {
        data: dataFormatada,
        usuario: dados.analista || "Sistema",
        descricao: "Cadastro da empresa atualizado.",
      },
      ...atual.historico,
    ],
  };

  saveEmpresas(atuais.map((e) => (e.id === id ? atualizada : e)));

  if (dados.grupoId && dados.grupoId !== "none") {
    vincularEmpresaAoGrupo(dados.grupoId, id);
  }

  return atualizada;
}

export function empresaToForm(empresa: Empresa): NovaEmpresaForm {
  return {
    nome: empresa.nome,
    cnpj: empresa.cnpj,
    regime: empresa.regime,
    tipo: empresa.tipo ?? "com-movimento",
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
    fechamento: empresa.particularidades.fechamento,
    envio: empresa.particularidades.envio,
    duplaConferencia: empresa.particularidades.duplaConferencia,
    fluxoAprovacao: empresa.particularidades.fluxoAprovacao,
    observacoes: empresa.particularidades.observacoes,
  };
}

export function useEmpresas() {

  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  useEffect(() => {
    setEmpresas(getStoredEmpresas());

    const handleChange = () => {
      setEmpresas(getStoredEmpresas());
    };

    window.addEventListener(EVENT_NAME, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return {
    empresas,
    createEmpresa,
    refresh: () => setEmpresas(getStoredEmpresas()),
  };
}
