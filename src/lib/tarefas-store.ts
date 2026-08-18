import { useState, useEffect } from "react";
import type { Tarefa, Prioridade, PeriodicidadeRotina } from "./mock-data";

const STORAGE_KEY = "dp_control_tarefas_v1";
const EVENT_NAME = "tarefas-updated";

export type { Tarefa, PeriodicidadeRotina };

export type NovaTarefaForm = {
  titulo: string;
  empresa?: string;
  responsavel?: string;
  departamento?: string;
  prioridade: Prioridade;
  prazo: string;
  horasPrevistas: number;
  status: "backlog" | "fazendo" | "revisao" | "concluida";
  checklistItens?: string;
  periodicidade?: PeriodicidadeRotina;
  descricao?: string;
  dataInicio?: string;
  categoria?: string;
  carteira?: string;
  observacoes?: string;
};

function getStored(): Tarefa[] {
  if (typeof window === "undefined") return [];
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

function save(lista: Tarefa[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* noop */
  }
}

export function getStoredTarefas(): Tarefa[] {
  return getStored();
}

export function createTarefa(dados: NovaTarefaForm): Tarefa {
  const id = `tarefa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const checklist = (dados.checklistItens ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((item) => ({ item, feito: false, obrigatorio: false }));

  const nova: Tarefa = {
    id,
    titulo: dados.titulo,
    empresa: dados.empresa || "",
    responsavel: dados.responsavel || "",
    departamento: dados.departamento || "DP",
    prioridade: dados.prioridade,
    prazo: dados.prazo,
    horasPrevistas: Number(dados.horasPrevistas) || 1,
    horasGastas: 0,
    checklist:
      checklist.length > 0
        ? checklist
        : [{ item: "Executar tarefa", feito: false, obrigatorio: true }],
    status: dados.status,
    ...(dados.periodicidade ? { periodicidade: dados.periodicidade } : {}),
    ...(dados.descricao ? { descricao: dados.descricao } : {}),
    ...(dados.observacoes ? { observacoes: dados.observacoes } : {}),
    ...(dados.dataInicio ? { dataInicio: dados.dataInicio } : {}),
    ...(dados.categoria ? { categoria: dados.categoria } : {}),
    ...(dados.carteira ? { carteira: dados.carteira } : {}),
  };

  const atuais = getStored();
  save([nova, ...atuais]);
  return nova;
}

export function createBatchTarefas(lista: NovaTarefaForm[]): Tarefa[] {
  if (!lista || lista.length === 0) return [];
  const novas: Tarefa[] = lista.map((dados, idx) => {
    const id = `tarefa-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
    const checklist = (dados.checklistItens ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((item) => ({ item, feito: false, obrigatorio: false }));

    return {
      id,
      titulo: dados.titulo,
      empresa: dados.empresa || "",
      responsavel: dados.responsavel || "",
      departamento: dados.departamento || "DP",
      prioridade: dados.prioridade || "media",
      prazo: dados.prazo,
      horasPrevistas: Number(dados.horasPrevistas) || 1,
      horasGastas: 0,
      checklist:
        checklist.length > 0
          ? checklist
          : [{ item: "Executar tarefa", feito: false, obrigatorio: true }],
      status: dados.status || "backlog",
      ...(dados.periodicidade ? { periodicidade: dados.periodicidade } : {}),
      ...(dados.descricao ? { descricao: dados.descricao } : {}),
      ...(dados.observacoes ? { observacoes: dados.observacoes } : {}),
      ...(dados.dataInicio ? { dataInicio: dados.dataInicio } : {}),
      ...(dados.categoria ? { categoria: dados.categoria } : {}),
      ...(dados.carteira ? { carteira: dados.carteira } : {}),
    };
  });

  const atuais = getStored();
  save([...novas, ...atuais]);
  return novas;
}

export function updateTarefa(
  id: string,
  patch: Partial<Tarefa>
): Tarefa | undefined {
  const atuais = getStored();
  const idx = atuais.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  const atualizada = { ...atuais[idx]!, ...patch };
  atuais[idx] = atualizada;
  save(atuais);
  return atualizada;
}

export function deleteTarefa(id: string) {
  const atuais = getStored();
  save(atuais.filter((t) => t.id !== id));
}

export function toggleChecklistItem(tarefaId: string, itemIndex: number) {
  const atuais = getStored();
  const tarefa = atuais.find((t) => t.id === tarefaId);
  if (!tarefa) return;
  tarefa.checklist = tarefa.checklist.map((c, i) =>
    i === itemIndex ? { ...c, feito: !c.feito } : c
  );
  save(atuais);
}

export function useTarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);

  useEffect(() => {
    setTarefas(getStored());

    const handler = () => setTarefas(getStored());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return {
    tarefas,
    createTarefa,
    createBatchTarefas,
    updateTarefa,
    deleteTarefa,
    toggleChecklistItem,
    refresh: () => setTarefas(getStored()),
  };
}
