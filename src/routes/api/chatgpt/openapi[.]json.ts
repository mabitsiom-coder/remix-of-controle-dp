import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chatgpt/openapi.json")({
  server: {
    handlers: {
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const origin = url.origin;

    const openApiSchema = {
      openapi: "3.0.1",
      info: {
        title: "API de Consulta DP Control para ChatGPT",
        description: "API de consulta de dados de Departamento Pessoal, empresas, folhas, obrigações acessórias (eSocial, DCTFWeb, FGTS Digital) e KPIs para Agentes do ChatGPT.",
        version: "1.0.0",
      },
      servers: [
        {
          url: origin,
          description: "Servidor DP Control",
        },
      ],
      paths: {
        "/api/chatgpt/consulta": {
          get: {
            operationId: "consultarDadosDP",
            summary: "Consulta informações e relatórios do Departamento Pessoal",
            description: "Retorna dados de empresas, funcionários, pendências, status de folhas, obrigações acessórias e KPIs do DP Control.",
            parameters: [
              {
                name: "tipo",
                in: "query",
                description: "Tipo de informação desejada: 'empresas', 'kpis', 'erros', 'obrigacoes' ou 'tudo'",
                required: false,
                schema: {
                  type: "string",
                  enum: ["empresas", "kpis", "erros", "obrigacoes", "tudo"],
                  default: "tudo",
                },
              },
              {
                name: "busca",
                in: "query",
                description: "Termo de busca (nome da empresa, CNPJ, responsável ou palavra-chave)",
                required: false,
                schema: {
                  type: "string",
                },
              },
              {
                name: "empresaId",
                in: "query",
                description: "ID ou slug específico da empresa",
                required: false,
                schema: {
                  type: "string",
                },
              },
            ],
            responses: {
              "200": {
                description: "Dados consultados com sucesso",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        sucesso: { type: "boolean" },
                        resumoExecutivo: { type: "string" },
                        empresas: { type: "object" },
                        kpis: { type: "array" },
                        errosFrequentes: { type: "array" },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            operationId: "consultarDadosDPPost",
            summary: "Consulta informações do DP Control via corpo JSON",
            description: "Permite fazer consultas mais estruturadas com filtros avançados via POST.",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      tipo: { type: "string", enum: ["empresas", "kpis", "erros", "obrigacoes", "tudo"] },
                      busca: { type: "string" },
                      empresaId: { type: "string" },
                    },
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "Dados consultados com sucesso",
              },
            },
          },
        },
      },
    };

    return new Response(JSON.stringify(openApiSchema, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
    },
  },
});
