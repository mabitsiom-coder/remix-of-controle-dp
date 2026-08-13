import { useState, useEffect } from "react";

export type RegSST = {
  id: string;
  codigo: string;
  empresa: string;
  carteira?: string;
  analista?: string;
  supervisor?: string;
  sstNaMabit: "SIM" | "NÃO";
  grauDeRisco: string;
  qtdFunc: number;
  inicioContrato: string;
  examesVencidos: "SIM" | "NÃO" | "—";
  possuiProgramas: "SIM" | "NÃO" | "—";
  ltcat: string;
  pcmso: string;
  pgr: string;
  ltip: string;
  dir: string;
  linkProgramas: string;
  obsAnalista: string;
  obsCS: string;
};

const STORAGE_KEY_MATRIX = "dp_control_sst_matrix_v3";
const EVENT_NAME_MATRIX = "sst-matrix-updated";

export const sstMatrixSeed: RegSST[] = [
  {
    id: "sst-1",
    codigo: "66",
    empresa: "KELIANE S MATRIZ",
    carteira: "RH - G - 01",
    analista: "Camila Rocha",
    supervisor: "Paulo Serra",
    sstNaMabit: "SIM",
    grauDeRisco: "2",
    qtdFunc: 7,
    inicioContrato: "09/2022",
    examesVencidos: "SIM",
    possuiProgramas: "SIM",
    ltcat: "Indeterminado",
    pcmso: "—",
    pgr: "—",
    ltip: "—",
    dir: "—",
    linkProgramas: "",
    obsAnalista: "Encaminhado em: 22/07",
    obsCS: "",
  },
  {
    id: "sst-2",
    codigo: "40",
    empresa: "D M A MACIEL",
    carteira: "RH - G - 06",
    analista: "SIMEANE",
    supervisor: "ADRIELLE",
    sstNaMabit: "SIM",
    grauDeRisco: "1",
    qtdFunc: 3,
    inicioContrato: "—",
    examesVencidos: "NÃO",
    possuiProgramas: "NÃO",
    ltcat: "Indeterminado",
    pcmso: "—",
    pgr: "24/08/2027",
    ltip: "Indeterminado",
    dir: "—",
    linkProgramas: "",
    obsAnalista: "",
    obsCS: "",
  },
  {
    id: "sst-3",
    codigo: "658",
    empresa: "STOP MED",
    carteira: "RH - G - 06",
    analista: "SIMEANE",
    supervisor: "ADRIELLE",
    sstNaMabit: "SIM",
    grauDeRisco: "1",
    qtdFunc: 12,
    inicioContrato: "—",
    examesVencidos: "SIM",
    possuiProgramas: "NÃO",
    ltcat: "Indeterminado",
    pcmso: "—",
    pgr: "24/08/2027",
    ltip: "Indeterminado",
    dir: "—",
    linkProgramas: "",
    obsAnalista: "Encaminhado em: 22/07",
    obsCS: "",
  },
  {
    id: "sst-4",
    codigo: "247",
    empresa: "EXPRESSO SAUDE",
    carteira: "RH - G - 06",
    analista: "SIMEANE",
    supervisor: "ADRIELLE",
    sstNaMabit: "SIM",
    grauDeRisco: "2",
    qtdFunc: 2,
    inicioContrato: "—",
    examesVencidos: "NÃO",
    possuiProgramas: "NÃO",
    ltcat: "Indeterminado",
    pcmso: "—",
    pgr: "24/08/2027",
    ltip: "Indeterminado",
    dir: "—",
    linkProgramas: "",
    obsAnalista: "",
    obsCS: "",
  },
  {
    id: "sst-5",
    codigo: "1094",
    empresa: "CENTER CLIN",
    carteira: "RH - G - 03",
    analista: "Rafael Prado",
    supervisor: "Paulo Serra",
    sstNaMabit: "SIM",
    grauDeRisco: "3",
    qtdFunc: 10,
    inicioContrato: "09/2024",
    examesVencidos: "SIM",
    possuiProgramas: "SIM",
    ltcat: "Indeterminado",
    pcmso: "23/09/2025",
    pgr: "21/10/2026",
    ltip: "Indeterminado",
    dir: "—",
    linkProgramas: "https://drive.google.com",
    obsAnalista: "Encaminhado em: 22/07",
    obsCS: "",
  },
  {
    id: "sst-6",
    codigo: "1587",
    empresa: "Y M SERVIÇOS MEDICOS",
    carteira: "RH - G - 02",
    analista: "Juliana Reis",
    supervisor: "Paulo Serra",
    sstNaMabit: "SIM",
    grauDeRisco: "3",
    qtdFunc: 1,
    inicioContrato: "22/07/2026",
    examesVencidos: "—",
    possuiProgramas: "—",
    ltcat: "—",
    pcmso: "—",
    pgr: "—",
    ltip: "—",
    dir: "—",
    linkProgramas: "",
    obsAnalista: "",
    obsCS: "",
  },
  {
    id: "sst-7",
    codigo: "1529",
    empresa: "M M GESTÃO",
    carteira: "RH - G - 01",
    analista: "Camila Rocha",
    supervisor: "Paulo Serra",
    sstNaMabit: "NÃO",
    grauDeRisco: "3",
    qtdFunc: 40,
    inicioContrato: "—",
    examesVencidos: "—",
    possuiProgramas: "—",
    ltcat: "—",
    pcmso: "—",
    pgr: "—",
    ltip: "—",
    dir: "—",
    linkProgramas: "",
    obsAnalista: "",
    obsCS: "1 Pró-Labore",
  },
];

export function getStoredRegSST(): RegSST[] {
  if (typeof window === "undefined") return sstMatrixSeed;
  try {
    const item = localStorage.getItem(STORAGE_KEY_MATRIX);
    if (!item) {
      localStorage.setItem(STORAGE_KEY_MATRIX, JSON.stringify(sstMatrixSeed));
      return sstMatrixSeed;
    }
    return JSON.parse(item);
  } catch {
    return sstMatrixSeed;
  }
}

export function saveRegSST(lista: RegSST[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_MATRIX, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENT_NAME_MATRIX));
  } catch {
    /* noop */
  }
}

export function createRegSST(dados: Omit<RegSST, "id">): RegSST {
  const id = `sst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const novo: RegSST = { ...dados, id };
  const atuais = getStoredRegSST();
  saveRegSST([novo, ...atuais]);
  return novo;
}

export function updateRegSST(id: string, patch: Partial<RegSST>) {
  const atuais = getStoredRegSST();
  const next = atuais.map((item) => (item.id === id ? { ...item, ...patch } : item));
  saveRegSST(next);
}

export function deleteRegSST(id: string) {
  saveRegSST(getStoredRegSST().filter((e) => e.id !== id));
}

export function useRegSST() {
  const [registros, setRegistros] = useState<RegSST[]>([]);

  useEffect(() => {
    setRegistros(getStoredRegSST());
    const handler = () => setRegistros(getStoredRegSST());
    window.addEventListener(EVENT_NAME_MATRIX, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME_MATRIX, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { registros, createRegSST, updateRegSST, deleteRegSST };
}

// Retrocompatibilidade
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

export type NovoEventoSSTForm = Omit<RegSST, "id">;

export function useEventosSST() {
  const { registros, deleteRegSST } = useRegSST();
  return { eventos: [], deleteEventoSST: deleteRegSST, registros };
}
