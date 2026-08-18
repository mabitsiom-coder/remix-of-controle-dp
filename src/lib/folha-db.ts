import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getSupabase } from "@/lib/supabase-browser";
import {
  calcularStatusAutomatico,
  etapasChecklist,
  type EtapaKey,
  type EtapaStatus,
  type FolhaTarefa,
  type StatusFolha,
} from "@/lib/folha-fechamento";

/**
 * Fonte única de verdade do andamento da Folha de Pagamento.
 *
 * Cada marcação é persistida no banco em `folha_etapas`
 * (empresa + competência + etapa) e os dados complementares da competência
 * em `folha_competencia`. O histórico de cada mudança é gravado
 * automaticamente pelo banco em `folha_etapas_historico`.
 */

export const EVENTO_FOLHA_DB = "folha-db-updated";

export type MetaFolha = {
  status?: StatusFolha;
  tipoPonto?: string;
  aprendizes?: number;
  empregados?: number;
  dataPublicacao?: string;
  observacoes?: string;
  carteira?: string;
  responsavel?: string;
  empresaNome?: string;
  codigoDominio?: string;
};

export type RegistroFolha = {
  empresaId: string;
  codigoDominio: string;
  empresaNome: string;
  competencia: string;
  carteira: string;
  responsavel: string;
  status: StatusFolha;
  tipoPonto: string;
  aprendizes: number;
  empregados: number;
  dataPublicacao: string;
  observacoes: string;
  etapas: Record<EtapaKey, EtapaStatus>;
};

const etapaKeys = etapasChecklist.map((e) => e.key) as EtapaKey[];

export function etapasVazias(): Record<EtapaKey, EtapaStatus> {
  const out = {} as Record<EtapaKey, EtapaStatus>;
  for (const k of etapaKeys) out[k] = "pendente";
  return out;
}

export function chaveFolha(empresaId: string, competencia: string) {
  return `${empresaId}::${competencia}`;
}

async function usuarioAtual(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.user.id ?? null;
}

type LinhaEtapa = {
  empresa_codigo: string;
  competencia: string;
  etapa: string;
  status: string;
};

type LinhaComp = {
  empresa_codigo: string;
  competencia: string;
  codigo_dominio: string;
  empresa_nome: string;
  carteira: string;
  responsavel: string;
  status: string;
  tipo_ponto: string;
  aprendizes: number;
  empregados: number;
  data_publicacao: string;
  observacoes: string;
};

/** Carrega o andamento salvo. Sem competência, carrega todas (para dashboards). */
export async function carregarFolha(
  competencia?: string,
): Promise<Map<string, RegistroFolha>> {
  const sb = getSupabase();

  let qEtapas = sb
    .from("folha_etapas")
    .select("empresa_codigo,competencia,etapa,status");
  let qComp = sb
    .from("folha_competencia")
    .select(
      "empresa_codigo,competencia,codigo_dominio,empresa_nome,carteira,responsavel,status,tipo_ponto,aprendizes,empregados,data_publicacao,observacoes",
    );

  if (competencia) {
    qEtapas = qEtapas.eq("competencia", competencia);
    qComp = qComp.eq("competencia", competencia);
  }

  const [etapasRes, compRes] = await Promise.all([qEtapas, qComp]);
  if (etapasRes.error) throw new Error(etapasRes.error.message);
  if (compRes.error) throw new Error(compRes.error.message);

  const mapa = new Map<string, RegistroFolha>();

  const garantir = (empresaId: string, comp: string): RegistroFolha => {
    const chave = chaveFolha(empresaId, comp);
    let reg = mapa.get(chave);
    if (!reg) {
      reg = {
        empresaId,
        codigoDominio: "",
        empresaNome: "",
        competencia: comp,
        carteira: "",
        responsavel: "",
        status: "nao_iniciada",
        tipoPonto: "—",
        aprendizes: 0,
        empregados: 0,
        dataPublicacao: "",
        observacoes: "",
        etapas: etapasVazias(),
      };
      mapa.set(chave, reg);
    }
    return reg;
  };

  for (const linha of (compRes.data ?? []) as LinhaComp[]) {
    const reg = garantir(linha.empresa_codigo, linha.competencia);
    reg.codigoDominio = linha.codigo_dominio || "";
    reg.empresaNome = linha.empresa_nome || "";
    reg.carteira = linha.carteira || "";
    reg.responsavel = linha.responsavel || "";
    reg.status = (linha.status || "nao_iniciada") as StatusFolha;
    reg.tipoPonto = linha.tipo_ponto || "—";
    reg.aprendizes = linha.aprendizes ?? 0;
    reg.empregados = linha.empregados ?? 0;
    reg.dataPublicacao = linha.data_publicacao || "";
    reg.observacoes = linha.observacoes || "";
  }

  for (const linha of (etapasRes.data ?? []) as LinhaEtapa[]) {
    const reg = garantir(linha.empresa_codigo, linha.competencia);
    if (etapaKeys.includes(linha.etapa as EtapaKey)) {
      reg.etapas[linha.etapa as EtapaKey] = linha.status as EtapaStatus;
    }
  }

  // Status sempre coerente com as etapas salvas.
  for (const reg of mapa.values()) {
    reg.status = calcularStatusAutomatico(reg.etapas);
  }

  return mapa;
}

/** Grava (upsert) uma etapa de uma empresa em uma competência. */
export async function salvarEtapa(params: {
  empresaId: string;
  codigoDominio: string;
  empresaNome: string;
  competencia: string;
  etapa: EtapaKey;
  status: EtapaStatus;
}) {
  const userId = await usuarioAtual();
  if (!userId) throw new Error("Sessão expirada. Faça login novamente.");

  const { error } = await getSupabase()
    .from("folha_etapas")
    .upsert(
      {
        empresa_codigo: params.empresaId,
        codigo_dominio: params.codigoDominio,
        empresa_nome: params.empresaNome,
        competencia: params.competencia,
        etapa: params.etapa,
        status: params.status,
        atualizado_por: userId,
      } as never,
      { onConflict: "empresa_codigo,competencia,etapa" },
    );
  if (error) throw new Error(error.message);
}

/** Grava (upsert) os dados complementares da empresa naquela competência. */
export async function salvarMetaFolha(params: {
  empresaId: string;
  competencia: string;
  meta: MetaFolha;
  registro: RegistroFolha;
}) {
  const userId = await usuarioAtual();
  if (!userId) throw new Error("Sessão expirada. Faça login novamente.");

  const r = { ...params.registro, ...params.meta };
  const { error } = await getSupabase()
    .from("folha_competencia")
    .upsert(
      {
        empresa_codigo: params.empresaId,
        competencia: params.competencia,
        codigo_dominio: r.codigoDominio || "",
        empresa_nome: r.empresaNome || "",
        carteira: r.carteira || "",
        responsavel: r.responsavel || "",
        status: r.status || "nao_iniciada",
        tipo_ponto: r.tipoPonto || "—",
        aprendizes: r.aprendizes ?? 0,
        empregados: r.empregados ?? 0,
        data_publicacao: r.dataPublicacao || "",
        observacoes: r.observacoes || "",
        atualizado_por: userId,
      } as never,
      { onConflict: "empresa_codigo,competencia" },
    );
  if (error) throw new Error(error.message);
}

export type EstadoSalvamento = "idle" | "salvando" | "salvo" | "erro";

/**
 * Hook da tela de Folha: carrega o andamento da competência do banco,
 * grava cada marcação imediatamente e mantém o estado em memória
 * sincronizado (salvamento automático com feedback discreto).
 */
export function useFolhaCompetencia(competencia: string) {
  const [registros, setRegistros] = useState<Map<string, RegistroFolha>>(new Map());
  const [carregando, setCarregando] = useState(true);
  const [estado, setEstado] = useState<EstadoSalvamento>("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [pendentes, setPendentes] = useState(0);
  const registrosRef = useRef(registros);
  registrosRef.current = registros;

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const mapa = await carregarFolha(competencia);
      setRegistros(mapa);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar a folha.");
    } finally {
      setCarregando(false);
    }
  }, [competencia]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const notificar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENTO_FOLHA_DB));
    }
  };

  const aplicarLocal = (chave: string, patch: Partial<RegistroFolha>, base: RegistroFolha) => {
    setRegistros((prev) => {
      const next = new Map(prev);
      const atual = prev.get(chave) ?? base;
      const merged = { ...atual, ...patch } as RegistroFolha;
      merged.status = calcularStatusAutomatico(merged.etapas);
      next.set(chave, merged);
      return next;
    });
  };

  const executar = async (fn: () => Promise<void>) => {
    setPendentes((n) => n + 1);
    setEstado("salvando");
    try {
      await fn();
      setErro(null);
      setEstado("salvo");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
      setEstado("erro");
    } finally {
      setPendentes((n) => Math.max(0, n - 1));
      notificar();
    }
  };

  /** Marca/desmarca uma etapa: aplica na tela e grava no banco. */
  const setEtapa = useCallback(
    (base: RegistroFolha, etapa: EtapaKey, status: EtapaStatus) => {
      const chave = chaveFolha(base.empresaId, base.competencia);
      const atual = registrosRef.current.get(chave) ?? base;
      const etapas = { ...atual.etapas, [etapa]: status };
      aplicarLocal(chave, { etapas }, base);

      const novoStatus = calcularStatusAutomatico(etapas);
      void executar(async () => {
        await salvarEtapa({
          empresaId: base.empresaId,
          codigoDominio: base.codigoDominio,
          empresaNome: base.empresaNome,
          competencia: base.competencia,
          etapa,
          status,
        });
        await salvarMetaFolha({
          empresaId: base.empresaId,
          competencia: base.competencia,
          meta: { status: novoStatus },
          registro: { ...atual, etapas, status: novoStatus },
        });
      });
    },
    [],
  );

  /** Atualiza dados complementares (tipo de ponto, quantidades, obs, datas). */
  const setMeta = useCallback((base: RegistroFolha, meta: MetaFolha) => {
    const chave = chaveFolha(base.empresaId, base.competencia);
    const atual = registrosRef.current.get(chave) ?? base;
    aplicarLocal(chave, meta as Partial<RegistroFolha>, base);
    void executar(() =>
      salvarMetaFolha({
        empresaId: base.empresaId,
        competencia: base.competencia,
        meta,
        registro: { ...atual, ...base, ...atual },
      }),
    );
  }, []);

  return {
    registros,
    carregando,
    estado,
    erro,
    pendentes,
    setEtapa,
    setMeta,
    recarregar,
  };
}

/**
 * Andamento salvo de TODAS as competências, no formato usado pelos
 * dashboards (BI, indicadores, análises). Recarrega quando a Folha é salva.
 */
export function useFolhaTarefasSalvas(): { folhaTarefas: FolhaTarefa[]; carregando: boolean } {
  const [mapa, setMapa] = useState<Map<string, RegistroFolha>>(new Map());
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        const dados = await carregarFolha();
        if (ativo) setMapa(dados);
      } catch {
        if (ativo) setMapa(new Map());
      } finally {
        if (ativo) setCarregando(false);
      }
    };
    void carregar();
    const handler = () => void carregar();
    window.addEventListener(EVENTO_FOLHA_DB, handler);
    return () => {
      ativo = false;
      window.removeEventListener(EVENTO_FOLHA_DB, handler);
    };
  }, []);

  const folhaTarefas = useMemo(
    () => Array.from(mapa.values()).map((r) => registroParaTarefa(r)),
    [mapa],
  );

  return { folhaTarefas, carregando };
}

/** Converte um registro do banco no formato legado consumido pelos relatórios. */
export function registroParaTarefa(r: RegistroFolha): FolhaTarefa {
  return {
    id: chaveFolha(r.empresaId, r.competencia),
    codigo: r.codigoDominio || r.empresaId,
    empresa: r.empresaNome,
    grupo: "",
    carteira: r.carteira,
    tipoEmpresa: "com-movimento",
    competencia: r.competencia,
    responsavel: r.responsavel,
    status: r.status,
    dataConclusao: r.dataPublicacao,
    dataPublicacao: r.dataPublicacao,
    observacoes: r.observacoes,
    tipoPonto: r.tipoPonto,
    aprendizes: r.aprendizes,
    empregados: r.empregados,
    etapas: r.etapas,
  };
}
