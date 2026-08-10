import { createAPIFileRoute } from "@tanstack/react-start/api";
import { empresas, kpis, errosPorTipo, pendenciasPorEmpresa, transmissoes } from "@/lib/mock-data";

export const APIRoute = createAPIFileRoute("/api/mcp")({
  GET: async () => {
    return new Response(
      JSON.stringify({
        status: "online",
        protocol: "mcp",
        version: "1.0.0",
        server: "DP Control MCP Server",
        description: "Servidor MCP (Model Context Protocol) que encapsula /api/chatgpt/consulta",
        tools: [
          {
            name: "consultar_dp",
            description: "Encapsula a API de consulta geral do DP Control. Permite filtrar por tipo ('empresas', 'kpis', 'erros', 'obrigacoes', 'tudo') e busca por palavra-chave.",
            inputSchema: {
              type: "object",
              properties: {
                tipo: { type: "string", description: "Tipo de informação: 'empresas', 'kpis', 'erros', 'obrigacoes' ou 'tudo'" },
                busca: { type: "string", description: "Termo de busca ou filtro por texto" },
                empresaId: { type: "string", description: "ID específico da empresa" },
              },
            },
          },
          {
            name: "consultar_empresas",
            description: "Lista empresas cadastradas com status, responsável e colaboradores.",
            inputSchema: {
              type: "object",
              properties: {
                busca: { type: "string", description: "Termo de busca" },
              },
            },
          },
        ],
      }, null, 2),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { jsonrpc, id, method, params } = body;

      if (jsonrpc === "2.0" || method) {
        if (method === "initialize") {
          return mcpResponse(id, {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "dp-control-mcp", version: "1.0.0" },
          });
        }

        if (method === "tools/list") {
          return mcpResponse(id, {
            tools: [
              {
                name: "consultar_dp",
                description: "Encapsula a rota /api/chatgpt/consulta. Retorna relatórios, KPIs, folhas e empresas.",
                inputSchema: {
                  type: "object",
                  properties: {
                    tipo: { type: "string", enum: ["empresas", "kpis", "erros", "obrigacoes", "tudo"] },
                    busca: { type: "string" },
                    empresaId: { type: "string" },
                  },
                },
              },
              {
                name: "consultar_empresas",
                description: "Consulta empresas cadastradas no DP Control.",
                inputSchema: {
                  type: "object",
                  properties: { busca: { type: "string" } },
                },
              },
            ],
          });
        }

        if (method === "tools/call") {
          const name = params?.name;
          const args = params?.arguments || {};
          let resultData: any = null;

          if (name === "consultar_dp" || name === "consultar_chatgpt") {
            const tipo = args.tipo || "tudo";
            const busca = (args.busca || "").toLowerCase().trim();
            const empresaId = args.empresaId || "";

            let empresasFiltradas = empresas;
            if (empresaId) {
              empresasFiltradas = empresasFiltradas.filter((e) => e.id.toLowerCase() === empresaId.toLowerCase());
            }
            if (busca) {
              empresasFiltradas = empresasFiltradas.filter(
                (e) =>
                  e.nome.toLowerCase().includes(busca) ||
                  e.cnpj.includes(busca) ||
                  e.responsavel.toLowerCase().includes(busca)
              );
            }

            resultData = {
              sucesso: true,
              resumoExecutivo: `Consulta realizada via Servidor MCP. ${empresasFiltradas.length} empresas localizadas.`,
              empresas: tipo === "empresas" || tipo === "tudo" ? empresasFiltradas : undefined,
              kpis: tipo === "kpis" || tipo === "tudo" ? kpis : undefined,
              errosFrequentes: tipo === "erros" || tipo === "tudo" ? errosPorTipo : undefined,
              transmissoes: tipo === "obrigacoes" || tipo === "tudo" ? transmissoes : undefined,
            };
          } else if (name === "consultar_empresas") {
            const busca = (args.busca || "").toLowerCase();
            const res = busca
              ? empresas.filter((e) => e.nome.toLowerCase().includes(busca) || e.cnpj.includes(busca))
              : empresas;
            resultData = { total: res.length, empresas: res };
          } else {
            return mcpResponse(id, null, { code: -32601, message: `Ferramenta '${name}' não encontrada` });
          }

          return mcpResponse(id, {
            content: [
              {
                type: "text",
                text: JSON.stringify(resultData, null, 2),
              },
            ],
          });
        }
      }

      return new Response(JSON.stringify({ erro: "Formato de requisição inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    } catch {
      return new Response(JSON.stringify({ erro: "Falha na requisição MCP" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  },
});

function mcpResponse(id: any, result: any, error: any = null) {
  const payload: any = { jsonrpc: "2.0", id: id ?? 1 };
  if (error) {
    payload.error = error;
  } else {
    payload.result = result;
  }
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
