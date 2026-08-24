import type { PerfilAcesso, Usuario } from "@/lib/auth-store";
import type { Empresa } from "@/lib/mock-data";

/**
 * Níveis de Acesso:
 * Nível 1 — Operacional: Analista, CS
 * Nível 2 — Gestão: Supervisor, Gerente, Auditoria
 * Nível 3 — Administração: Coordenação, Administração, CKO
 */

export const PERFIS_OPERACIONAL: PerfilAcesso[] = ["Analista", "CS"];

export const PERFIS_GESTAO: PerfilAcesso[] = [
  "Supervisor",
  "Gerente",
  "Auditoria",
  "Coordenação",
  "Administração",
  "CKO",
  "Administrador", // Alias de compatibilidade
  "Coordenador",   // Alias de compatibilidade
];

export const PERFIS_GESTAO_OPERACIONAL: PerfilAcesso[] = [
  "Supervisor",
  "Gerente",
  "Auditoria",
];

export const PERFIS_ADMIN_TOTAL: PerfilAcesso[] = [
  "Coordenação",
  "Administração",
  "CKO",
  "Administrador", // Alias
  "Coordenador",   // Alias
];

export type AcaoPermissao =
  | "consultar_empresas"
  | "cadastrar_empresa"
  | "editar_dados_operacionais"
  | "excluir_empresa"
  | "criar_grupo"
  | "excluir_grupo"
  | "alterar_config_grupo"
  | "criar_carteira"
  | "alterar_carteira"
  | "excluir_carteira"
  | "transferir_empresa_carteira"
  | "alterar_responsaveis_grupo"
  | "gerenciar_usuarios"
  | "alterar_perfil_permissoes"
  | "configuracoes_administrativas"
  | "acesso_total";

export type DefinicaoPermissao = {
  nome: string;
  descricao: string;
  categoria: "Empresas" | "Grupos" | "Carteiras" | "Usuários" | "Sistema";
};

export const LISTA_ACOES: Record<AcaoPermissao, DefinicaoPermissao> = {
  consultar_empresas: {
    nome: "Consultar empresas autorizadas",
    descricao: "Visualiza empresas dentro do escopo permitido",
    categoria: "Empresas",
  },
  cadastrar_empresa: {
    nome: "Cadastrar empresa",
    descricao: "Inclusão de novos clientes e cadastros de empresas",
    categoria: "Empresas",
  },
  editar_dados_operacionais: {
    nome: "Editar dados operacionais",
    descricao: "Alterar dados de fechamento, rotinas e particularidades",
    categoria: "Empresas",
  },
  excluir_empresa: {
    nome: "Excluir empresa",
    descricao: "Exclusão lógica de empresas com confirmação de segurança",
    categoria: "Empresas",
  },
  criar_grupo: {
    nome: "Criar grupo empresarial",
    descricao: "Criação de novas holdings e grupos econômicos",
    categoria: "Grupos",
  },
  excluir_grupo: {
    nome: "Excluir grupo empresarial",
    descricao: "Exclusão de grupos e desvinculação em massa",
    categoria: "Grupos",
  },
  alterar_config_grupo: {
    nome: "Alterar configuração do grupo",
    descricao: "Editar descrições, parâmetros e vínculos de empresas ao grupo",
    categoria: "Grupos",
  },
  criar_carteira: {
    nome: "Criar carteira",
    descricao: "Criação de novas carteiras operacionais de atendimento",
    categoria: "Carteiras",
  },
  alterar_carteira: {
    nome: "Alterar carteira",
    descricao: "Modificar regras, capacidades e equipe da carteira",
    categoria: "Carteiras",
  },
  excluir_carteira: {
    nome: "Excluir carteira",
    descricao: "Remoção de carteira e remanejamento",
    categoria: "Carteiras",
  },
  transferir_empresa_carteira: {
    nome: "Transferir empresa de carteira",
    descricao: "Mover empresas entre carteiras de atendimento",
    categoria: "Carteiras",
  },
  alterar_responsaveis_grupo: {
    nome: "Alterar responsáveis do grupo / carteira",
    descricao: "Trocar analista ou supervisor responsável",
    categoria: "Grupos",
  },
  gerenciar_usuarios: {
    nome: "Gerenciar usuários",
    descricao: "Criar, editar, ativar/inativar usuários do sistema",
    categoria: "Usuários",
  },
  alterar_perfil_permissoes: {
    nome: "Alterar perfil e permissões",
    descricao: "Definir perfis de acesso e autorizações",
    categoria: "Usuários",
  },
  configuracoes_administrativas: {
    nome: "Configurações administrativas",
    descricao: "Acesso a cadastros mestres e integrações de API",
    categoria: "Sistema",
  },
  acesso_total: {
    nome: "Acesso total irrestrito",
    descricao: "Super-acesso a todas as funções e dados sem restrição",
    categoria: "Sistema",
  },
};

/** Matriz canônica de permissões por perfil */
export const MATRIZ_PERMISSOES: Record<AcaoPermissao, (perfil: PerfilAcesso) => boolean> = {
  consultar_empresas: () => true,
  cadastrar_empresa: (p) => isNivelAdmin(p),
  editar_dados_operacionais: () => true,
  excluir_empresa: (p) => isNivelAdmin(p),
  criar_grupo: (p) => isNivelAdmin(p),
  excluir_grupo: (p) => isNivelAdmin(p),
  alterar_config_grupo: (p) => isNivelGestao(p) || isNivelAdmin(p),
  criar_carteira: (p) => isNivelGestao(p) || isNivelAdmin(p),
  alterar_carteira: (p) => isNivelGestao(p) || isNivelAdmin(p),
  excluir_carteira: (p) => isNivelGestao(p) || isNivelAdmin(p),
  transferir_empresa_carteira: (p) => isNivelGestao(p) || isNivelAdmin(p),
  alterar_responsaveis_grupo: (p) => isNivelGestao(p) || isNivelAdmin(p),
  gerenciar_usuarios: (p) => isNivelAdmin(p),
  alterar_perfil_permissoes: (p) => isNivelAdmin(p),
  configuracoes_administrativas: (p) => isNivelAdmin(p),
  acesso_total: (p) => isNivelAdmin(p),
};

export function normalizarPerfil(perfil?: string | null): PerfilAcesso {
  if (!perfil) return "Analista";
  const p = perfil.trim();
  if (p === "Administrador") return "Administração";
  if (p === "Coordenador") return "Coordenação";
  return p as PerfilAcesso;
}

export function isNivelOperacional(perfil?: string | null): boolean {
  const norm = normalizarPerfil(perfil);
  return norm === "Analista" || norm === "CS";
}

export function isNivelGestao(perfil?: string | null): boolean {
  const norm = normalizarPerfil(perfil);
  return norm === "Supervisor" || norm === "Gerente" || norm === "Auditoria";
}

export function isNivelAdmin(perfil?: string | null): boolean {
  const norm = normalizarPerfil(perfil);
  return norm === "Coordenação" || norm === "Administração" || norm === "CKO";
}

export function isGestao(perfil?: string | null): boolean {
  return isNivelGestao(perfil) || isNivelAdmin(perfil);
}

export function hasFullAccess(perfilOrUser?: PerfilAcesso | Usuario | string | null): boolean {
  const perfil = typeof perfilOrUser === "object" && perfilOrUser !== null ? perfilOrUser.perfil : perfilOrUser;
  return isNivelAdmin(perfil);
}

export function hasPermission(perfilOrUser: PerfilAcesso | Usuario | string | null | undefined, acao: AcaoPermissao): boolean {
  const perfil = typeof perfilOrUser === "object" && perfilOrUser !== null ? perfilOrUser.perfil : (perfilOrUser ?? "Analista");
  const norm = normalizarPerfil(perfil);
  const check = MATRIZ_PERMISSOES[acao];
  return check ? check(norm) : false;
}

// Helpers de conveniência
export const canCreateCompany = (user?: Usuario | PerfilAcesso | string | null) => hasPermission(user, "cadastrar_empresa");
export const canDeleteCompany = (user?: Usuario | PerfilAcesso | string | null) => hasPermission(user, "excluir_empresa");
export const canCreateGroup = (user?: Usuario | PerfilAcesso | string | null) => hasPermission(user, "criar_grupo");
export const canDeleteGroup = (user?: Usuario | PerfilAcesso | string | null) => hasPermission(user, "excluir_grupo");
export const canManageGroup = (user?: Usuario | PerfilAcesso | string | null) => hasPermission(user, "alterar_config_grupo");
export const canCreatePortfolio = (user?: Usuario | PerfilAcesso | string | null) => hasPermission(user, "criar_carteira");
export const canDeletePortfolio = (user?: Usuario | PerfilAcesso | string | null) => hasPermission(user, "excluir_carteira");
export const canChangePortfolio = (user?: Usuario | PerfilAcesso | string | null) => hasPermission(user, "alterar_carteira");
export const canTransferPortfolio = (user?: Usuario | PerfilAcesso | string | null) => hasPermission(user, "transferir_empresa_carteira");
export const canManageUsers = (user?: Usuario | PerfilAcesso | string | null) => hasPermission(user, "gerenciar_usuarios");
export const canManagePermissions = (user?: Usuario | PerfilAcesso | string | null) => hasPermission(user, "alterar_perfil_permissoes");

/**
 * Escopo de visualização de dados
 */
export function filtrarEmpresasPorEscopo(empresas: Empresa[], usuario?: Usuario | null): Empresa[] {
  if (!usuario || !usuario.id) return empresas;
  const perfil = normalizarPerfil(usuario.perfil);

  // Nível 3 (Admin, Coordenação, CKO): Acesso a todas as empresas
  if (isNivelAdmin(perfil)) {
    return empresas;
  }

  // Nível 2 - Auditoria: Visão transversal de todas as empresas
  if (perfil === "Auditoria") {
    return empresas;
  }

  // Nível 2 - Gerente: Visão ampla de carteiras e grupos
  if (perfil === "Gerente") {
    if (usuario.carteirasPermitidas && usuario.carteirasPermitidas.length > 0) {
      return empresas.filter((e) => usuario.carteirasPermitidas!.includes(e.carteira));
    }
    return empresas;
  }

  // Nível 2 - Supervisor: Empresas sob sua supervisão ou de suas carteiras
  if (perfil === "Supervisor") {
    const nome = usuario.nome.toLowerCase();
    const carteirasPermitidas = usuario.carteirasPermitidas ?? [];
    if (carteirasPermitidas.length > 0) {
      return empresas.filter(
        (e) =>
          carteirasPermitidas.includes(e.carteira) ||
          e.supervisor?.toLowerCase().includes(nome),
      );
    }
    return empresas.filter((e) => e.supervisor?.toLowerCase().includes(nome) || e.carteira === usuario.carteira);
  }

  // Nível 1 - Analista / CS: Prioritariamente sua carteira ou empresas onde é analista
  const nomeAnalista = usuario.nome.toLowerCase();
  const carteiraUsuario = usuario.carteira;
  const carteirasPermitidas = usuario.carteirasPermitidas ?? [];

  return empresas.filter((e) => {
    if (carteirasPermitidas.length > 0 && carteirasPermitidas.includes(e.carteira)) return true;
    if (carteiraUsuario && e.carteira === carteiraUsuario) return true;
    if (e.analista?.toLowerCase().includes(nomeAnalista)) return true;
    if (usuario.grupoTrabalho && e.responsavel?.toLowerCase().includes(usuario.grupoTrabalho.toLowerCase())) return true;
    return false;
  });
}

/** Rotas da área de Visão Geral — liberadas para todos os usuários. */
export const ROTAS_VISAO_GERAL = ["/", "/bi"];

/** Rotas da área de Operação — liberadas para todos os usuários. */
export const ROTAS_OPERACAO = [
  "/empresas",
  "/grupos",
  "/carteiras",
  "/calendario",
  "/obrigacoes",
  "/sst",
  "/folha",
  "/tarefas",
  "/gantt",
  "/documentos",
  "/erros",
  "/treinamentos",
  "/assistente",
];

/** Rotas restritas a Gestão (Nível 2 e 3) */
export const ROTAS_GESTAO = ["/cadastros"];

/** Rotas restritas exclusivamente a Administração (Nível 3) */
export const ROTAS_ADMIN = ["/usuarios", "/integracoes"];

export function podeAcessarRota(perfil: PerfilAcesso | string | null | undefined, pathname: string): boolean {
  const norm = normalizarPerfil(perfil);

  // Nível 3 tem acesso total a todas as rotas
  if (isNivelAdmin(norm)) return true;

  // Nível 3 apenas para rotas restritas de usuários e integrações
  if (ROTAS_ADMIN.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return isNivelAdmin(norm);
  }

  // Rotas de gestão (cadastros)
  if (ROTAS_GESTAO.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return isNivelGestao(norm) || isNivelAdmin(norm);
  }

  // Todas as demais rotas são operacionais / visão geral
  return true;
}

export function rotaInicial(_perfil?: PerfilAcesso | string): string {
  return "/";
}
