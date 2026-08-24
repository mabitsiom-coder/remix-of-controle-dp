import { useState, useEffect } from "react";

import { getSupabase } from "@/lib/supabase-browser";
import {
  criarUsuario as criarUsuarioFn,
  atualizarUsuario as atualizarUsuarioFn,
  removerUsuario as removerUsuarioFn,
  registrarPrimeiroAdmin as registrarPrimeiroAdminFn,
} from "./usuarios.functions";
import { registrarAuditoria } from "./auditoria-store";

export type PerfilAcesso =
  | "Analista"
  | "CS"
  | "Supervisor"
  | "Gerente"
  | "Auditoria"
  | "Coordenação"
  | "Administração"
  | "CKO"
  | "Administrador" // Alias
  | "Coordenador";  // Alias

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  /** Nunca é lida do banco — usada apenas nos formulários de senha. */
  senha?: string | undefined;
  cargo: string;
  perfil: PerfilAcesso;
  departamento: string;
  grupoTrabalho?: string | undefined;
  carteira?: string | undefined;
  carteirasPermitidas?: string[] | undefined;
  fotoUrl?: string | undefined;
  status: "ativo" | "inativo";
  ultimoAcesso?: string | undefined;
  criadoEm: string;
};

const CACHE_USERS = "dp_control_usuarios_cache_v3";
const CACHE_CURRENT = "dp_control_current_user_cache_v3";
const EVENT_NAME = "auth-state-changed";

const usuarioVazio: Usuario = {
  id: "",
  nome: "Visitante",
  email: "",
  cargo: "Analista",
  perfil: "Analista",
  departamento: "Departamento Pessoal",
  status: "ativo",
  criadoEm: "",
};

function formatarData(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function dataHoraAtual() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function lerCache<T>(chave: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : fallback;
  } catch {
    return fallback;
  }
}

function gravarCache(chave: string, valor: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* ignora */
  }
}

const initialDefaultUsers: Usuario[] = [
  {
    id: "usr-admin-01",
    nome: "Administrador do Sistema",
    email: "admin@dpcontrol.com.br",
    cargo: "Diretor de DP / CKO",
    perfil: "Administração",
    departamento: "Diretoria",
    status: "ativo",
    criadoEm: "01/01/2026",
    ultimoAcesso: "Hoje",
  },
  {
    id: "usr-coord-01",
    nome: "Coordenação Geral",
    email: "coordenacao@dpcontrol.com.br",
    cargo: "Coordenador de DP",
    perfil: "Coordenação",
    departamento: "Coordenação Operacional",
    status: "ativo",
    criadoEm: "01/01/2026",
    ultimoAcesso: "Hoje",
  },
  {
    id: "usr-sup-01",
    nome: "Supervisor Operacional",
    email: "supervisor@dpcontrol.com.br",
    cargo: "Supervisor de Atendimento",
    perfil: "Supervisor",
    departamento: "Supervisão",
    carteirasPermitidas: ["RH-G-01", "RH-G-02", "RH-G-03"],
    status: "ativo",
    criadoEm: "05/01/2026",
    ultimoAcesso: "Hoje",
  },
  {
    id: "usr-ana-01",
    nome: "Ariany",
    email: "ariany@dpcontrol.com.br",
    cargo: "Analista de DP",
    perfil: "Analista",
    departamento: "Operações DP",
    carteira: "RH-G-01",
    carteirasPermitidas: ["RH-G-01"],
    status: "ativo",
    criadoEm: "10/01/2026",
    ultimoAcesso: "Hoje",
  },
  {
    id: "usr-ana-02",
    nome: "Gleisi",
    email: "gleisi@dpcontrol.com.br",
    cargo: "Analista de DP",
    perfil: "Analista",
    departamento: "Operações DP",
    carteira: "RH-G-02",
    carteirasPermitidas: ["RH-G-02"],
    status: "ativo",
    criadoEm: "10/01/2026",
    ultimoAcesso: "Hoje",
  },
  {
    id: "usr-ana-03",
    nome: "Gabriel",
    email: "gabriel@dpcontrol.com.br",
    cargo: "Analista de DP",
    perfil: "Analista",
    departamento: "Operações DP",
    carteira: "RH-G-03",
    carteirasPermitidas: ["RH-G-03"],
    status: "ativo",
    criadoEm: "10/01/2026",
    ultimoAcesso: "Hoje",
  },
  {
    id: "usr-ana-04",
    nome: "Roberta",
    email: "roberta@dpcontrol.com.br",
    cargo: "Analista de DP",
    perfil: "Analista",
    departamento: "Operações DP",
    carteira: "RH-G-04",
    carteirasPermitidas: ["RH-G-04"],
    status: "ativo",
    criadoEm: "10/01/2026",
    ultimoAcesso: "Hoje",
  },
  {
    id: "usr-ana-05",
    nome: "Vitória",
    email: "vitoria@dpcontrol.com.br",
    cargo: "Analista de DP",
    perfil: "Analista",
    departamento: "Operações DP",
    carteira: "RH-G-05",
    carteirasPermitidas: ["RH-G-05"],
    status: "ativo",
    criadoEm: "10/01/2026",
    ultimoAcesso: "Hoje",
  },
  {
    id: "usr-ana-06",
    nome: "Simeane",
    email: "simeane@dpcontrol.com.br",
    cargo: "Analista de DP",
    perfil: "Analista",
    departamento: "Operações DP",
    carteira: "RH-G-06",
    carteirasPermitidas: ["RH-G-06"],
    status: "ativo",
    criadoEm: "10/01/2026",
    ultimoAcesso: "Hoje",
  },
];

const MAPA_CARTEIRAS_ANALISTAS: Record<string, string> = {
  ariany: "RH-G-01",
  gleisi: "RH-G-02",
  gabriel: "RH-G-03",
  roberta: "RH-G-04",
  vitoria: "RH-G-05",
  vitória: "RH-G-05",
  simeane: "RH-G-06",
};

export function getStoredUsers(): Usuario[] {
  const usuarios = lerCache<Usuario[]>(CACHE_USERS, initialDefaultUsers);
  if (!usuarios || usuarios.length === 0) return initialDefaultUsers;

  // Corrige analistas que porventura estejam sem carteira definida
  return usuarios.map((u) => {
    const perfilNorm = normalizarNomePerfil(u.perfil);
    if ((perfilNorm === "Analista" || perfilNorm === "CS") && (!u.carteira || u.carteira === "none")) {
      const primeiroNome = (u.nome.split(" ")[0] ?? "").toLowerCase();
      const carteiraAtribuida = MAPA_CARTEIRAS_ANALISTAS[primeiroNome] || "RH-G-01";
      return {
        ...u,
        carteira: carteiraAtribuida,
        carteirasPermitidas: [carteiraAtribuida],
      };
    }
    return u;
  });
}

export function getCurrentUser(): Usuario {
  const padrao = initialDefaultUsers[0] as Usuario;
  const cur = lerCache<Usuario>(CACHE_CURRENT, padrao);
  if (!cur || !cur.id) return padrao;
  const perfilNorm = normalizarNomePerfil(cur.perfil);
  if ((perfilNorm === "Analista" || perfilNorm === "CS") && (!cur.carteira || cur.carteira === "none")) {
    const primeiroNome = (cur.nome.split(" ")[0] ?? "").toLowerCase();
    const carteiraAtribuida = MAPA_CARTEIRAS_ANALISTAS[primeiroNome] || "RH-G-01";
    return {
      ...cur,
      carteira: carteiraAtribuida,
      carteirasPermitidas: [carteiraAtribuida],
    };
  }
  return cur;
}

/** Normaliza perfis para a nomenclatura padronizada */
export function normalizarNomePerfil(p: string): PerfilAcesso {
  if (p === "Administrador") return "Administração";
  if (p === "Coordenador") return "Coordenação";
  return (p as PerfilAcesso) || "Analista";
}

/** Recarrega o usuário logado e a lista de usuários direto do banco. */
export async function recarregarUsuarios(): Promise<{ atual: Usuario; lista: Usuario[] }> {
  const { data: sessao } = await getSupabase().auth.getSession();
  const uid = sessao.session?.user.id;

  if (!uid) {
    gravarCache(CACHE_CURRENT, usuarioVazio);
    gravarCache(CACHE_USERS, []);
    return { atual: usuarioVazio, lista: [] };
  }

  const { data, error } = await getSupabase()
    .from("usuarios")
    .select("*")
    .order("created_at", { ascending: true });

  const usuariosLocais = getStoredUsers();

  if (error) {
    console.error("Falha ao carregar usuários:", error.message);
    return { atual: getCurrentUser(), lista: usuariosLocais };
  }

  type Linha = {
    id: string;
    nome: string;
    email: string;
    perfil: string;
    departamento: string;
    status: string;
    cargo?: string;
    grupo_trabalho?: string;
    carteira?: string;
    carteiras_permitidas?: string[];
    foto_url?: string;
    created_at: string;
    updated_at?: string;
  };

  const lista: Usuario[] = ((data ?? []) as Linha[]).map((u) => {
    const local = usuariosLocais.find((loc) => loc.id === u.id || loc.email.toLowerCase() === u.email.toLowerCase());
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      cargo: u.cargo || local?.cargo || u.departamento || "Analista DP",
      perfil: normalizarNomePerfil(u.perfil),
      departamento: u.departamento,
      grupoTrabalho: u.grupo_trabalho || local?.grupoTrabalho || "",
      carteira: u.carteira || local?.carteira || "",
      carteirasPermitidas: u.carteiras_permitidas || local?.carteirasPermitidas || [],
      fotoUrl: u.foto_url || local?.fotoUrl,
      status: (u.status === "inativo" ? "inativo" : "ativo") as "ativo" | "inativo",
      ultimoAcesso: local?.ultimoAcesso || formatarData(u.updated_at || u.created_at),
      criadoEm: formatarData(u.created_at),
    };
  });

  const atual = lista.find((u) => u.id === uid) ?? usuarioVazio;
  gravarCache(CACHE_USERS, lista);
  gravarCache(CACHE_CURRENT, atual);
  return { atual, lista };
}

export async function loginUser(email: string, senha: string): Promise<Usuario> {
  const { error } = await getSupabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });
  if (error) throw new Error("E-mail ou senha incorretos.");

  const { atual, lista } = await recarregarUsuarios();
  if (atual.status === "inativo") {
    await getSupabase().auth.signOut();
    throw new Error("Este usuário está inativo no sistema.");
  }

  // Atualiza último acesso
  const agora = dataHoraAtual();
  atual.ultimoAcesso = agora;
  gravarCache(CACHE_CURRENT, atual);
  gravarCache(
    CACHE_USERS,
    lista.map((u) => (u.id === atual.id ? { ...u, ultimoAcesso: agora } : u)),
  );

  return atual;
}

export async function logoutUser() {
  await getSupabase().auth.signOut();
  gravarCache(CACHE_CURRENT, usuarioVazio);
  gravarCache(CACHE_USERS, []);
}

export async function registrarPrimeiroAdmin(nome: string, email: string, senha: string) {
  await registrarPrimeiroAdminFn({ data: { nome, email: email.trim().toLowerCase(), senha } });
  return loginUser(email, senha);
}

export async function addUsuario(
  dados: Omit<Usuario, "id" | "criadoEm"> & { senha?: string },
): Promise<Usuario> {
  const resp = await criarUsuarioFn({
    data: {
      nome: dados.nome,
      email: dados.email.trim().toLowerCase(),
      senha: dados.senha && dados.senha.length >= 6 ? dados.senha : "123456",
      perfil: dados.perfil,
      departamento: dados.departamento,
      status: dados.status,
    },
  });

  const { lista } = await recarregarUsuarios();
  let criado = lista.find((u) => u.email.toLowerCase() === dados.email.trim().toLowerCase())!;

  if (!criado) {
    criado = {
      id: resp.id,
      nome: dados.nome,
      email: dados.email.trim().toLowerCase(),
      cargo: dados.cargo || "Analista",
      perfil: dados.perfil,
      departamento: dados.departamento,
      grupoTrabalho: dados.grupoTrabalho || "",
      carteira: dados.carteira || "",
      carteirasPermitidas: dados.carteirasPermitidas || [],
      fotoUrl: dados.fotoUrl,
      status: dados.status,
      criadoEm: formatarData(new Date().toISOString()),
    };
  } else {
    criado = {
      ...criado,
      cargo: dados.cargo || criado.cargo,
      grupoTrabalho: dados.grupoTrabalho || criado.grupoTrabalho,
      carteira: dados.carteira || criado.carteira,
      carteirasPermitidas: dados.carteirasPermitidas || criado.carteirasPermitidas,
      fotoUrl: dados.fotoUrl || criado.fotoUrl,
    };
  }

  const atualizados = [...lista.filter((u) => u.id !== criado.id), criado];
  gravarCache(CACHE_USERS, atualizados);

  registrarAuditoria({
    operacao: "Criação de Usuário",
    usuarioNome: getCurrentUser().nome,
    usuarioId: getCurrentUser().id,
    perfil: getCurrentUser().perfil,
    informacaoAnterior: "Nenhum",
    novaInformacao: `${criado.nome} (${criado.email}) - Perfil: ${criado.perfil}`,
    registroId: criado.id,
    detalhes: `Cargo: ${criado.cargo} | Grupo: ${criado.grupoTrabalho || "Geral"} | Carteira: ${criado.carteira || "Todas"}`,
  });

  return criado;
}

export async function updateUsuario(id: string, novosDados: Partial<Usuario>) {
  const atuais = getStoredUsers();
  const anterior = atuais.find((u) => u.id === id);

  await atualizarUsuarioFn({
    data: {
      id,
      ...(novosDados.nome !== undefined ? { nome: novosDados.nome } : {}),
      ...(novosDados.email !== undefined ? { email: novosDados.email.trim().toLowerCase() } : {}),
      ...(novosDados.senha && novosDados.senha.length >= 6 ? { senha: novosDados.senha } : {}),
      ...(novosDados.perfil !== undefined ? { perfil: novosDados.perfil } : {}),
      ...(novosDados.departamento !== undefined ? { departamento: novosDados.departamento } : {}),
      ...(novosDados.status !== undefined ? { status: novosDados.status } : {}),
    },
  });

  await recarregarUsuarios();
  const atualizados = getStoredUsers().map((u) => {
    if (u.id === id) {
      return { ...u, ...novosDados };
    }
    return u;
  });
  gravarCache(CACHE_USERS, atualizados);

  const cur = getCurrentUser();
  if (cur.id === id) {
    gravarCache(CACHE_CURRENT, { ...cur, ...novosDados });
  }

  if (anterior) {
    registrarAuditoria({
      operacao: "Edição de Usuário",
      usuarioNome: cur.nome,
      usuarioId: cur.id,
      perfil: cur.perfil,
      informacaoAnterior: `Perfil: ${anterior.perfil} | Status: ${anterior.status} | Cargo: ${anterior.cargo}`,
      novaInformacao: `Perfil: ${novosDados.perfil ?? anterior.perfil} | Status: ${novosDados.status ?? anterior.status} | Cargo: ${novosDados.cargo ?? anterior.cargo}`,
      registroId: id,
      detalhes: `Usuário afetado: ${anterior.nome} (${anterior.email})`,
    });
  }

  return atualizados.find((u) => u.id === id);
}

export async function removeUsuario(id: string) {
  const atuais = getStoredUsers();
  const removido = atuais.find((u) => u.id === id);

  await removerUsuarioFn({ data: { id } });
  await recarregarUsuarios();

  if (removido) {
    registrarAuditoria({
      operacao: "Exclusão de Usuário",
      usuarioNome: getCurrentUser().nome,
      usuarioId: getCurrentUser().id,
      perfil: getCurrentUser().perfil,
      informacaoAnterior: `${removido.nome} (${removido.email}) - Perfil: ${removido.perfil}`,
      novaInformacao: "Removido do sistema",
      registroId: id,
    });
  }
}

export function useAuth() {
  const [currentUser, setCurrUser] = useState<Usuario>(usuarioVazio);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    const refreshState = () => {
      setCurrUser(getCurrentUser());
      setUsuarios(getStoredUsers());
    };
    refreshState();
    void recarregarUsuarios();

    window.addEventListener(EVENT_NAME, refreshState);
    window.addEventListener("storage", refreshState);
    return () => {
      window.removeEventListener(EVENT_NAME, refreshState);
      window.removeEventListener("storage", refreshState);
    };
  }, []);

  const perfilNorm = normalizarNomePerfil(currentUser.perfil);
  const isAdmin = ["Administração", "Administrador", "Coordenação", "Coordenador", "CKO"].includes(perfilNorm);
  const isNivel3 = isAdmin;
  const isGestao = ["Supervisor", "Gerente", "Auditoria", "Coordenação", "Administração", "CKO", "Administrador", "Coordenador"].includes(perfilNorm);
  const isSupervisor = ["Supervisor", "Gerente", "Coordenação", "Administração", "CKO"].includes(perfilNorm);
  const isAnalista = perfilNorm === "Analista" || perfilNorm === "CS";

  return {
    currentUser,
    usuarios,
    autenticado: Boolean(currentUser.id),
    isAdmin,
    isNivel3,
    isGestao,
    isSupervisor,
    isAnalista,
    hasFullAccess: isNivel3,
    login: loginUser,
    logout: logoutUser,
    addUsuario,
    updateUsuario,
    removeUsuario,
  };
}
