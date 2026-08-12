import { useState, useEffect } from "react";

export type Analista = {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  status: "ativo" | "inativo";
  carteiraId?: string | undefined;
  assistenteId?: string | undefined;
};

export type Supervisor = {
  id: string;
  nome: string;
  email: string;
  departamento: string;
  status: "ativo" | "inativo";
};

export type Carteira = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
};

// Tipo genérico para os novos cargos
export type Membro = {
  id: string;
  nome: string;
  email: string;
  cargo: string; // categoria do cargo (Gerente, Auditoria, etc.)
  nivel?: string | undefined; // nivel dentro do cargo (opcional)
  status: "ativo" | "inativo";
};

const STORAGE_KEYS = {
  ANALISTAS: "dp_control_analistas_v1",
  SUPERVISORES: "dp_control_supervisores_v1",
  CARTEIRAS: "dp_control_carteiras_v1",
  MEMBROS: "dp_control_membros_v1",
};

const EVENT_NAME = "cadastros-updated";

const initialAnalistas: Analista[] = [
  { id: "analista-1", nome: "Camila Rocha", email: "camila.rocha@dpcontrol.com.br", cargo: "Analista Sênior", status: "ativo" },
  { id: "analista-2", nome: "Diego Menezes", email: "diego.menezes@dpcontrol.com.br", cargo: "Analista Pleno", status: "ativo" },
  { id: "analista-3", nome: "Tatiane Lopes", email: "tatiane.lopes@dpcontrol.com.br", cargo: "Analista Pleno", status: "ativo" },
  { id: "analista-4", nome: "Rafael Prado", email: "rafael.prado@dpcontrol.com.br", cargo: "Analista Jr.", status: "ativo" },
  { id: "analista-5", nome: "Juliana Reis", email: "juliana.reis@dpcontrol.com.br", cargo: "Analista Sênior", status: "ativo" },
];

const initialSupervisores: Supervisor[] = [
  { id: "supervisor-1", nome: "Paulo Serra", email: "paulo.serra@dpcontrol.com.br", departamento: "Operações DP", status: "ativo" },
  { id: "supervisor-2", nome: "Ana Beatriz", email: "ana.beatriz@dpcontrol.com.br", departamento: "Gestão & Qualidade", status: "ativo" },
];

const initialCarteiras: Carteira[] = [
  { id: "carteira-1", nome: "Carteira Industrial A", descricao: "Empresas do setor de manufatura, metalurgia e grandes indústrias", categoria: "Industrial" },
  { id: "carteira-2", nome: "Carteira Varejo", descricao: "Supermercados, lojas e redes varejistas", categoria: "Varejo" },
  { id: "carteira-3", nome: "Carteira Logística", descricao: "Transportadoras, armazéns e empresas de distribuição", categoria: "Logística" },
  { id: "carteira-4", nome: "Carteira Saúde", descricao: "Clínicas, laboratórios e prestadores de saúde", categoria: "Saúde" },
  { id: "carteira-5", nome: "Carteira Construção", descricao: "Construtoras e empreiteiras", categoria: "Construção" },
  { id: "carteira-6", nome: "Carteira Serviços", descricao: "Empresas de tecnologia, consultoria e serviços gerais", categoria: "Serviços" },
];

const initialMembros: Membro[] = [];

// Helper de Leitura
function getStored<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Erro ao ler ${key} do localStorage:`, error);
    return fallback;
  }
}

function saveStored<T>(key: string, data: T[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
  }
}

// APIs para Analistas
export function getAnalistas(): Analista[] {
  return getStored(STORAGE_KEYS.ANALISTAS, initialAnalistas);
}

export function addAnalista(dados: Omit<Analista, "id">): Analista {
  const id = `analista-${Date.now().toString(36)}`;
  const novo: Analista = { ...dados, id };
  const atuais = getAnalistas();
  saveStored(STORAGE_KEYS.ANALISTAS, [...atuais, novo]);
  return novo;
}

export function removeAnalista(id: string) {
  const atuais = getAnalistas();
  saveStored(STORAGE_KEYS.ANALISTAS, atuais.filter((a) => a.id !== id));
}

export function updateAnalista(id: string, dados: Partial<Omit<Analista, "id">>) {
  const atuais = getAnalistas();
  saveStored(
    STORAGE_KEYS.ANALISTAS,
    atuais.map((a) => (a.id === id ? { ...a, ...dados } : a))
  );
}

// APIs para Supervisores
export function getSupervisores(): Supervisor[] {
  return getStored(STORAGE_KEYS.SUPERVISORES, initialSupervisores);
}

export function addSupervisor(dados: Omit<Supervisor, "id">): Supervisor {
  const id = `supervisor-${Date.now().toString(36)}`;
  const novo: Supervisor = { ...dados, id };
  const atuais = getSupervisores();
  saveStored(STORAGE_KEYS.SUPERVISORES, [...atuais, novo]);
  return novo;
}

export function removeSupervisor(id: string) {
  const atuais = getSupervisores();
  saveStored(STORAGE_KEYS.SUPERVISORES, atuais.filter((s) => s.id !== id));
}

export function updateSupervisor(id: string, dados: Partial<Omit<Supervisor, "id">>) {
  const atuais = getSupervisores();
  saveStored(
    STORAGE_KEYS.SUPERVISORES,
    atuais.map((s) => (s.id === id ? { ...s, ...dados } : s))
  );
}

// APIs para Carteiras
export function getCarteiras(): Carteira[] {
  return getStored(STORAGE_KEYS.CARTEIRAS, initialCarteiras);
}

export function addCarteira(dados: Omit<Carteira, "id">): Carteira {
  const id = `carteira-${Date.now().toString(36)}`;
  const novo: Carteira = { ...dados, id };
  const atuais = getCarteiras();
  saveStored(STORAGE_KEYS.CARTEIRAS, [...atuais, novo]);
  return novo;
}

export function removeCarteira(id: string) {
  const atuais = getCarteiras();
  saveStored(STORAGE_KEYS.CARTEIRAS, atuais.filter((c) => c.id !== id));
}

export function updateCarteira(id: string, dados: Partial<Omit<Carteira, "id">>) {
  const atuais = getCarteiras();
  saveStored(
    STORAGE_KEYS.CARTEIRAS,
    atuais.map((c) => (c.id === id ? { ...c, ...dados } : c))
  );
}

// APIs para Membros (novos cargos)
export function getMembros(): Membro[] {
  return getStored(STORAGE_KEYS.MEMBROS, initialMembros);
}

export function addMembro(dados: Omit<Membro, "id">): Membro {
  const id = `membro-${Date.now().toString(36)}`;
  const novo: Membro = { ...dados, id };
  const atuais = getMembros();
  saveStored(STORAGE_KEYS.MEMBROS, [...atuais, novo]);
  return novo;
}

export function removeMembro(id: string) {
  const atuais = getMembros();
  saveStored(STORAGE_KEYS.MEMBROS, atuais.filter((m) => m.id !== id));
}

export function updateMembro(id: string, dados: Partial<Omit<Membro, "id">>) {
  const atuais = getMembros();
  saveStored(
    STORAGE_KEYS.MEMBROS,
    atuais.map((m) => (m.id === id ? { ...m, ...dados } : m))
  );
}

// Hook React Unificado
export function useCadastros() {
  const [analistas, setAnalistas] = useState<Analista[]>([]);
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);

  const loadAll = () => {
    setAnalistas(getAnalistas());
    setSupervisores(getSupervisores());
    setCarteiras(getCarteiras());
    setMembros(getMembros());
  };

  useEffect(() => {
    loadAll();

    const handleChange = () => {
      loadAll();
    };

    window.addEventListener(EVENT_NAME, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return {
    analistas,
    supervisores,
    carteiras,
    membros,
    addAnalista,
    removeAnalista,
    updateAnalista,
    addSupervisor,
    removeSupervisor,
    updateSupervisor,
    addCarteira,
    removeCarteira,
    updateCarteira,
    addMembro,
    removeMembro,
    updateMembro,
  };
}
