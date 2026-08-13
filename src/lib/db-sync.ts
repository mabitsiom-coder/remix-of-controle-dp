import { supabase } from "@/integrations/supabase/client";

/**
 * Sincroniza os dados operacionais do sistema (que ficam em cache no navegador)
 * com a tabela compartilhada `app_state` no banco de dados.
 *
 * Cada coleção é salva como um documento JSON. Assim toda a equipe vê as mesmas
 * informações em qualquer computador, e os dados sobrevivem à limpeza do cache.
 */
type Entrada = { chave: string; storage: string; evento: string };

const MAPA: Entrada[] = [
  { chave: "empresas", storage: "dp_control_empresas_v1", evento: "empresas-updated" },
  { chave: "grupos", storage: "dp_control_grupos_v1", evento: "grupos-updated" },
  { chave: "analistas", storage: "dp_control_analistas_v1", evento: "cadastros-updated" },
  { chave: "supervisores", storage: "dp_control_supervisores_v1", evento: "cadastros-updated" },
  { chave: "carteiras", storage: "dp_control_carteiras_v1", evento: "cadastros-updated" },
  { chave: "membros", storage: "dp_control_membros_v1", evento: "cadastros-updated" },
  { chave: "tarefas", storage: "dp_control_tarefas_v1", evento: "tarefas-updated" },
  { chave: "obrigacoes", storage: "dp_control_obrigacoes_v1", evento: "obrigacoes-updated" },
  { chave: "sst", storage: "dp_control_sst_v1", evento: "sst-updated" },
];

const snapshot = new Map<string, string>();
let iniciado = false;
let usuarioId: string | null = null;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function lerLocal(storage: string): unknown[] | null {
  try {
    const bruto = localStorage.getItem(storage);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? dados : null;
  } catch {
    return null;
  }
}

function aplicarLocal(entrada: Entrada, dados: unknown[]) {
  const serializado = JSON.stringify(dados);
  if (snapshot.get(entrada.chave) === serializado) return;
  snapshot.set(entrada.chave, serializado);
  localStorage.setItem(entrada.storage, serializado);
  window.dispatchEvent(new CustomEvent(entrada.evento));
}

async function enviar(entrada: Entrada) {
  const dados = lerLocal(entrada.storage);
  if (dados === null) return;
  const serializado = JSON.stringify(dados);
  if (snapshot.get(entrada.chave) === serializado) return;

  const { error } = await supabase
    .from("app_state")
    .upsert({ chave: entrada.chave, dados, updated_by: usuarioId }, { onConflict: "chave" });

  if (error) {
    console.error(`Falha ao salvar "${entrada.chave}" no banco:`, error.message);
    return;
  }
  snapshot.set(entrada.chave, serializado);
}

function agendarEnvio(entrada: Entrada) {
  const anterior = timers.get(entrada.chave);
  if (anterior) clearTimeout(anterior);
  timers.set(
    entrada.chave,
    setTimeout(() => {
      void enviar(entrada);
    }, 500),
  );
}

/** Baixa o estado do banco; sobe o que existir apenas no navegador (primeira migração). */
export async function sincronizarComBanco() {
  if (typeof window === "undefined") return;

  const { data: sessao } = await supabase.auth.getSession();
  usuarioId = sessao.session?.user.id ?? null;
  if (!usuarioId) return;

  const { data, error } = await supabase.from("app_state").select("chave,dados");
  if (error) {
    console.error("Falha ao carregar dados do banco:", error.message);
    return;
  }

  const remoto = new Map<string, unknown[]>();
  for (const linha of data ?? []) {
    if (Array.isArray(linha.dados)) remoto.set(linha.chave, linha.dados as unknown[]);
  }

  for (const entrada of MAPA) {
    const doBanco = remoto.get(entrada.chave);
    const local = lerLocal(entrada.storage);

    if (doBanco && doBanco.length > 0) {
      aplicarLocal(entrada, doBanco);
      continue;
    }

    if (local && local.length > 0) {
      // Primeira migração: sobe os dados que já existiam no navegador.
      await enviar(entrada);
      continue;
    }

    if (doBanco) aplicarLocal(entrada, doBanco);
  }
}

/** Passa a ouvir alterações locais (para salvar) e remotas (para atualizar a tela). */
export function iniciarSincronizacao() {
  if (typeof window === "undefined" || iniciado) return;
  iniciado = true;

  const eventos = [...new Set(MAPA.map((m) => m.evento))];
  for (const evento of eventos) {
    window.addEventListener(evento, () => {
      for (const entrada of MAPA.filter((m) => m.evento === evento)) agendarEnvio(entrada);
    });
  }

  supabase
    .channel("app_state_sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_state" },
      (payload: { new?: unknown }) => {
        const linha = payload.new as { chave?: string; dados?: unknown; updated_by?: string | null };
        if (!linha?.chave || !Array.isArray(linha.dados)) return;
        if (linha.updated_by && linha.updated_by === usuarioId) return;
        const entrada = MAPA.find((m) => m.chave === linha.chave);
        if (entrada) aplicarLocal(entrada, linha.dados as unknown[]);
      },
    )
    .subscribe();
}

export function limparSincronizacao() {
  snapshot.clear();
  usuarioId = null;
}
