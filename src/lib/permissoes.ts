import type { PerfilAcesso, Usuario } from "@/lib/auth-store";
import type { Empresa } from "@/lib/mock-data";
import { carteirasBatem, normalizarCarteira } from "./carteiras-core";

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
 * Escopo de visualização de dados — Regra Central de Segurança
 * Analistas e CS visualizam EXCLUSIVAMENTE empresas pertencentes à sua carteira autorizada.
 */
export function filtrarEmpresasPorEscopo(empresas: Empresa[], usuario?: Usuario | null): Empresa[] {
  if (!usuario || !usuario.id) return empresas;
  const perfil = normalizarPerfil(usuario.perfil);

  // Nível 3 (Admin, Coordenação, CKO): Acesso irrestrito a todas as empresas
  if (isNivelAdmin(perfil)) {
    return empresas;
  }

  // Nível 2 - Auditoria: Visão transversal de todas as empresas
  if (perfil === "Auditoria") {
    return empresas;
  }

  // Nível 2 - Gerente: Visão ampla de suas carteiras ou total
  if (perfil === "Gerente") {
    if (usuario.carteirasPermitidas && usuario.carteirasPermitidas.length > 0) {
      return empresas.filter((e) =>
        usuario.carteirasPermitidas!.some((c) => carteirasBatem(e.carteira, c)),
      );
    }
    return empresas;
  }

  // Nível 2 - Supervisor: Empresas sob sua supervisão ou de suas carteiras permitidas
  if (perfil === "Supervisor") {
    const nome = usuario.nome.toLowerCase();
    const carteirasPermitidas = usuario.carteirasPermitidas ?? [];
    if (carteirasPermitidas.length > 0) {
      return empresas.filter(
        (e) =>
          carteirasPermitidas.some((c) => carteirasBatem(e.carteira, c)) ||
          e.supervisor?.toLowerCase().includes(nome),
      );
    }
    return empresas.filter(
      (e) =>
        (e.supervisor && e.supervisor.toLowerCase().includes(nome)) ||
        (usuario.carteira && carteirasBatem(e.carteira, usuario.carteira)),
    );
  }

  // Nível 1 - Analista / CS: RESTRIÇÃO ESTRITA À PRÓPRIA CARTEIRA
  const carteiraUsuario = usuario.carteira?.trim();
  const carteirasPermitidas = usuario.carteirasPermitidas?.filter(Boolean) ?? [];

  // Se não possuir nenhuma carteira vinculada, não tem acesso a dados de empresas
  if (!carteiraUsuario && carteirasPermitidas.length === 0) {
    return [];
  }

  return empresas.filter((e) => {
    if (carteirasPermitidas.length > 0 && carteirasPermitidas.some((c) => carteirasBatem(e.carteira, c))) {
      return true;
    }
    if (carteiraUsuario && carteirasBatem(e.carteira, carteiraUsuario)) {
      return true;
    }
    return false;
  });
}

/**
 * Valida se uma empresa pertence à carteira autorizada do usuário.
 */
export function empresaPertenceAoEscopo(empresa: Empresa | undefined | null, usuario?: Usuario | null): boolean {
  if (!empresa) return false;
  if (!usuario || !usuario.id) return true;
  const perfil = normalizarPerfil(usuario.perfil);
  if (isNivelAdmin(perfil) || perfil === "Auditoria") return true;

  if (isNivelOperacional(perfil)) {
    const carteiraUsuario = usuario.carteira?.trim();
    const carteirasPermitidas = usuario.carteirasPermitidas?.filter(Boolean) ?? [];
    if (!carteiraUsuario && carteirasPermitidas.length === 0) return false;

    if (carteirasPermitidas.some((c) => carteirasBatem(empresa.carteira, c))) return true;
    if (carteiraUsuario && carteirasBatem(empresa.carteira, carteiraUsuario)) return true;
    return false;
  }

  return filtrarEmpresasPorEscopo([empresa], usuario).length > 0;
}

/** Rotas da área de Visão Geral — liberadas para todos os usuários. */
export const ROTAS_VISAO_GERAL = ["/", "/bi"];

/** Rotas da área de Operação — liberadas para todos os usuários (com escopo interno de carteira). */
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
];

/** Rotas da área de Conhecimento — restritas a Gestão e Administração (bloqueado para Analistas/CS). */
export const ROTAS_CONHECIMENTO = [
  "/documentos",
  "/erros",
  "/treinamentos",
  "/assistente",
  "/conhecimento",
];

/** Rotas restritas a Gestão (Nível 2 e 3) */
export const ROTAS_GESTAO = ["/cadastros", "/configuracoes"];

/** Rotas restritas exclusivamente a Administração (Nível 3) */
export const ROTAS_ADMIN = ["/usuarios", "/integracoes", "/administracao", "/permissoes"];

export function podeAcessarRota(perfil: PerfilAcesso | string | null | undefined, pathname: string): boolean {
  const norm = normalizarPerfil(perfil);

  // Nível 3 tem acesso total a todas as rotas
  if (isNivelAdmin(norm)) return true;

  // Rotas restritas de usuários e administração
  if (ROTAS_ADMIN.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return isNivelAdmin(norm);
  }

  // Rotas de gestão (cadastros mestre)
  if (ROTAS_GESTAO.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return isNivelGestao(norm) || isNivelAdmin(norm);
  }

  // Área de Conhecimento (bloqueada para Nível 1 Operacional: Analista e CS)
  if (ROTAS_CONHECIMENTO.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return isNivelGestao(norm) || isNivelAdmin(norm);
  }

  // Todas as demais rotas são operacionais / visão geral
  return true;
}

export function rotaInicial(_perfil?: PerfilAcesso | string): string {
  return "/";
}
