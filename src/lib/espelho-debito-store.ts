import { useState, useEffect } from "react";

export type RegEspelhoDebito = {
  id: string;
  ord: number;
  codigo: string;
  empresa: string;
  cnpjCpf: string;
  tipo: "C/M" | "S/M";
  debitos: string;
  omissao: "SIM" | "NÃO" | "—";
  enviadoCliente: "SIM" | "NÃO" | "—";
  obsAnalistaSolicitacao: string;
  obsAnalistaData: string;
  obsCsFerramenta: string;
  obsCsData: string;
  carteira?: string;
  analista?: string;
  supervisor?: string;
};

const STORAGE_KEY = "dp_control_espelho_debito_v1";
const EVENT_NAME = "espelho-debito-updated";

export const espelhoDebitoSeed: RegEspelhoDebito[] = [
  {
    id: "deb-1",
    ord: 1,
    codigo: "1522",
    empresa: "B BORGES LIMA",
    cnpjCpf: "34086440000125",
    tipo: "C/M",
    debitos: "02 e 05/2026-INSS",
    omissao: "SIM",
    enviadoCliente: "SIM",
    obsAnalistaSolicitacao: "50294",
    obsAnalistaData: "—",
    obsCsFerramenta: "—",
    obsCsData: "Informado: 23/07",
    carteira: "RH - G - 01",
    analista: "Camila Rocha",
    supervisor: "Paulo Serra",
  },
  {
    id: "deb-2",
    ord: 2,
    codigo: "788",
    empresa: "INEZ S S SILVA",
    cnpjCpf: "02960673000119",
    tipo: "C/M",
    debitos: "—",
    omissao: "NÃO",
    enviadoCliente: "—",
    obsAnalistaSolicitacao: "—",
    obsAnalistaData: "—",
    obsCsFerramenta: "—",
    obsCsData: "—",
    carteira: "RH - G - 02",
    analista: "Juliana Reis",
    supervisor: "Paulo Serra",
  },
  {
    id: "deb-3",
    ord: 3,
    codigo: "293",
    empresa: "J A HOSPITALAR",
    cnpjCpf: "12847774000131",
    tipo: "C/M",
    debitos: "—",
    omissao: "NÃO",
    enviadoCliente: "—",
    obsAnalistaSolicitacao: "—",
    obsAnalistaData: "—",
    obsCsFerramenta: "—",
    obsCsData: "—",
    carteira: "RH - G - 03",
    analista: "Rafael Prado",
    supervisor: "Paulo Serra",
  },
  {
    id: "deb-4",
    ord: 4,
    codigo: "1497",
    empresa: "EDUARDO COMERCIO - C E C TECH",
    cnpjCpf: "42.857.016/0001-65",
    tipo: "C/M",
    debitos: "02,03,04,05/2026 - INSS",
    omissao: "SIM",
    enviadoCliente: "SIM",
    obsAnalistaSolicitacao: "50295",
    obsAnalistaData: "—",
    obsCsFerramenta: "—",
    obsCsData: "Informado: 23/07",
    carteira: "RH - G - 06",
    analista: "SIMEANE",
    supervisor: "ADRIELLE",
  },
  {
    id: "deb-5",
    ord: 5,
    codigo: "682",
    empresa: "M H DE OLIVEIRA",
    cnpjCpf: "23.023.767/0001-31",
    tipo: "C/M",
    debitos: "01,02 e 06/2024 - 01,02,04,05,06,09,11 e 12/2025 - 01,02 e 03,04,05/2026 - INSS",
    omissao: "SIM",
    enviadoCliente: "SIM",
    obsAnalistaSolicitacao: "50296",
    obsAnalistaData: "—",
    obsCsFerramenta: "—",
    obsCsData: "Informado: 23/07",
    carteira: "RH - G - 06",
    analista: "SIMEANE",
    supervisor: "ADRIELLE",
  },
  {
    id: "deb-6",
    ord: 6,
    codigo: "1153",
    empresa: "CIRURGIOES E ASSOCIADOS",
    cnpjCpf: "55.098.441/0001-60",
    tipo: "C/M",
    debitos: "—",
    omissao: "—",
    enviadoCliente: "—",
    obsAnalistaSolicitacao: "—",
    obsAnalistaData: "—",
    obsCsFerramenta: "—",
    obsCsData: "Guia foi paga",
    carteira: "RH - G - 04",
    analista: "ARIANY",
    supervisor: "ADRIELLE",
  },
];

export function getStoredEspelhoDebito(): RegEspelhoDebito[] {
  if (typeof window === "undefined") return espelhoDebitoSeed;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(espelhoDebitoSeed));
      return espelhoDebitoSeed;
    }
    return JSON.parse(item);
  } catch {
    return espelhoDebitoSeed;
  }
}

export function saveEspelhoDebito(lista: RegEspelhoDebito[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* noop */
  }
}

export function createEspelhoDebito(dados: Omit<RegEspelhoDebito, "id">): RegEspelhoDebito {
  const id = `deb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const novo: RegEspelhoDebito = { ...dados, id };
  const atuais = getStoredEspelhoDebito();
  saveEspelhoDebito([novo, ...atuais]);
  return novo;
}

export function updateEspelhoDebito(id: string, patch: Partial<RegEspelhoDebito>) {
  const atuais = getStoredEspelhoDebito();
  const next = atuais.map((item) => (item.id === id ? { ...item, ...patch } : item));
  saveEspelhoDebito(next);
}

export function deleteEspelhoDebito(id: string) {
  saveEspelhoDebito(getStoredEspelhoDebito().filter((e) => e.id !== id));
}

export function useRegEspelhoDebito() {
  const [registros, setRegistros] = useState<RegEspelhoDebito[]>([]);

  useEffect(() => {
    setRegistros(getStoredEspelhoDebito());
    const handler = () => setRegistros(getStoredEspelhoDebito());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { registros, createEspelhoDebito, updateEspelhoDebito, deleteEspelhoDebito };
}
