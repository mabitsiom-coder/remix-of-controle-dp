import { useState, useEffect } from "react";

import { getSupabase } from "@/lib/supabase-browser";
import {
  criarUsuario as criarUsuarioFn,
  atualizarUsuario as atualizarUsuarioFn,
  removerUsuario as removerUsuarioFn,
  registrarPrimeiroAdmin as registrarPrimeiroAdminFn,
} from "./usuarios.functions";

export type PerfilAcesso = "Administrador" | "Gerente" | "Supervisor" | "Coordenador" | "Analista";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  /** Nunca é lida do banco — usada apenas nos formulários de senha. */
  senha?: string;
  perfil: PerfilAcesso;
  departamento: string;
  status: "ativo" | "inativo";
  criadoEm: string;
};

const CACHE_USERS = "dp_control_usuarios_cache_v2";
const CACHE_CURRENT = "dp_control_current_user_cache_v2";
const EVENT_NAME = "auth-state-changed";

const usuarioVazio: Usuario = {
  id: "",
  nome: "Visitante",
  email: "",
  perfil: "Analista",
  departamento: "",
  status: "ativo",
  criadoEm: "",
};

function formatarData(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
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

export function getStoredUsers(): Usuario[] {
  return lerCache<Usuario[]>(CACHE_USERS, []);
}

export function getCurrentUser(): Usuario {
  return lerCache<Usuario>(CACHE_CURRENT, usuarioVazio);
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
    .select("id,nome,email,perfil,departamento,status,created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Falha ao carregar usuários:", error.message);
    return { atual: getCurrentUser(), lista: getStoredUsers() };
  }

  type Linha = {
    id: string;
    nome: string;
    email: string;
    perfil: string;
    departamento: string;
    status: string;
    created_at: string;
  };

  const lista: Usuario[] = ((data ?? []) as Linha[]).map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    perfil: u.perfil as PerfilAcesso,
    departamento: u.departamento,
    status: (u.status === "inativo" ? "inativo" : "ativo") as "ativo" | "inativo",
    criadoEm: formatarData(u.created_at),
  }));

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

  const { atual } = await recarregarUsuarios();
  if (atual.status === "inativo") {
    await getSupabase().auth.signOut();
    throw new Error("Este usuário está inativo no sistema.");
  }
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
  await criarUsuarioFn({
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
  return lista.find((u) => u.email.toLowerCase() === dados.email.trim().toLowerCase())!;
}

export async function updateUsuario(id: string, novosDados: Partial<Usuario>) {
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
  const { lista } = await recarregarUsuarios();
  return lista.find((u) => u.id === id);
}

export async function removeUsuario(id: string) {
  await removerUsuarioFn({ data: { id } });
  await recarregarUsuarios();
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

  return {
    currentUser,
    usuarios,
    autenticado: Boolean(currentUser.id),
    isAdmin: currentUser.perfil === "Administrador",
    isGestao: ["Administrador", "Gerente", "Coordenador", "Supervisor"].includes(currentUser.perfil),
    isSupervisor: ["Supervisor", "Gerente", "Administrador"].includes(currentUser.perfil),
    isCoordenador: ["Coordenador", "Gerente", "Administrador"].includes(currentUser.perfil),
    login: loginUser,
    logout: logoutUser,
    addUsuario,
    updateUsuario,
    removeUsuario,
  };
}
