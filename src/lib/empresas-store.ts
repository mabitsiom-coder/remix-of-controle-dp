import { useState, useEffect } from "react";
import { empresas as mockEmpresas, type Empresa } from "./mock-data";
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

export function createEmpresa(dados: NovaEmpresaForm): Empresa {
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

  const nova: Empresa = {
    id,
    nome: dados.nome,
    cnpj: dados.cnpj,
    regime: dados.regime || "Simples Nacional",
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
        usuario: dados.analista || "Sistema",
        descricao: "Empresa cadastrada no sistema.",
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
