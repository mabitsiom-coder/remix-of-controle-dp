import type { PerfilAcesso } from "@/lib/auth-store";

/** Perfis com acesso total a todas as funções do sistema. */
export const PERFIS_GESTAO: PerfilAcesso[] = [
  "Administrador",
  "Gerente",
  "Coordenador",
  "Supervisor",
];

/** Rotas da área de Operações — únicas liberadas para o perfil Analista. */
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
  "/checklists",
];

export function isGestao(perfil: PerfilAcesso | string) {
  return PERFIS_GESTAO.includes(perfil as PerfilAcesso);
}

export function podeAcessarRota(perfil: PerfilAcesso | string, pathname: string) {
  if (isGestao(perfil)) return true;
  return ROTAS_OPERACAO.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
}

/** Primeira rota disponível para o perfil (usada em redirecionamentos). */
export function rotaInicial(perfil: PerfilAcesso | string) {
  return isGestao(perfil) ? "/" : "/empresas";
}
