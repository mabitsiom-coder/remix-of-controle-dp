import { useState, useEffect } from "react";

export type HistoricoAlteracao = {
  campo: string;
  anterior: any;
  novo: any;
  usuario: string;
  dataHora: string;
};

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
  conferidoAnalistaPor?: string;
  conferidoAnalistaEm?: string;
  revisadoSupervisao: "REVISADO" | "PENDENTE" | "—";
  revisadoSupervisaoPor?: string;
  revisadoSupervisaoEm?: string;
  observacao: string;
  carteira?: string;
  analista?: string;
  supervisor?: string;
  atualizadoPor?: string;
  atualizadoEm?: string;
  historico?: HistoricoAlteracao[];
};

const STORAGE_KEY = "dp_control_dctfweb_matrix_v1";
const EVENT_NAME = "dctfweb-matrix-updated";

function dataHoraAtual() {
  const d = new Date();
  const data = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${data} às ${hora}`;
}

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
    conferidoAnalistaPor: "SIMEANE",
    conferidoAnalistaEm: "14/07/2026 às 11:20",
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
    conferidoAnalistaPor: "SIMEANE",
    conferidoAnalistaEm: "14/07/2026 às 11:35",
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
    conferidoAnalistaPor: "ARIANY",
    conferidoAnalistaEm: "18/07/2026 às 14:10",
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

export function createDCTFWeb(dados: Omit<RegDCTFWeb, "id">, usuario = "Sistema"): RegDCTFWeb {
  const id = `dctf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const agora = dataHoraAtual();
  const novo: RegDCTFWeb = {
    ...dados,
    id,
    atualizadoPor: usuario,
    atualizadoEm: agora,
  };
  const atuais = getStoredDCTFWeb();
  saveDCTFWeb([novo, ...atuais]);
  return novo;
}

export function updateDCTFWeb(
  id: string,
  patch: Partial<RegDCTFWeb>,
  usuario = "Sistema"
): RegDCTFWeb | undefined {
  const atuais = getStoredDCTFWeb();
  const atual = atuais.find((item) => item.id === id || item.codigo === id);
  if (!atual) return undefined;

  const agora = dataHoraAtual();
  const novoHistorico: HistoricoAlteracao[] = [...(atual.historico || [])];

  for (const [campo, novoValor] of Object.entries(patch)) {
    const valorAnterior = (atual as any)[campo];
    if (valorAnterior !== novoValor && campo !== "historico" && campo !== "atualizadoEm" && campo !== "atualizadoPor") {
      novoHistorico.unshift({
        campo,
        anterior: valorAnterior ?? "",
        novo: novoValor ?? "",
        usuario,
        dataHora: agora,
      });
    }
  }

  // Limitar histórico a 50 itens
  if (novoHistorico.length > 50) {
    novoHistorico.length = 50;
  }

  const atualizado: RegDCTFWeb = {
    ...atual,
    ...patch,
    atualizadoPor: usuario,
    atualizadoEm: agora,
    historico: novoHistorico,
  };

  const next = atuais.map((item) => (item.id === atual.id ? atualizado : item));
  saveDCTFWeb(next);
  return atualizado;
}

export function upsertDCTFWeb(
  id: string,
  patch: Partial<RegDCTFWeb>,
  fallback?: Partial<RegDCTFWeb>,
  usuario = "Sistema"
): RegDCTFWeb {
  const atuais = getStoredDCTFWeb();
  const atual = atuais.find((item) => item.id === id || (item.codigo && item.codigo === id));

  if (atual) {
    return updateDCTFWeb(atual.id, patch, usuario)!;
  }

  const agora = dataHoraAtual();
  const novo: RegDCTFWeb = {
    id,
    ord: 1,
    codigo: "",
    empresa: "",
    cnpj: "",
    tipo: "C/M",
    reinf: "SIM",
    eSocial: "SIM",
    nfCprb: "❌",
    nfRetInss: "❌",
    nfRetCsrf: "❌",
    transmissaoPublicacao: "PUBLICADO NA MTZ",
    reciboDocSalvo: "PUBLICADO NA MTZ",
    conferidoAnalista: "PENDENTE",
    revisadoSupervisao: "PENDENTE",
    observacao: "",
    ...fallback,
    ...patch,
    atualizadoPor: usuario,
    atualizadoEm: agora,
    historico: [
      {
        campo: Object.keys(patch).join(", "),
        anterior: "Inicial",
        novo: JSON.stringify(patch),
        usuario,
        dataHora: agora,
      },
    ],
  };

  saveDCTFWeb([novo, ...atuais]);
  return novo;
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

  return { registros, createDCTFWeb, updateDCTFWeb, upsertDCTFWeb, deleteDCTFWeb };
}
