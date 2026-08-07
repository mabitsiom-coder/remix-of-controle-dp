import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, History, Upload } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { documentos } from "@/lib/mock-data";

export const Route = createFileRoute("/documentos")({
  head: () => ({
    meta: [
      { title: "Central de Documentos — DP Control" },
      {
        name: "description",
        content: "Documentos por empresa e categoria: folha, recibos, contratos, ASOs, laudos, guias e certificados.",
      },
      { property: "og:title", content: "Central de Documentos — DP Control" },
      { property: "og:description", content: "Organização documental com histórico de versões." },
    ],
  }),
  component: Documentos,
});

const categorias = [
  "Todas",
  "Folha",
  "Recibos",
  "Contratos",
  "ASOs",
  "Laudos",
  "DCTFWeb",
  "FGTS",
  "Guias",
  "Procurações",
  "Certificados",
];

function Documentos() {
  const [cat, setCat] = useState("Todas");
  const lista = cat === "Todas" ? documentos : documentos.filter((d) => d.categoria === cat);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Documentos"
        description="Organização por empresa e categoria com histórico de versões"
        actions={
          <Button>
            <Upload className="mr-1.5 h-4 w-4" /> Enviar documento
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={
              cat === c
                ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                : "rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {lista.map((d) => (
          <div key={d.id} className="surface-panel flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{d.nome}</p>
              <p className="text-xs text-muted-foreground">
                {d.empresa} · {d.categoria}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <History className="h-3 w-3" /> {d.versao} · {d.data} · {d.autor}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
