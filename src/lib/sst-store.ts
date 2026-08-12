import { useState, useEffect } from "react";
import type { EventoSST } from "./mock-data";

const STORAGE_KEY = "dp_control_sst_v1";
const EVENT_NAME = "sst-updated";

export type { EventoSST };

export type NovoEventoSSTForm = {
  empresa: string;
  colaborador: string;
  tipo: string;
  evento: string;
  vencimento: string;
  clinica: string;
};

export function calcularDiasRestantes(vencimento: string): number {
  if (!vencimento) return 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(`${vencimento}T00:00:00`);
  if (Number.isNaN(alvo.getTime())) return 0;
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
}

function getStored(): EventoSST[] {
  if (typeof window === "undefined") return [];
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    const lista: EventoSST[] = item ? JSON.parse(item) : [];
    return lista.map((e) => ({ ...e, diasRestantes: calcularDiasRestantes(e.vencimento) }));
  } catch {
    return [];
  }
}

function save(lista: EventoSST[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* noop */
  }
}

export function createEventoSST(dados: NovoEventoSSTForm): EventoSST {
  const novo: EventoSST = {
    id: `sst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    empresa: dados.empresa,
    colaborador: dados.colaborador,
    tipo: dados.tipo,
    evento: dados.evento,
    vencimento: dados.vencimento,
    diasRestantes: calcularDiasRestantes(dados.vencimento),
    clinica: dados.clinica,
  };
  save([novo, ...getStored()]);
  return novo;
}

export function deleteEventoSST(id: string) {
  save(getStored().filter((e) => e.id !== id));
}

export function useEventosSST() {
  const [eventos, setEventos] = useState<EventoSST[]>([]);

  useEffect(() => {
    setEventos(getStored());
    const handler = () => setEventos(getStored());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { eventos, createEventoSST, deleteEventoSST };
}
