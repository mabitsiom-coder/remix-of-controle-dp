import { createAPIFileRoute } from "@tanstack/react-start/api";
import { empresas, kpis, errosPorTipo, pendenciasPorEmpresa, transmissoes } from "@/lib/mock-data";

export const APIRoute = createAPIFileRoute("/api/mcp")({
  OPTIONS: async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
      },
    });
  },

  GET: async () => {
    return new Response(
      JSON.stringify(
        {
          jsonrpc: "2.0",
          status: "online",
          protocolVersion: "2025-03-26",
          serverInfo: {
            name: "dp-control-center",
            version: "1.0.0",
          },
        },
        null,
        2
      ),
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

      const reqId = id !== undefined ? id : 1;

      // 1. method: initialize
      if (method === "initialize") {
        return createResponse({
          jsonrpc: "2.0",
          id: reqId,
          result: {
            protocolVersion: "2025-03-26",
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: "dp-control-center",
              version: "1.0.0",
            },
          },
        });
      }

      // 2. method: notifications/initialized
      if (method === "notifications/initialized") {
        return createResponse({
          jsonrpc: "2.0",
        });
      }

      // 3. method: tools/list
      if (method === "tools/list") {
        return createResponse({
          jsonrpc: "2.0",
          id: reqId,
          result: {
            tools: [
              {
                name: "consultar_dp",
                description:
                  "Consulta dados de empresas, colaboradores, relatórios, folhas, obrigações acessórias e KPIs do DP Control.",
                inputSchema: {
                  type: "object",
                  properties: {
                    tipo: {
                      type: "string",
                      enum: ["empresas", "kpis", "erros", "obrigacoes", "tudo"],
                      description: "Tipo de informação desejada",
                    },
                    busca: {
                      type: "string",
                      description: "Termo de busca por palavra-chave",
                    },
                    empresaId: {
                      type: "string",
                      description: "ID ou slug específico da empresa",
                    },
                  },
                },
              },
            ],
          },
        });
      }

      // 4. method: tools/call
      if (method === "tools/call") {
        const name = params?.name;
        const args = params?.arguments || {};

        if (name === "consultar_dp" || name === "consultar_chatgpt") {
          const tipo = args.tipo || "tudo";
          const busca = (args.busca || "").toLowerCase().trim();
          const empresaId = args.empresaId || "";

          let empresasFiltradas = empresas;
          if (empresaId) {
            empresasFiltradas = empresasFiltradas.filter(
              (e) => e.id.toLowerCase() === empresaId.toLowerCase()
            );
          }
          if (busca) {
            empresasFiltradas = empresasFiltradas.filter(
              (e) =>
                e.nome.toLowerCase().includes(busca) ||
                e.cnpj.includes(busca) ||
                e.responsavel.toLowerCase().includes(busca)
            );
          }

          const resultadoExecucao = {
            sucesso: true,
            resumoExecutivo: `Encontradas ${empresasFiltradas.length} empresas com os parâmetros pesquisados. Status geral: ${kpis.find((k) => k.label === "Empresas em Atraso")?.value || 0} empresas em atraso.`,
            empresas: tipo === "empresas" || tipo === "tudo" ? empresasFiltradas : undefined,
            kpis: tipo === "kpis" || tipo === "tudo" ? kpis : undefined,
            errosFrequentes: tipo === "erros" || tipo === "tudo" ? errosPorTipo : undefined,
            empresasComMaisPendencias: tipo === "erros" || tipo === "tudo" ? pendenciasPorEmpresa : undefined,
            transmissoes: tipo === "obrigacoes" || tipo === "tudo" ? transmissoes : undefined,
          };

          return createResponse({
            jsonrpc: "2.0",
            id: reqId,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(resultadoExecucao, null, 2),
                },
              ],
            },
          });
        }

        return createResponse(
          {
            jsonrpc: "2.0",
            id: reqId,
            error: {
              code: -32601,
              message: `Ferramenta '${name}' não encontrada`,
            },
          },
          404
        );
      }

      // Se for um método desconhecido
      return createResponse(
        {
          jsonrpc: "2.0",
          id: reqId,
          error: {
            code: -32601,
            message: `Método '${method}' não suportado`,
          },
        },
        400
      );
    } catch (err: any) {
      return createResponse(
        {
          jsonrpc: "2.0",
          id: 1,
          error: {
            code: -32700,
            message: "Parse error / JSON inválido",
          },
        },
        400
      );
    }
  },
});

function createResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    },
  });
}
