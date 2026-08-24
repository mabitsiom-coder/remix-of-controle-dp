import { useState, useEffect } from "react";
import { getCurrentUser } from "./auth-store";

export type RegistroAuditoria = {
  id: string;
  dataHora: string;
  timestamp: number;
  usuarioId: string;
  usuarioNome: string;
  perfil: string;
  operacao: string;
  empresaAfetada?: string | undefined;
  grupoAfetado?: string | undefined;
  carteiraAfetada?: string | undefined;
  informacaoAnterior?: string | undefined;
  novaInformacao?: string | undefined;
  registroId?: string | undefined;
  detalhes?: string | undefined;
};

const STORAGE_KEY = "dp_control_auditoria_v1";
const EVENT_NAME = "auditoria-updated";

function dataHoraFormatada(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dia = pad(d.getDate());
  const mes = pad(d.getMonth() + 1);
  const ano = d.getFullYear();
  const hora = pad(d.getHours());
  const min = pad(d.getMinutes());
  const seg = pad(d.getSeconds());
  return `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`;
}

export function getStoredAuditorias(): RegistroAuditoria[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    if (!bruto) return [];
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? lista : [];
  } catch (err) {
    console.error("Erro ao ler auditoria:", err);
    return [];
  }
}

function saveAuditorias(lista: RegistroAuditoria[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (err) {
    console.error("Erro ao salvar auditoria:", err);
  }
}

export function registrarAuditoria(dados: {
  operacao: string;
  empresaAfetada?: string | undefined;
  grupoAfetado?: string | undefined;
  carteiraAfetada?: string | undefined;
  informacaoAnterior?: string | undefined;
  novaInformacao?: string | undefined;
  registroId?: string | undefined;
  detalhes?: string | undefined;
  usuarioNome?: string | undefined;
  usuarioId?: string | undefined;
  perfil?: string | undefined;
}): RegistroAuditoria {
  const usuarioAtual = getCurrentUser();
  const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const agora = Date.now();

  const registro: RegistroAuditoria = {
    id,
    dataHora: dataHoraFormatada(),
    timestamp: agora,
    usuarioId: dados.usuarioId || usuarioAtual.id || "sistema",
    usuarioNome: dados.usuarioNome || usuarioAtual.nome || "Sistema",
    perfil: dados.perfil || usuarioAtual.perfil || "Sistema",
    operacao: dados.operacao,
    empresaAfetada: dados.empresaAfetada,
    grupoAfetado: dados.grupoAfetado,
    carteiraAfetada: dados.carteiraAfetada,
    informacaoAnterior: dados.informacaoAnterior,
    novaInformacao: dados.novaInformacao,
    registroId: dados.registroId,
    detalhes: dados.detalhes,
  };

  const atuais = getStoredAuditorias();
  // Mantém os últimos 1000 registros para alta performance
  const atualizados = [registro, ...atuais].slice(0, 1000);
  saveAuditorias(atualizados);

  return registro;
}

export function useAuditoria() {
  const [auditorias, setAuditorias] = useState<RegistroAuditoria[]>([]);

  useEffect(() => {
    const ler = () => setAuditorias(getStoredAuditorias());
    ler();

    const handleUpdate = () => ler();
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return {
    auditorias,
    registrarAuditoria,
    refresh: () => setAuditorias(getStoredAuditorias()),
  };
}
