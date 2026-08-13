import { createFileRoute } from "@tanstack/react-router";
import { AcessoRestrito } from "@/components/acesso-restrito";
import { PERFIS_GESTAO, isGestao } from "@/lib/permissoes";
import { useAuth } from "@/lib/auth-store";
import { useEffect, useState } from "react";
import { Check, Copy, Plug, Bot, Code2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/integracoes")({
  head: () => ({
    meta: [
      { title: "Configuração de API e Integrações | DP Control" },
      {
        name: "description",
        content:
          "Endpoints, esquema OpenAPI e configuração MCP para conectar o DP Control ao ChatGPT, Claude e outras ferramentas.",
      },
      { property: "og:title", content: "Configuração de API e Integrações | DP Control" },
      {
        property: "og:description",
        content: "URLs, OpenAPI e MCP prontos para conectar o DP Control a agentes de IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntegracoesPage,
});

function CopyBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-start gap-2">
        <pre className="flex-1 overflow-x-auto rounded-lg border bg-muted/50 p-3 text-xs leading-relaxed font-mono">
          {value}
        </pre>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Copiar ${label}`}
          onClick={() => {
            void navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function IntegracoesPage() {
  const { currentUser } = useAuth();
  const [origin, setOrigin] = useState("https://dp-control-center.lovable.app");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!isGestao(currentUser.perfil)) {
    return <AcessoRestrito perfisPermitidos={PERFIS_GESTAO} />;
  }


  const mcpUrl = `${origin}/api/public/mcp`;
  const openApiUrl = `${origin}/api/public/chatgpt/openapi.json`;
  const consultaUrl = `${origin}/api/public/chatgpt/consulta`;

  const mcpConfig = `{
  "mcpServers": {
    "dp-control-center": {
      "url": "${mcpUrl}",
      "transport": "http"
    }
  }
}`;

  const curlGet = `curl "${consultaUrl}?tipo=empresas&busca=comercio"`;

  const curlPost = `curl -X POST "${consultaUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"tipo":"tudo","busca":"","empresaId":""}'`;

  const mcpCurl = `curl -X POST "${mcpUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Configuração de API</h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Use os endpoints abaixo para conectar o DP Control a agentes de IA (ChatGPT, Claude,
          Cursor) ou a sistemas externos. Todos os endpoints são públicos, somente leitura e com
          CORS liberado.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { titulo: "Servidor MCP", url: mcpUrl, tag: "JSON-RPC 2.0" },
          { titulo: "Esquema OpenAPI", url: openApiUrl, tag: "OpenAPI 3.0.1" },
          { titulo: "Consulta REST", url: consultaUrl, tag: "GET / POST" },
        ].map((item) => (
          <Card key={item.titulo} className="surface-panel">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{item.titulo}</CardTitle>
                <Badge variant="secondary">{item.tag}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <code className="block break-all text-xs text-muted-foreground">{item.url}</code>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="mcp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mcp">MCP (Claude / Cursor)</TabsTrigger>
          <TabsTrigger value="gpt">GPT Personalizado</TabsTrigger>
          <TabsTrigger value="rest">REST / cURL</TabsTrigger>
        </TabsList>

        <TabsContent value="mcp">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Code2 className="h-4 w-4 text-primary" /> Conectar via MCP
              </CardTitle>
              <CardDescription>
                Adicione a configuração ao seu cliente MCP (Claude Desktop, Cursor, Windsurf) e
                reinicie o aplicativo. A ferramenta exposta é <code>consultar_dp</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CopyBox label="URL do servidor" value={mcpUrl} />
              <CopyBox label="Configuração JSON" value={mcpConfig} />
              <CopyBox label="Teste rápido" value={mcpCurl} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gpt">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-4 w-4 text-primary" /> Conectar a um GPT personalizado
              </CardTitle>
              <CardDescription>
                No ChatGPT: Criar GPT → Configurar → Ações → Importar do URL, e cole o esquema
                abaixo. Autenticação: Nenhuma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CopyBox label="URL do esquema OpenAPI" value={openApiUrl} />
              <CopyBox
                label="Instrução sugerida para o GPT"
                value={`Você é o assistente do DP Control. Sempre consulte a ação de consulta antes de responder sobre empresas, folhas, obrigações acessórias (eSocial, DCTFWeb, FGTS Digital), erros e KPIs. Responda em português, de forma objetiva e com números.`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rest">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle className="text-base">Endpoint de consulta</CardTitle>
              <CardDescription>
                Parâmetros: <code>tipo</code> (empresas, kpis, erros, obrigacoes, tudo),{" "}
                <code>busca</code> (texto livre) e <code>empresaId</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CopyBox label="GET" value={curlGet} />
              <CopyBox label="POST" value={curlPost} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
