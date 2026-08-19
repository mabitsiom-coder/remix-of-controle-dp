import type { PerfilAcesso } from "@/lib/auth-store";

/** Perfis com acesso total a todas as funções do sistema (Gestão / Administrador como fabio-adm). */
export const PERFIS_GESTAO: PerfilAcesso[] = [
  "Administrador",
  "Gerente",
  "Coordenador",
  "Supervisor",
];

/** Rotas da área de Visão Geral — liberadas para todos os usuários. */
export const ROTAS_VISAO_GERAL = [
  "/",
  "/bi",
];

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
];

/** Todas as rotas liberadas para usuários comuns (Visão Geral + Operação). */
export const ROTAS_USUARIOS = [
  ...ROTAS_VISAO_GERAL,
  ...ROTAS_OPERACAO,
];

export function isGestao(perfil: PerfilAcesso | string) {
  return PERFIS_GESTAO.includes(perfil as PerfilAcesso);
}

export function podeAcessarRota(perfil: PerfilAcesso | string, pathname: string) {
  // Administradores e perfis de gestão têm acesso a todo o sistema
  if (isGestao(perfil)) return true;

  // Usuários comuns têm acesso total às áreas de Visão Geral e Operação
  return ROTAS_USUARIOS.some(
    (rota) => pathname === rota || (rota !== "/" && pathname.startsWith(`${rota}/`)),
  );
}

/** Primeira rota disponível para o perfil (usada em redirecionamentos). */
export function rotaInicial(perfil: PerfilAcesso | string) {
  return "/";
}

