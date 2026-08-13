import { useState, useEffect } from "react";

export type RegFGTSTrimestral = {
  id: string;
  codigo: string;
  empresa: string;
  cnpj: string;
  numPis: string;
  pedidoExtConsolidado: string;
  baixadoExtConsolidado: string;
  pendenciaFgts: "SIM" | "NÃO" | "—";
  enviadoCliente: "SIM" | "NÃO" | "—";
  obsAnalistaSolicitacao: string;
  obsCS: string;
  carteira?: string;
  analista?: string;
  supervisor?: string;
};

const STORAGE_KEY = "dp_control_fgts_trimestral_v1";
const EVENT_NAME = "fgts-trimestral-updated";

export const fgtsTrimestralSeed: RegFGTSTrimestral[] = [
  {
    id: "fgts-1",
    codigo: "416",
    empresa: "L A AMANJÁS",
    cnpj: "04.659.462/0001-76",
    numPis: "12626871038 / 12585726039",
    pedidoExtConsolidado: "18/06/2026",
    baixadoExtConsolidado: "22/06/2026",
    pendenciaFgts: "SIM",
    enviadoCliente: "NÃO",
    obsAnalistaSolicitacao: "08,10 e 12/2022, 10/2023, 01,04,05,07/2024, 03 e 11/2025, 03 e 05/2026",
    obsCS: "",
    carteira: "RH - G - 01",
    analista: "ARIANNY",
    supervisor: "ADRIELLE",
  },
  {
    id: "fgts-2",
    codigo: "1116",
    empresa: "LOJÃO DO PADE CONF FILIAL",
    cnpj: "00.670.543/0002-05",
    numPis: "12498765431",
    pedidoExtConsolidado: "10/06/2026",
    baixadoExtConsolidado: "15/06/2026",
    pendenciaFgts: "NÃO",
    enviadoCliente: "SIM",
    obsAnalistaSolicitacao: "Sem pendências apontadas",
    obsCS: "Cliente ciente",
    carteira: "RH - G - 06",
    analista: "SIMEANE",
    supervisor: "ADRIELLE",
  },
  {
    id: "fgts-3",
    codigo: "1094",
    empresa: "CENTER CLIN",
    cnpj: "11.222.333/0001-44",
    numPis: "10987654321",
    pedidoExtConsolidado: "05/07/2026",
    baixadoExtConsolidado: "12/07/2026",
    pendenciaFgts: "SIM",
    enviadoCliente: "SIM",
    obsAnalistaSolicitacao: "Pendência 04 e 05/2025",
    obsCS: "Aguardando envio de comprovante",
    carteira: "RH - G - 03",
    analista: "Rafael Prado",
    supervisor: "Paulo Serra",
  },
];

export function getStoredFGTSTrimestral(): RegFGTSTrimestral[] {
  if (typeof window === "undefined") return fgtsTrimestralSeed;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fgtsTrimestralSeed));
      return fgtsTrimestralSeed;
    }
    return JSON.parse(item);
  } catch {
    return fgtsTrimestralSeed;
  }
}

export function saveFGTSTrimestral(lista: RegFGTSTrimestral[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* noop */
  }
}

export function createFGTSTrimestral(dados: Omit<RegFGTSTrimestral, "id">): RegFGTSTrimestral {
  const id = `fgts-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const novo: RegFGTSTrimestral = { ...dados, id };
  const atuais = getStoredFGTSTrimestral();
  saveFGTSTrimestral([novo, ...atuais]);
  return novo;
}

export function updateFGTSTrimestral(id: string, patch: Partial<RegFGTSTrimestral>) {
  const atuais = getStoredFGTSTrimestral();
  const next = atuais.map((item) => (item.id === id ? { ...item, ...patch } : item));
  saveFGTSTrimestral(next);
}

export function deleteFGTSTrimestral(id: string) {
  saveFGTSTrimestral(getStoredFGTSTrimestral().filter((e) => e.id !== id));
}

export function useRegFGTSTrimestral() {
  const [registros, setRegistros] = useState<RegFGTSTrimestral[]>([]);

  useEffect(() => {
    setRegistros(getStoredFGTSTrimestral());
    const handler = () => setRegistros(getStoredFGTSTrimestral());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { registros, createFGTSTrimestral, updateFGTSTrimestral, deleteFGTSTrimestral };
}
