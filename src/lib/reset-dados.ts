/**
 * Limpeza única dos dados de demonstração / importações antigas
 * guardados no navegador. Executa uma vez por dispositivo.
 */
const RESET_FLAG = "dp_control_reset_v1";

const CHAVES = [
  "dp_control_empresas_v1",
  "dp_control_grupos_v1",
  "dp_control_analistas_v1",
  "dp_control_supervisores_v1",
  "dp_control_carteiras_v1",
  "dp_control_membros_v1",
  "dp_control_seed_planilha_v2",
];

export function resetDados() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(RESET_FLAG)) return;
    for (const chave of CHAVES) localStorage.removeItem(chave);
    localStorage.setItem(RESET_FLAG, "done");
  } catch (error) {
    console.error("Erro ao limpar dados locais:", error);
  }
}

if (typeof window !== "undefined") resetDados();
