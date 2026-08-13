import { useState, useEffect } from "react";

export type RegDCTFWeb = {
  id: string;
  ord: number;
  codigo: string;
  empresa: string;
  cnpj: string;
  tipo: "C/M" | "S/M"; // C/M = Com Movimento, S/M = Sem Movimento
  reinf: "SIM" | "NÃO" | "❌";
  eSocial: "SIM" | "NÃO" | "❌";
  nfCprb: "SIM" | "NÃO" | "❌";
  nfRetInss: "SIM" | "NÃO" | "❌";
  nfRetCsrf: "SIM" | "NÃO" | "❌";
  transmissaoPublicacao: string;
  reciboDocSalvo: string;
  conferidoAnalista: "CONFERIDO" | "PENDENTE" | "—";
  revisadoSupervisao: "REVISADO" | "PENDENTE" | "—";
  observacao: string;
  carteira?: string;
  analista?: string;
  supervisor?: string;
};

const STORAGE_KEY = "dp_control_dctfweb_matrix_v1";
const EVENT_NAME = "dctfweb-matrix-updated";

export const dctfwebSeed: RegDCTFWeb[] = [
  {
    id: "dctf-1",
    ord: 20,
    codigo: "1116",
    empresa: "LOJÃO DO PADE CONF FILIAL",
    cnpj: "00.670.543/0002-05",
    tipo: "C/M",
    reinf: "SIM",
    eSocial: "SIM",
    nfCprb: "❌",
    nfRetInss: "❌",
    nfRetCsrf: "❌",
    transmissaoPublicacao: "PUBLICADO NA MTZ",
    reciboDocSalvo: "PUBLICADO NA MTZ",
    conferidoAnalista: "CONFERIDO",
    revisadoSupervisao: "PENDENTE",
    observacao: "",
    carteira: "RH - G - 06",
    analista: "SIMEANE",
    supervisor: "ADRIELLE",
  },
  {
    id: "dctf-2",
    ord: 28,
    codigo: "125",
    empresa: "LOJÃO DO PADE CONF MTZ",
    cnpj: "00.670.543/0001-16",
    tipo: "C/M",
    reinf: "SIM",
    eSocial: "SIM",
    nfCprb: "❌",
    nfRetInss: "❌",
    nfRetCsrf: "❌",
    transmissaoPublicacao: "14/07/2026",
    reciboDocSalvo: "14/07/2026",
    conferidoAnalista: "CONFERIDO",
    revisadoSupervisao: "PENDENTE",
    observacao: "",
    carteira: "RH - G - 06",
    analista: "SIMEANE",
    supervisor: "ADRIELLE",
  },
  {
    id: "dctf-3",
    ord: 98,
    codigo: "128",
    empresa: "LOJÃO DO PADEIRO & CIA (MATRIZ S/M)",
    cnpj: "05.943.379/0001-97",
    tipo: "S/M",
    reinf: "SIM",
    eSocial: "SIM",
    nfCprb: "❌",
    nfRetInss: "❌",
    nfRetCsrf: "❌",
    transmissaoPublicacao: "10/07/2026",
    reciboDocSalvo: "18/07/2026",
    conferidoAnalista: "CONFERIDO",
    revisadoSupervisao: "PENDENTE",
    observacao: "",
    carteira: "RH - G - 04",
    analista: "ARIANY",
    supervisor: "ADRIELLE",
  },
];

export function getStoredDCTFWeb(): RegDCTFWeb[] {
  if (typeof window === "undefined") return dctfwebSeed;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dctfwebSeed));
      return dctfwebSeed;
    }
    return JSON.parse(item);
  } catch {
    return dctfwebSeed;
  }
}

export function saveDCTFWeb(lista: RegDCTFWeb[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* noop */
  }
}

export function createDCTFWeb(dados: Omit<RegDCTFWeb, "id">): RegDCTFWeb {
  const id = `dctf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const novo: RegDCTFWeb = { ...dados, id };
  const atuais = getStoredDCTFWeb();
  saveDCTFWeb([novo, ...atuais]);
  return novo;
}

export function updateDCTFWeb(id: string, patch: Partial<RegDCTFWeb>) {
  const atuais = getStoredDCTFWeb();
  const next = atuais.map((item) => (item.id === id ? { ...item, ...patch } : item));
  saveDCTFWeb(next);
}

export function deleteDCTFWeb(id: string) {
  saveDCTFWeb(getStoredDCTFWeb().filter((e) => e.id !== id));
}

export function useRegDCTFWeb() {
  const [registros, setRegistros] = useState<RegDCTFWeb[]>([]);

  useEffect(() => {
    setRegistros(getStoredDCTFWeb());
    const handler = () => setRegistros(getStoredDCTFWeb());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { registros, createDCTFWeb, updateDCTFWeb, deleteDCTFWeb };
}
