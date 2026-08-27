import { useState, useEffect } from "react";

export type Analista = {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  status: "ativo" | "inativo";
  carteiraId?: string | undefined;
  assistenteId?: string | undefined;
  fotoUrl?: string | undefined;
};

export type Supervisor = {
  id: string;
  nome: string;
  email: string;
  departamento: string;
  carteiraIds?: string[] | undefined;
  status: "ativo" | "inativo";
  fotoUrl?: string | undefined;
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
  fotoUrl?: string | undefined;
};

const STORAGE_KEYS = {
  ANALISTAS: "dp_control_analistas_v1",
  SUPERVISORES: "dp_control_supervisores_v1",
  CARTEIRAS: "dp_control_carteiras_v1",
  MEMBROS: "dp_control_membros_v1",
};

const EVENT_NAME = "cadastros-updated";

const initialAnalistas: Analista[] = [];

const initialSupervisores: Supervisor[] = [];

const initialCarteiras: Carteira[] = [];

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

// Vínculos entre analista → carteira → supervisor
export function resolverVinculoPorAnalista(nomeAnalista: string): {
  carteira?: string;
  supervisor?: string;
} {
  const analista = getAnalistas().find((a) => a.nome === nomeAnalista);
  if (!analista) return {};
  const carteira = getCarteiras().find((c) => c.id === analista.carteiraId);
  const supervisor = carteira
    ? getSupervisores().find((s) => (s.carteiraIds || []).includes(carteira.id))
    : undefined;
  return {
    ...(carteira ? { carteira: carteira.nome } : {}),
    ...(supervisor ? { supervisor: supervisor.nome } : {}),
  };
}

export function resolverSupervisorPorCarteira(nomeCarteira: string): string | undefined {
  const carteira = getCarteiras().find((c) => c.nome === nomeCarteira);
  if (!carteira) return undefined;
  return getSupervisores().find((s) => (s.carteiraIds || []).includes(carteira.id))?.nome;
}

export function resolverAnalistaPorCarteira(nomeCarteira: string): string | undefined {
  const carteira = getCarteiras().find((c) => c.nome === nomeCarteira);
  if (!carteira) return undefined;
  return getAnalistas().find((a) => a.carteiraId === carteira.id)?.nome;
}

// Sincronização: cria carteiras, analistas e supervisores a partir das empresas já cadastradas
function norm(v: string) {
  return (v || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

const IGNORAR = ["", "sistema", "nao informado", "não informado", "-", "n/a"];

export function sincronizarCadastrosComEmpresas(
  empresas: { carteira?: string; analista?: string; supervisor?: string }[],
): { carteiras: number; analistas: number; supervisores: number } {
  let carteiras = [...getCarteiras()];
  let analistas = [...getAnalistas()];
  let supervisores = [...getSupervisores()];

  let novasCarteiras = 0;
  let novosAnalistas = 0;
  let novosSupervisores = 0;

  const acharCarteira = (nome: string) => carteiras.find((c) => norm(c.nome) === norm(nome));

  for (const emp of empresas) {
    const nomeCarteira = (emp.carteira || "").trim();
    let carteira = nomeCarteira && !IGNORAR.includes(norm(nomeCarteira)) ? acharCarteira(nomeCarteira) : undefined;

    if (nomeCarteira && !IGNORAR.includes(norm(nomeCarteira)) && !carteira) {
      carteira = {
        id: `carteira-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        nome: nomeCarteira,
        descricao: "Carteira identificada a partir das empresas cadastradas.",
        categoria: "Operacional",
      };
      carteiras.push(carteira);
      novasCarteiras++;
    }

    const nomeAnalista = (emp.analista || "").trim();
    if (nomeAnalista && !IGNORAR.includes(norm(nomeAnalista))) {
      const existente = analistas.find((a) => norm(a.nome) === norm(nomeAnalista));
      if (!existente) {
        analistas.push({
          id: `analista-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          nome: nomeAnalista,
          email: "",
          cargo: "Analista",
          status: "ativo",
          carteiraId: carteira?.id,
        });
        novosAnalistas++;
      } else if (!existente.carteiraId && carteira) {
        existente.carteiraId = carteira.id;
      }
    }

    const nomeSupervisor = (emp.supervisor || "").trim();
    if (nomeSupervisor && !IGNORAR.includes(norm(nomeSupervisor))) {
      const existente = supervisores.find((s) => norm(s.nome) === norm(nomeSupervisor));
      if (!existente) {
        supervisores.push({
          id: `supervisor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          nome: nomeSupervisor,
          email: "",
          departamento: "",
          carteiraIds: carteira ? [carteira.id] : [],
          status: "ativo",
        });
        novosSupervisores++;
      } else if (carteira) {
        const ids = existente.carteiraIds || [];
        if (!ids.includes(carteira.id)) existente.carteiraIds = [...ids, carteira.id];
      }
    }
  }

  if (novasCarteiras) saveStored(STORAGE_KEYS.CARTEIRAS, carteiras);
  saveStored(STORAGE_KEYS.ANALISTAS, analistas);
  saveStored(STORAGE_KEYS.SUPERVISORES, supervisores);

  return { carteiras: novasCarteiras, analistas: novosAnalistas, supervisores: novosSupervisores };
}
