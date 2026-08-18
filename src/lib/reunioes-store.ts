import { useCallback, useEffect, useState } from "react";

import type { Reuniao } from "@/lib/mock-data";

const STORAGE_KEY = "dp_control_reunioes_v1";
const EVENTO = "reunioes-updated";

export function getReunioes(): Reuniao[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? (dados as Reuniao[]) : [];
  } catch (error) {
    console.error("Erro ao ler reuniões:", error);
    return [];
  }
}

export function saveReunioes(lista: Reuniao[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENTO));
  } catch (error) {
    console.error("Erro ao salvar reuniões:", error);
  }
}

/** Reuniões marcadas, persistidas no navegador e sincronizadas com o banco. */
export function useReunioes() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);

  useEffect(() => {
    const carregar = () => setReunioes(getReunioes());
    carregar();
    window.addEventListener(EVENTO, carregar);
    window.addEventListener("storage", carregar);
    return () => {
      window.removeEventListener(EVENTO, carregar);
      window.removeEventListener("storage", carregar);
    };
  }, []);

  const addReuniao = useCallback((r: Reuniao) => {
    const lista = [...getReunioes(), r];
    saveReunioes(lista);
    setReunioes(lista);
  }, []);

  const removeReuniao = useCallback((id: string) => {
    const lista = getReunioes().filter((r) => r.id !== id);
    saveReunioes(lista);
    setReunioes(lista);
  }, []);

  return { reunioes, addReuniao, removeReuniao };
}
