import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileSearch, Sparkles, Wand2, Bot, Code, Copy, Check, ExternalLink, Play, Server, Zap } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Assistente IA & API ChatGPT — DP Control" },
      {
        name: "description",
        content: "API de consulta para Agente ChatGPT e assistente especializado em Departamento Pessoal.",
      },
      { property: "og:title", content: "Assistente IA & API ChatGPT — DP Control" },
      { property: "og:description", content: "Conecte seu Agente do ChatGPT ao DP Control via API." },
    ],
  }),
  component: Assistente,
});

const capacidades = [
  "Analisar PDFs, XMLs e planilhas de DP",
  "Detectar inconsistências entre competências",
  "Identificar documentos e ASOs vencidos",
  "Gerar checklists e relatórios automaticamente",
  "Consultar dados de empresas e colaboradores via API",
  "Explicar códigos de erro do eSocial e DCTFWeb",
];

const openApiSchemaExemplo = `{
  "openapi": "3.0.1",
  "info": {
    "title": "API DP Control",
    "description": "API de consulta de Departamento Pessoal para ChatGPT Actions",
    "version": "1.0.0"
  },
  "servers": [
    { "url": "${typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}" }
  ],
  "paths": {
    "/api/chatgpt/consulta": {
      "get": {
        "operationId": "consultarDadosDP",
        "summary": "Consulta informações e relatórios do Departamento Pessoal",
        "parameters": [
          { "name": "tipo", "in": "query", "schema": { "type": "string" } },
          { "name": "busca", "in": "query", "schema": { "type": "string" } }
        ]
      }
    }
  }
}`;

const promptChatGPTRecomendado = `Você é o Assistente Especialista de Departamento Pessoal do DP Control.
Sua função é auxiliar gestores, contadores e analistas de DP a consultarem dados de empresas, folhas de pagamento, obrigações acessórias (eSocial, DCTFWeb, FGTS Digital, Reinf) e SST.

Sempre que o usuário fizer uma pergunta sobre empresas, pendências ou dados de DP, utilize a ação "consultarDadosDP" para obter informações atualizadas em tempo real e responda de forma clara, profissional e estruturada em tópicos.`;

function Assistente() {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Playground State
  const [tipoQuery, setTipoQuery] = useState("tudo");
  const [buscaQuery, setBuscaQuery] = useState("");
  const [loadingTest, setLoadingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const apiEndpointUrl = typeof window !== "undefined" ? `${window.location.origin}/api/chatgpt/consulta` : "/api/chatgpt/consulta";
  const openApiUrl = typeof window !== "undefined" ? `${window.location.origin}/api/chatgpt/openapi.json` : "/api/chatgpt/openapi.json";

  const handleCopy = (text: string, type: "url" | "schema" | "prompt") => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === "schema") {
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    } else if (type === "prompt") {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const execTestQuery = async () => {
    setLoadingTest(true);
    try {
      const res = await fetch(`/api/chatgpt/consulta?tipo=${tipoQuery}&busca=${encodeURIComponent(buscaQuery)}`);
      const data = await res.json();
      setTestResult(data);
      toast.success("Consulta executada com sucesso!");
    } catch (err) {
      toast.error("Erro ao testar a API.");
      setTestResult({ erro: "Falha na requisição" });
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistente IA & Integração ChatGPT"
        description="Conecte seu agente do ChatGPT ao DP Control ou utilize a interface interna de assistente"
      />

      <Tabs defaultValue="chatgpt" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="chatgpt" className="flex items-center gap-2">
            <Bot className="h-4 w-4" /> API ChatGPT Agent
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Assistente Interno
          </TabsTrigger>
        </TabsList>

        {/* TAB CHATGPT ACTIONS INTEGRATION */}
        <TabsContent value="chatgpt" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Zap className="h-5 w-5 text-amber-500" /> Configuração da Custom GPT Action
                </CardTitle>
                <CardDescription>
                  Siga os passos para conectar este sistema ao seu Agente no ChatGPT (GPTs Personalizados).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">1</span>
                    Endpoint de Consulta (REST API)
                  </h3>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={apiEndpointUrl} className="font-mono text-xs bg-muted" />
                    <Button variant="outline" size="sm" onClick={() => handleCopy(apiEndpointUrl, "url")}>
                      {copiedUrl ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">2</span>
                    Schema OpenAPI 3.0 (Copie para a aba 'Actions' no ChatGPT)
                  </h3>
                  <div className="relative rounded-lg border bg-slate-950 p-4 text-xs font-mono text-slate-50 overflow-x-auto max-h-48">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute right-3 top-3 h-7 text-xs"
                      onClick={() => handleCopy(openApiSchemaExemplo, "schema")}
                    >
                      {copiedSchema ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedSchema ? "Copiado" : "Copiar Schema"}
                    </Button>
                    <pre>{openApiSchemaExemplo}</pre>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Você também pode acessar a URL do schema em:</span>
                    <a href={openApiUrl} target="_blank" rel="noreferrer" className="text-primary underline flex items-center gap-1">
                      {openApiUrl} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">3</span>
                    Prompt do Sistema Recomendado para o Custom GPT
                  </h3>
                  <div className="relative rounded-lg border bg-muted p-3 text-xs text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-7 text-xs"
                      onClick={() => handleCopy(promptChatGPTRecomendado, "prompt")}
                    >
                      {copiedPrompt ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <p className="whitespace-pre-wrap pr-10">{promptChatGPTRecomendado}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PLAYGROUND CARD */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Play className="h-4 w-4 text-emerald-500" /> Testar API em Tempo Real
                </CardTitle>
                <CardDescription>
                  Simule a consulta que seu Agente ChatGPT fará ao sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Tipo de Consulta (`tipo`)</label>
                  <Select value={tipoQuery} onValueChange={setTipoQuery}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tudo">tudo (Completo)</SelectItem>
                      <SelectItem value="empresas">empresas</SelectItem>
                      <SelectItem value="kpis">kpis</SelectItem>
                      <SelectItem value="erros">erros</SelectItem>
                      <SelectItem value="obrigacoes">obrigacoes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Busca por palavra-chave (`busca`)</label>
                  <Input
                    placeholder="Ex: Andrade, atraso, Metalúrgica..."
                    value={buscaQuery}
                    onChange={(e) => setBuscaQuery(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <Button onClick={execTestQuery} disabled={loadingTest} className="w-full h-9 text-xs">
                  {loadingTest ? "Consultando..." : "Executar Teste de API"}
                </Button>

                {testResult && (
                  <div className="mt-4 space-y-2">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <Code className="h-3.5 w-3.5" /> Resposta JSON retornada:
                    </label>
                    <div className="rounded-lg border bg-slate-950 p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-56">
                      <pre>{JSON.stringify(testResult, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB ASSISTENTE INTERNO */}
        <TabsContent value="chat" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="surface-panel flex min-h-[420px] flex-col p-4 lg:col-span-2">
              <div className="flex-1 space-y-4 overflow-y-auto">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="rounded-xl rounded-tl-none border bg-muted/40 p-3 text-sm">
                    Olá! Sou o assistente integrado de DP. Encontrei 3 pontos de atenção na competência 07/2026: a
                    Metalúrgica Andrade está com base de periculosidade divergente, a Rede Bom Preço
                    tem um ASO vencido há 2 dias e a DCTFWeb 06/2026 da Transportes Vale está em atraso.
                    Como posso ajudar?
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t pt-4">
                <Input placeholder="Pergunte algo ou envie um documento para análise..." />
                <Button>Enviar</Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="surface-panel p-4">
                <h2 className="text-sm font-semibold">Capacidades da IA</h2>
                <ul className="mt-3 space-y-2">
                  {capacidades.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="surface-panel p-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <FileSearch className="h-4 w-4" /> Análise de documentos
                </h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  Envie folhas, recibos, ASOs, XMLs do eSocial ou relatórios para conferência automática.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
