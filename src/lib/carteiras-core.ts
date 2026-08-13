/**
 * Fonte única de verdade da relação Carteira → Empresas.
 *
 * Todos os módulos (Obrigações, SST, Folha, Particularidades, Rotinas)
 * devem usar estas funções para descobrir a carteira de uma empresa e
 * para filtrar registros por carteira. Nenhum módulo deve manter uma
 * lógica paralela de associação carteira/empresa.
 */
import type { Empresa } from "./mock-data";

export const SEM_CARTEIRA = "Sem Carteira";
export const TODAS_CARTEIRAS = "todas";

/** Normaliza o nome de uma carteira (usado em comparações). */
export function normalizarCarteira(valor?: string | null): string {
  const limpo = (valor ?? "").trim();
  return limpo.length > 0 ? limpo : SEM_CARTEIRA;
}

/** Carteira oficial de uma empresa — sempre vem do cadastro da empresa. */
export function carteiraDaEmpresa(empresa?: Pick<Empresa, "carteira"> | null): string {
  return normalizarCarteira(empresa?.carteira);
}

/** Índice de empresas por código de domínio, id e nome (para casar registros de obrigações). */
export function indexarEmpresas(empresas: Empresa[]) {
  const porChave = new Map<string, Empresa>();
  for (const emp of empresas) {
    if (!emp) continue;
    if (emp.codigoDominio) porChave.set(String(emp.codigoDominio).trim(), emp);
    if (emp.id) porChave.set(String(emp.id).trim(), emp);
    if (emp.nome) porChave.set(emp.nome.trim().toLowerCase(), emp);
  }
  return porChave;
}

/** Encontra a empresa de um registro de obrigação por código ou nome. */
export function empresaDoRegistro(
  indice: Map<string, Empresa>,
  registro: { codigo?: string | undefined; empresa?: string | undefined },
): Empresa | undefined {
  const cod = (registro.codigo ?? "").trim();
  if (cod && indice.has(cod)) return indice.get(cod);
  const nome = (registro.empresa ?? "").trim().toLowerCase();
  if (nome && indice.has(nome)) return indice.get(nome);
  return undefined;
}

/** Lista de nomes de carteiras: cadastro de carteiras + carteiras usadas pelas empresas ativas. */
export function listarNomesCarteiras(
  empresas: Empresa[],
  carteiras: { nome: string }[] = [],
): string[] {
  const set = new Set<string>();
  for (const c of carteiras) {
    const nome = (c?.nome ?? "").trim();
    if (nome) set.add(nome);
  }
  for (const e of empresas) {
    if (!e) continue;
    set.add(carteiraDaEmpresa(e));
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Empresas vinculadas a uma carteira (ou todas, quando o filtro é "todas"). */
export function empresasDaCarteira(empresas: Empresa[], filtro: string): Empresa[] {
  if (!filtro || filtro === TODAS_CARTEIRAS) return empresas.filter(Boolean);
  return empresas.filter((e) => e && carteiraDaEmpresa(e) === normalizarCarteira(filtro));
}

/** Verdadeiro quando a carteira informada atende ao filtro selecionado. */
export function pertenceACarteira(carteira: string | undefined, filtro: string): boolean {
  if (!filtro || filtro === TODAS_CARTEIRAS) return true;
  return normalizarCarteira(carteira) === normalizarCarteira(filtro);
}

/** Contagem de empresas por carteira (usada nas abas de cada módulo). */
export function contarPorCarteira(empresas: Empresa[], carteira: string): number {
  return empresasDaCarteira(empresas, carteira).length;
}
