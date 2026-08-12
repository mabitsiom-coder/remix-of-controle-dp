import { useState, useEffect } from "react";
import type { Obrigacao, StatusObrigacao } from "./mock-data";

const STORAGE_KEY = "dp_control_obrigacoes_v1";
const EVENT_NAME = "obrigacoes-updated";

export type { Obrigacao, StatusObrigacao };

export type NovaObrigacaoForm = {
  empresa: string;
  tipo: string;
  competencia: string;
  prazo: string;
  status: StatusObrigacao;
  responsavel: string;
  protocolo: string;
};

function getStored(): Obrigacao[] {
  if (typeof window === "undefined") return [];
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

function save(lista: Obrigacao[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* noop */
  }
}

export function createObrigacao(dados: NovaObrigacaoForm): Obrigacao {
  const nova: Obrigacao = {
    id: `obr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    empresa: dados.empresa,
    tipo: dados.tipo,
    competencia: dados.competencia,
    prazo: dados.prazo,
    status: dados.status,
    responsavel: dados.responsavel,
    ...(dados.protocolo.trim() ? { protocolo: dados.protocolo.trim() } : {}),
  };
  save([nova, ...getStored()]);
  return nova;
}

export function updateObrigacao(id: string, patch: Partial<Obrigacao>) {
  const atuais = getStored();
  const idx = atuais.findIndex((o) => o.id === id);
  if (idx === -1) return;
  atuais[idx] = { ...atuais[idx]!, ...patch };
  save(atuais);
}

export function deleteObrigacao(id: string) {
  save(getStored().filter((o) => o.id !== id));
}

export function useObrigacoes() {
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>([]);

  useEffect(() => {
    setObrigacoes(getStored());
    const handler = () => setObrigacoes(getStored());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { obrigacoes, createObrigacao, updateObrigacao, deleteObrigacao };
}
