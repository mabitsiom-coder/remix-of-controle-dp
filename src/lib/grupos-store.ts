import { useState, useEffect } from "react";
import { registrarAuditoria } from "./auditoria-store";

export type GrupoEmpresarial = {
  id: string;
  nome: string;
  codigo: string;
  responsavel: string;
  descricao: string;
  empresaIds: string[];
};

const STORAGE_KEY = "dp_control_grupos_v1";
const EVENT_NAME = "grupos-updated";

const initialGrupos: GrupoEmpresarial[] = [];

export function getStoredGrupos(): GrupoEmpresarial[] {
  if (typeof window === "undefined") return initialGrupos;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGrupos));
      return initialGrupos;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error("Erro ao ler grupos do localStorage:", error);
    return initialGrupos;
  }
}

export function getGrupoById(id: string): GrupoEmpresarial | undefined {
  const lista = getStoredGrupos();
  return lista.find((g) => g.id === id);
}

export function saveGrupos(lista: GrupoEmpresarial[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (error) {
    console.error("Erro ao salvar grupos no localStorage:", error);
  }
}

export function addGrupo(dados: {
  nome: string;
  codigo?: string;
  responsavel?: string;
  descricao?: string;
  empresaIds?: string[];
}): GrupoEmpresarial {
  const slug = dados.nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const id = `grupo-${slug}-${Date.now().toString(36)}`;
  const codigo = dados.codigo || `GRP-${Math.floor(100 + Math.random() * 900)}`;

  const novoGrupo: GrupoEmpresarial = {
    id,
    nome: dados.nome,
    codigo,
    responsavel: dados.responsavel || "Não informado",
    descricao: dados.descricao || "Grupo econômico cadastrado no sistema.",
    empresaIds: dados.empresaIds || [],
  };

  const atuais = getStoredGrupos();
  saveGrupos([...atuais, novoGrupo]);

  registrarAuditoria({
    operacao: "Criação de Grupo",
    grupoAfetado: novoGrupo.nome,
    registroId: novoGrupo.id,
    novaInformacao: `Código: ${novoGrupo.codigo} | Responsável: ${novoGrupo.responsavel}`,
    detalhes: `${novoGrupo.empresaIds.length} empresas associadas inicialmente.`,
  });

  return novoGrupo;
}

export function updateGrupo(
  id: string,
  novosDados: Partial<Omit<GrupoEmpresarial, "id">>,
): GrupoEmpresarial | undefined {
  const atuais = getStoredGrupos();
  const anterior = atuais.find((g) => g.id === id);
  let atualizado: GrupoEmpresarial | undefined;

  const novaLista = atuais.map((g) => {
    if (g.id === id) {
      atualizado = { ...g, ...novosDados };
      return atualizado;
    }
    return g;
  });

  if (atualizado) {
    saveGrupos(novaLista);

    registrarAuditoria({
      operacao: "Alteração de Grupo",
      grupoAfetado: atualizado.nome,
      registroId: id,
      informacaoAnterior: anterior ? `Resp: ${anterior.responsavel}` : undefined,
      novaInformacao: `Resp: ${atualizado.responsavel}`,
      detalhes: `Descrição ou responsáveis atualizados.`,
    });
  }

  return atualizado;
}

export function removeGrupo(id: string) {
  const atuais = getStoredGrupos();
  const anterior = atuais.find((g) => g.id === id);
  saveGrupos(atuais.filter((g) => g.id !== id));

  if (anterior) {
    registrarAuditoria({
      operacao: "Exclusão de Grupo",
      grupoAfetado: anterior.nome,
      registroId: id,
      informacaoAnterior: `Código: ${anterior.codigo}`,
      novaInformacao: "Removido",
    });
  }
}

export function vincularEmpresaAoGrupo(grupoId: string, empresaId: string) {
  const atuais = getStoredGrupos();
  const grupo = atuais.find((g) => g.id === grupoId);
  const novaLista = atuais.map((g) => {
    const empresaIdsFiltrados = g.empresaIds.filter((eId) => eId !== empresaId);
    if (g.id === grupoId) {
      return { ...g, empresaIds: [...empresaIdsFiltrados, empresaId] };
    }
    return { ...g, empresaIds: empresaIdsFiltrados };
  });
  saveGrupos(novaLista);

  if (grupo) {
    registrarAuditoria({
      operacao: "Vinculação de Empresa a Grupo",
      grupoAfetado: grupo.nome,
      registroId: empresaId,
      novaInformacao: `Empresa ${empresaId} vinculada ao grupo ${grupo.nome}`,
    });
  }
}

export function desvincularEmpresaDoGrupo(grupoId: string, empresaId: string) {
  const atuais = getStoredGrupos();
  const grupo = atuais.find((g) => g.id === grupoId);
  const novaLista = atuais.map((g) => {
    if (g.id === grupoId) {
      return { ...g, empresaIds: g.empresaIds.filter((eId) => eId !== empresaId) };
    }
    return g;
  });
  saveGrupos(novaLista);

  if (grupo) {
    registrarAuditoria({
      operacao: "Desvinculação de Empresa de Grupo",
      grupoAfetado: grupo.nome,
      registroId: empresaId,
      informacaoAnterior: `Empresa ${empresaId} no grupo ${grupo.nome}`,
      novaInformacao: "Desvinculada",
    });
  }
}

export function useGrupos() {
  const [grupos, setGrupos] = useState<GrupoEmpresarial[]>([]);

  useEffect(() => {
    setGrupos(getStoredGrupos());

    const handleChange = () => {
      setGrupos(getStoredGrupos());
    };

    window.addEventListener(EVENT_NAME, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return {
    grupos,
    addGrupo,
    updateGrupo,
    removeGrupo,
    vincularEmpresaAoGrupo,
    desvincularEmpresaDoGrupo,
  };
}
