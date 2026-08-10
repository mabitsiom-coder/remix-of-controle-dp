import { useState, useEffect } from "react";

export type PerfilAcesso = "Administrador" | "Supervisor" | "Coordenador" | "Analista";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilAcesso;
  departamento: string;
  status: "ativo" | "inativo";
  criadoEm: string;
};

const USERS_STORAGE_KEY = "dp_control_usuarios_v1";
const CURRENT_USER_KEY = "dp_control_current_user_v1";
const EVENT_NAME = "auth-state-changed";

const initialUsers: Usuario[] = [
  {
    id: "usr-admin-1",
    nome: "Administrador Mabit",
    email: "auditoria@mabitcontabilidade.com.br",
    senha: "123456",
    perfil: "Administrador",
    departamento: "Diretoria & Tecnologia",
    status: "ativo",
    criadoEm: "01/01/2026",
  },
  {
    id: "usr-supervisor-1",
    nome: "Paulo Serra",
    email: "paulo.serra@dpcontrol.com.br",
    senha: "123456",
    perfil: "Supervisor",
    departamento: "Supervisão DP",
    status: "ativo",
    criadoEm: "15/01/2026",
  },
  {
    id: "usr-coordenador-1",
    nome: "Ana Beatriz",
    email: "ana.beatriz@dpcontrol.com.br",
    senha: "123456",
    perfil: "Coordenador",
    departamento: "Coordenação Operacional",
    status: "ativo",
    criadoEm: "20/01/2026",
  },
  {
    id: "usr-analista-1",
    nome: "Camila Rocha",
    email: "camila.rocha@dpcontrol.com.br",
    senha: "123456",
    perfil: "Analista",
    departamento: "Operações DP",
    status: "ativo",
    criadoEm: "01/02/2026",
  },
];

export function getStoredUsers(): Usuario[] {
  if (typeof window === "undefined") return initialUsers;
  try {
    const item = localStorage.getItem(USERS_STORAGE_KEY);
    if (!item) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error("Erro ao carregar usuários do localStorage:", error);
    return initialUsers;
  }
}

export function saveStoredUsers(users: Usuario[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (error) {
    console.error("Erro ao salvar usuários no localStorage:", error);
  }
}

export function getCurrentUser(): Usuario {
  if (typeof window === "undefined") return initialUsers[0]!;
  try {
    const item = localStorage.getItem(CURRENT_USER_KEY);
    if (!item) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(initialUsers[0]!));
      return initialUsers[0]!;
    }
    return JSON.parse(item);
  } catch (error) {
    return initialUsers[0]!;
  }
}

export function setCurrentUser(user: Usuario) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (error) {
    console.error("Erro ao salvar usuário atual:", error);
  }
}

export function loginUser(email: string, senha: string): Usuario {
  const users = getStoredUsers();
  const found = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.senha === senha,
  );
  if (!found) {
    throw new Error("E-mail ou senha incorretos.");
  }
  if (found.status === "inativo") {
    throw new Error("Este usuário está inativo no sistema.");
  }
  setCurrentUser(found);
  return found;
}

export function addUsuario(dados: Omit<Usuario, "id" | "criadoEm">): Usuario {
  const hoje = new Date();
  const dataFormatada = `${String(hoje.getDate()).padStart(2, "0")}/${String(
    hoje.getMonth() + 1,
  ).padStart(2, "0")}/${hoje.getFullYear()}`;

  const id = `usr-${Date.now().toString(36)}`;
  const novo: Usuario = {
    ...dados,
    id,
    criadoEm: dataFormatada,
  };

  const atuais = getStoredUsers();
  saveStoredUsers([...atuais, novo]);
  return novo;
}

export function updateUsuario(id: string, novosDados: Partial<Usuario>): Usuario | undefined {
  const atuais = getStoredUsers();
  let atualizado: Usuario | undefined;

  const novaLista = atuais.map((u) => {
    if (u.id === id) {
      atualizado = { ...u, ...novosDados };
      return atualizado;
    }
    return u;
  });

  if (atualizado) {
    saveStoredUsers(novaLista);
    const atual = getCurrentUser();
    if (atual.id === id) {
      setCurrentUser(atualizado);
    }
  }

  return atualizado;
}

export function removeUsuario(id: string) {
  const atuais = getStoredUsers();
  if (atuais.length <= 1) {
    throw new Error("Não é possível remover o único usuário do sistema.");
  }
  const novaLista = atuais.filter((u) => u.id !== id);
  saveStoredUsers(novaLista);

  const atual = getCurrentUser();
  if (atual.id === id) {
    setCurrentUser(novaLista[0]!);
  }
}

export function useAuth() {
  const [currentUser, setCurrUser] = useState<Usuario>(initialUsers[0]!);
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsers);

  const refreshState = () => {
    setCurrUser(getCurrentUser());
    setUsuarios(getStoredUsers());
  };

  useEffect(() => {
    refreshState();

    const handleChange = () => {
      refreshState();
    };

    window.addEventListener(EVENT_NAME, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return {
    currentUser,
    usuarios,
    isAdmin: currentUser.perfil === "Administrador",
    isSupervisor: currentUser.perfil === "Supervisor" || currentUser.perfil === "Administrador",
    isCoordenador: currentUser.perfil === "Coordenador" || currentUser.perfil === "Administrador",
    login: loginUser,
    switchUser: setCurrentUser,
    addUsuario,
    updateUsuario,
    removeUsuario,
  };
}
