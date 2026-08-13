import { useState, useEffect } from "react";

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
  atualizadoEm?: string;
};

const STORAGE_KEY = "dp_control_particularidades_v1";
const EVENT_NAME = "particularidades-updated";

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
  dados: Partial<Omit<RegParticularidade, "id" | "empresaId">>,
): RegParticularidade {
  const lista = getStoredParticularidades();
  const atual = lista.find((r) => r.empresaId === empresaId);
  const hoje = new Date();
  const atualizadoEm = `${String(hoje.getDate()).padStart(2, "0")}/${String(
    hoje.getMonth() + 1,
  ).padStart(2, "0")}/${hoje.getFullYear()}`;

  if (atual) {
    const atualizado: RegParticularidade = { ...atual, ...dados, atualizadoEm };
    save(lista.map((r) => (r.empresaId === empresaId ? atualizado : r)));
    return atualizado;
  }

  const novo: RegParticularidade = {
    id: `part-${empresaId}`,
    empresaId,
    grupos: dados.grupos ?? "",
    informacoes: dados.informacoes ?? "",
    folhaPagamento: dados.folhaPagamento ?? "",
    observacao: dados.observacao ?? "",
    atualizadoEm,
  };
  save([novo, ...lista]);
  return novo;
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
