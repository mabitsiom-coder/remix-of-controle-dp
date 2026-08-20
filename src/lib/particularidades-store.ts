import { useState, useEffect } from "react";
import { getTodasEmpresas, saveEmpresas } from "./empresas-store";

export type HistoricoParticularidade = {
  campo: string;
  anterior: any;
  novo: any;
  usuario: string;
  dataHora: string;
};

/**
 * Particularidades do Cliente — informações vinculadas à EMPRESA (empresaId).
 * O vínculo é sempre com a empresa, portanto a informação acompanha a empresa
 * mesmo que ela troque de carteira. Nunca duplicar registros por carteira.
 */
export type RegParticularidade = {
  id: string;
  empresaId: string;
  grupos: string;
  informacoes: string;
  folhaPagamento: string;
  observacao: string;
  /** Dia de fechamento da folha: "20", "25", "30" ou "" (não definido). */
  diaFolha?: "20" | "25" | "30" | "";
  /** Identifica folhas sem lançamentos (folha zerada / referência sem movimento). */
  folhaSemLancamento?: boolean;
  atualizadoPor?: string;
  atualizadoEm?: string;
  historico?: HistoricoParticularidade[];
};

const STORAGE_KEY = "dp_control_particularidades_v1";
const EVENT_NAME = "particularidades-updated";

function dataHoraAtual() {
  const d = new Date();
  const data = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${data} às ${hora}`;
}

export function getStoredParticularidades(): RegParticularidade[] {
  if (typeof window === "undefined") return [];
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) return [];
    const lista = JSON.parse(item);
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function save(lista: RegParticularidade[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* noop */
  }
}

/** Cria ou atualiza a particularidade de uma empresa (upsert por empresaId). */
export function salvarParticularidade(
  empresaId: string,
  dados: Partial<Omit<RegParticularidade, "id" | "empresaId" | "atualizadoEm" | "atualizadoPor" | "historico">>,
  usuario = "Sistema",
): RegParticularidade {
  const lista = getStoredParticularidades();
  const atual = lista.find((r) => r.empresaId === empresaId);
  const agora = dataHoraAtual();

  const novoHistorico: HistoricoParticularidade[] = [...(atual?.historico || [])];

  if (atual) {
    for (const [campo, novoValor] of Object.entries(dados)) {
      const valorAnterior = (atual as any)[campo];
      if (valorAnterior !== novoValor) {
        novoHistorico.unshift({
          campo,
          anterior: valorAnterior || "",
          novo: novoValor || "",
          usuario,
          dataHora: agora,
        });
      }
    }
  }

  if (novoHistorico.length > 50) {
    novoHistorico.length = 50;
  }

  let resultado: RegParticularidade;

  if (atual) {
    resultado = {
      ...atual,
      ...dados,
      atualizadoPor: usuario,
      atualizadoEm: agora,
      historico: novoHistorico,
    };
    save(lista.map((r) => (r.empresaId === empresaId ? resultado : r)));
  } else {
    resultado = {
      id: `part-${empresaId}`,
      empresaId,
      grupos: dados.grupos ?? "",
      informacoes: dados.informacoes ?? "",
      folhaPagamento: dados.folhaPagamento ?? "",
      observacao: dados.observacao ?? "",
      diaFolha: dados.diaFolha ?? "",
      folhaSemLancamento: dados.folhaSemLancamento ?? false,
      atualizadoPor: usuario,
      atualizadoEm: agora,
      historico: novoHistorico,
    };
    save([resultado, ...lista]);
  }

  // Sincronizar dados relevantes com a ficha da empresa em empresas-store
  try {
    const todas = getTodasEmpresas();
    const emp = todas.find((e) => e.id === empresaId);
    if (emp) {
      const atualizada = {
        ...emp,
        particularidades: {
          ...emp.particularidades,
          ...(dados.folhaPagamento !== undefined ? { fechamento: dados.folhaPagamento } : {}),
          ...(dados.observacao !== undefined ? { observacoes: dados.observacao } : {}),
        },
      };
      saveEmpresas(todas.map((e) => (e.id === empresaId ? atualizada : e)));
    }
  } catch (err) {
    console.error("Erro ao sincronizar particularidades com empresas:", err);
  }

  return resultado;
}

export function useParticularidades() {
  const [registros, setRegistros] = useState<RegParticularidade[]>([]);

  useEffect(() => {
    const ler = () => setRegistros(getStoredParticularidades());
    ler();
    window.addEventListener(EVENT_NAME, ler);
    window.addEventListener("storage", ler);
    return () => {
      window.removeEventListener(EVENT_NAME, ler);
      window.removeEventListener("storage", ler);
    };
  }, []);

  return { registros, salvarParticularidade };
}
