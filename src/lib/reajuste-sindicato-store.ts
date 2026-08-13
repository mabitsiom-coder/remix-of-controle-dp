import { useState, useEffect } from "react";

export type RegReajusteSindicato = {
  id: string;
  codigo: string;
  empresa: string;
  ramoAtividade: string;
  sindicato: string;
  numSolicitacao: string;
  autorizacao: "SIM" | "NÃO" | "—";
  reajusteSalarial: "SIM" | "NÃO" | "—";
  contribuicaoAssistencial: "SIM" | "NÃO" | "—";
  observacao: string;
  carteira?: string;
  analista?: string;
  supervisor?: string;
};

const STORAGE_KEY = "dp_control_reajuste_sindicato_v1";
const EVENT_NAME = "reajuste-sindicato-updated";

export const reajusteSindicatoSeed: RegReajusteSindicato[] = [
  {
    id: "reaj-1",
    codigo: "371",
    empresa: "A REGO VIEGAS",
    ramoAtividade: "MATERIAIS DE CONSTRUÇÃO",
    sindicato: "SINDMAT",
    numSolicitacao: "—",
    autorizacao: "NÃO",
    reajusteSalarial: "NÃO",
    contribuicaoAssistencial: "NÃO",
    observacao: "SEM FUNCIONÁRIOS",
    carteira: "RH - G - 01",
    analista: "ARIANNY",
    supervisor: "ADRIELLE",
  },
  {
    id: "reaj-2",
    codigo: "982",
    empresa: "ACADEMIA BEST GYM",
    ramoAtividade: "ACADEMIA",
    sindicato: "COMÉRCIO EM GERAL",
    numSolicitacao: "VIA GESTA",
    autorizacao: "NÃO",
    reajusteSalarial: "NÃO",
    contribuicaoAssistencial: "NÃO",
    observacao: "CLIENTE NÃO DEU RETORNO",
    carteira: "RH - G - 01",
    analista: "ARIANNY",
    supervisor: "ADRIELLE",
  },
  {
    id: "reaj-3",
    codigo: "451",
    empresa: "AMAPUERA CASA",
    ramoAtividade: "MATERIAIS DE CONSTRUÇÃO",
    sindicato: "SINDMAT",
    numSolicitacao: "VIA GESTA",
    autorizacao: "SIM",
    reajusteSalarial: "SIM",
    contribuicaoAssistencial: "—",
    observacao: "",
    carteira: "RH - G - 01",
    analista: "ARIANNY",
    supervisor: "ADRIELLE",
  },
  {
    id: "reaj-4",
    codigo: "855",
    empresa: "ANDRADE COMERCIO",
    ramoAtividade: "MATERIAIS DE CONSTRUÇÃO",
    sindicato: "SINDMAT",
    numSolicitacao: "VIA VESTA",
    autorizacao: "SIM",
    reajusteSalarial: "SIM",
    contribuicaoAssistencial: "SIM",
    observacao: "",
    carteira: "RH - G - 01",
    analista: "ARIANNY",
    supervisor: "ADRIELLE",
  },
  {
    id: "reaj-5",
    codigo: "856",
    empresa: "ANDRADE & LIMA",
    ramoAtividade: "MATERIAIS DE CONSTRUÇÃO",
    sindicato: "SINDMAT",
    numSolicitacao: "VIA LGESTA",
    autorizacao: "SIM",
    reajusteSalarial: "SIM",
    contribuicaoAssistencial: "SIM",
    observacao: "",
    carteira: "RH - G - 01",
    analista: "ARIANNY",
    supervisor: "ADRIELLE",
  },
  {
    id: "reaj-6",
    codigo: "1094",
    empresa: "CENTERCLIN SAUDE",
    ramoAtividade: "ATIVIDADE ODONTOLÓGICA",
    sindicato: "COMÉRCIO EM GERAL",
    numSolicitacao: "VIA GESTA",
    autorizacao: "SIM",
    reajusteSalarial: "SIM",
    contribuicaoAssistencial: "NÃO",
    observacao: "",
    carteira: "RH - G - 01",
    analista: "ARIANNY",
    supervisor: "ADRIELLE",
  },
  {
    id: "reaj-7",
    codigo: "373",
    empresa: "C A PINHEIRO",
    ramoAtividade: "COMERCIO VAREJISTA DE PEÇAS E ACESSORIOS NOVOS PARA VEICULOS AUTOMOTORES",
    sindicato: "SINDLOJA",
    numSolicitacao: "—",
    autorizacao: "—",
    reajusteSalarial: "—",
    contribuicaoAssistencial: "—",
    observacao: "",
    carteira: "RH - G - 01",
    analista: "ARIANNY",
    supervisor: "ADRIELLE",
  },
  {
    id: "reaj-8",
    codigo: "788",
    empresa: "INEZ S. S. SILVA",
    ramoAtividade: "COMERCIO VAREJISTA DE ARTIGOS DO VESTUÁRIO E ACESSÓRIOS",
    sindicato: "COMERCIO GERAL",
    numSolicitacao: "—",
    autorizacao: "NÃO",
    reajusteSalarial: "NÃO",
    contribuicaoAssistencial: "NÃO",
    observacao: "",
    carteira: "RH - G - 02",
    analista: "Juliana Reis",
    supervisor: "Paulo Serra",
  },
  {
    id: "reaj-9",
    codigo: "860",
    empresa: "JC DANTAS",
    ramoAtividade: "ATIVIDADE ODONTOLÓGICA",
    sindicato: "COMERCIO GERAL",
    numSolicitacao: "VIA GESTA",
    autorizacao: "NÃO",
    reajusteSalarial: "NÃO",
    contribuicaoAssistencial: "NÃO",
    observacao: "",
    carteira: "RH - G - 02",
    analista: "Juliana Reis",
    supervisor: "Paulo Serra",
  },
  {
    id: "reaj-10",
    codigo: "40",
    empresa: "D M A MACIEL",
    ramoAtividade: "COMERCIO ATACADISTA DE INSTRUMENTOS E MATERIAIS PARA USO MEDICO, CIRURGICO, HOSPITALAR",
    sindicato: "SINDFARMA",
    numSolicitacao: "—",
    autorizacao: "NÃO",
    reajusteSalarial: "NÃO",
    contribuicaoAssistencial: "SIM",
    observacao: "",
    carteira: "RH - G - 03",
    analista: "Rafael Prado",
    supervisor: "Paulo Serra",
  },
  {
    id: "reaj-11",
    codigo: "427",
    empresa: "G O COMERCIO",
    ramoAtividade: "MATERIAIS DE CONSTRUÇÃO",
    sindicato: "SINDMAT",
    numSolicitacao: "—",
    autorizacao: "NÃO",
    reajusteSalarial: "NÃO",
    contribuicaoAssistencial: "NÃO",
    observacao: "",
    carteira: "RH - G - 03",
    analista: "Rafael Prado",
    supervisor: "Paulo Serra",
  },
];

export function getStoredReajusteSindicato(): RegReajusteSindicato[] {
  if (typeof window === "undefined") return reajusteSindicatoSeed;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reajusteSindicatoSeed));
      return reajusteSindicatoSeed;
    }
    return JSON.parse(item);
  } catch {
    return reajusteSindicatoSeed;
  }
}

export function saveReajusteSindicato(lista: RegReajusteSindicato[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* noop */
  }
}

export function createReajusteSindicato(dados: Omit<RegReajusteSindicato, "id">): RegReajusteSindicato {
  const id = `reaj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const novo: RegReajusteSindicato = { ...dados, id };
  const atuais = getStoredReajusteSindicato();
  saveReajusteSindicato([novo, ...atuais]);
  return novo;
}

export function updateReajusteSindicato(id: string, patch: Partial<RegReajusteSindicato>) {
  const atuais = getStoredReajusteSindicato();
  const next = atuais.map((item) => (item.id === id ? { ...item, ...patch } : item));
  saveReajusteSindicato(next);
}

export function deleteReajusteSindicato(id: string) {
  saveReajusteSindicato(getStoredReajusteSindicato().filter((e) => e.id !== id));
}

export function useRegReajusteSindicato() {
  const [registros, setRegistros] = useState<RegReajusteSindicato[]>([]);

  useEffect(() => {
    setRegistros(getStoredReajusteSindicato());
    const handler = () => setRegistros(getStoredReajusteSindicato());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { registros, createReajusteSindicato, updateReajusteSindicato, deleteReajusteSindicato };
}
