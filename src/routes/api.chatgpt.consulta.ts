import { createAPIFileRoute } from "@tanstack/react-start/api";
import { empresas, kpis, errosPorTipo, pendenciasPorEmpresa, transmissoes } from "@/lib/mock-data";

export const APIRoute = createAPIFileRoute("/api/chatgpt/consulta")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const tipo = url.searchParams.get("tipo") || "tudo";
    const busca = (url.searchParams.get("busca") || "").toLowerCase().trim();
    const empresaId = url.searchParams.get("empresaId") || "";

    return handleConsulta({ tipo, busca, empresaId });
  },
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const tipo = body.tipo || "tudo";
      const busca = (body.busca || "").toLowerCase().trim();
      const empresaId = body.empresaId || "";

      return handleConsulta({ tipo, busca, empresaId });
    } catch {
      return handleConsulta({ tipo: "tudo", busca: "", empresaId: "" });
    }
  },
});

function handleConsulta({ tipo, busca, empresaId }: { tipo: string; busca: string; empresaId: string }) {
  let empresasFiltradas = empresas;

  if (empresaId) {
    empresasFiltradas = empresasFiltradas.filter(
      (e) => e.id.toLowerCase() === empresaId.toLowerCase() || e.nome.toLowerCase().includes(empresaId.toLowerCase())
    );
  }

  if (busca) {
    empresasFiltradas = empresasFiltradas.filter(
      (e) =>
        e.nome.toLowerCase().includes(busca) ||
        e.cnpj.includes(busca) ||
        e.responsavel.toLowerCase().includes(busca) ||
        e.status.toLowerCase().includes(busca) ||
        e.particularidades.observacoes.toLowerCase().includes(busca)
    );
  }

  const payload: Record<string, any> = {
    sucesso: true,
    timestamp: new Date().toISOString(),
    parametros: { tipo, busca, empresaId },
  };

  if (tipo === "empresas" || tipo === "tudo") {
    payload.empresas = {
      total: empresasFiltradas.length,
      itens: empresasFiltradas.map((e) => ({
        id: e.id,
        nome: e.nome,
        cnpj: e.cnpj,
        status: e.status,
        risco: e.risco,
        funcionarios: e.funcionarios,
        responsavel: e.responsavel,
        regime: e.regime,
        ultimaRevisao: e.ultimaRevisao,
        particularidades: e.particularidades,
      })),
    };
  }

  if (tipo === "kpis" || tipo === "tudo") {
    payload.kpis = kpis;
  }

  if (tipo === "erros" || tipo === "tudo") {
    payload.errosFrequentes = errosPorTipo;
    payload.empresasComMaisPendencias = pendenciasPorEmpresa;
  }

  if (tipo === "obrigacoes" || tipo === "transmissoes" || tipo === "tudo") {
    payload.transmissoesRecentes = transmissoes;
  }

  payload.resumoExecutivo = `Encontradas ${empresasFiltradas.length} empresas com os parâmetros pesquisados. Status geral de DP: ${kpis.find((k) => k.label === "Empresas em Atraso")?.value || 0} em atraso e ${kpis.find((k) => k.label === "Folhas Pendentes")?.value || 0} folhas pendentes.`;

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
