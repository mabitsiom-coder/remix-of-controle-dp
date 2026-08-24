import { useState } from "react";
import {
  History,
  Search,
  Shield,
  Filter,
  Building2,
  Layers,
  Briefcase,
  UserCheck,
  Calendar,
  ArrowRight,
  Info,
} from "lucide-react";
import { useAuditoria, type RegistroAuditoria } from "@/lib/auditoria-store";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function HistoricoAuditoriaView() {
  const { auditorias } = useAuditoria();
  const [busca, setBusca] = useState("");
  const [filtroOperacao, setFiltroOperacao] = useState<string>("todas");
  const [filtroPerfil, setFiltroPerfil] = useState<string>("todos");

  const auditoriasFiltradas = auditorias.filter((reg) => {
    const q = busca.toLowerCase().trim();
    const matchesBusca =
      !q ||
      reg.usuarioNome.toLowerCase().includes(q) ||
      reg.operacao.toLowerCase().includes(q) ||
      (reg.empresaAfetada && reg.empresaAfetada.toLowerCase().includes(q)) ||
      (reg.grupoAfetado && reg.grupoAfetado.toLowerCase().includes(q)) ||
      (reg.carteiraAfetada && reg.carteiraAfetada.toLowerCase().includes(q)) ||
      (reg.detalhes && reg.detalhes.toLowerCase().includes(q));

    const matchesOp =
      filtroOperacao === "todas" ||
      reg.operacao.toLowerCase().includes(filtroOperacao.toLowerCase());

    const matchesPerfil =
      filtroPerfil === "todos" || reg.perfil === filtroPerfil;

    return matchesBusca && matchesOp && matchesPerfil;
  });

  const getPerfilBadge = (perfil: string) => {
    switch (perfil) {
      case "Administração":
      case "Administrador":
      case "CKO":
        return "destructive";
      case "Coordenação":
      case "Coordenador":
        return "secondary";
      case "Gerente":
      case "Supervisor":
      case "Auditoria":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      {/* CABEÇALHO E FILTROS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Histórico de Alterações & Auditoria</h3>
            <p className="text-xs text-muted-foreground">
              Registro imutável de operações críticas realizadas por usuários no sistema
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Total de Registros: {auditorias.length}
          </Badge>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative sm:col-span-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuário, empresa, ação ou detalhes..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Tipo:</span>
          <Select value={filtroOperacao} onValueChange={setFiltroOperacao}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Operações</SelectItem>
              <SelectItem value="empresa">Empresas</SelectItem>
              <SelectItem value="carteira">Carteiras</SelectItem>
              <SelectItem value="grupo">Grupos</SelectItem>
              <SelectItem value="usuário">Usuários</SelectItem>
              <SelectItem value="exclusão">Exclusões</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Perfil:</span>
          <Select value={filtroPerfil} onValueChange={setFiltroPerfil}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Perfis</SelectItem>
              <SelectItem value="Administração">Administração</SelectItem>
              <SelectItem value="Coordenação">Coordenação</SelectItem>
              <SelectItem value="CKO">CKO</SelectItem>
              <SelectItem value="Gerente">Gerente</SelectItem>
              <SelectItem value="Supervisor">Supervisor</SelectItem>
              <SelectItem value="Auditoria">Auditoria</SelectItem>
              <SelectItem value="Analista">Analista</SelectItem>
              <SelectItem value="CS">CS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* LISTAGEM DE LOGS DE AUDITORIA */}
      {auditoriasFiltradas.length === 0 ? (
        <div className="surface-panel flex flex-col items-center justify-center p-12 text-center rounded-xl border">
          <History className="h-10 w-10 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold">Nenhum registro de auditoria encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">
            As operações sensíveis executadas pelos usuários aparecerão automaticamente aqui.
          </p>
        </div>
      ) : (
        <div className="surface-panel overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-muted-foreground text-[11px] uppercase tracking-wider bg-muted/30">
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Usuário / Perfil</th>
                  <th className="py-3 px-4">Operação Realizada</th>
                  <th className="py-3 px-4">Entidade Afetada</th>
                  <th className="py-3 px-4">Alteração (De → Para)</th>
                  <th className="py-3 px-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {auditoriasFiltradas.map((reg) => (
                  <tr key={reg.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                      {reg.dataHora}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground">{reg.usuarioNome}</span>
                        <Badge variant={getPerfilBadge(reg.perfil)} className="text-[10px] w-fit">
                          {reg.perfil}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="secondary"
                        className={`text-[11px] font-medium ${
                          reg.operacao.toLowerCase().includes("exclusão")
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : reg.operacao.toLowerCase().includes("criação")
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {reg.operacao}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {reg.empresaAfetada && (
                          <div className="flex items-center gap-1 font-medium text-foreground">
                            <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[180px]">{reg.empresaAfetada}</span>
                          </div>
                        )}
                        {reg.grupoAfetado && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Layers className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[180px]">Grupo: {reg.grupoAfetado}</span>
                          </div>
                        )}
                        {reg.carteiraAfetada && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Briefcase className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[180px]">Carteira: {reg.carteiraAfetada}</span>
                          </div>
                        )}
                        {!reg.empresaAfetada && !reg.grupoAfetado && !reg.carteiraAfetada && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {reg.informacaoAnterior || reg.novaInformacao ? (
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                          {reg.informacaoAnterior && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground line-through">
                              {reg.informacaoAnterior}
                            </span>
                          )}
                          {reg.informacaoAnterior && reg.novaInformacao && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          )}
                          {reg.novaInformacao && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                              {reg.novaInformacao}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-[11px] max-w-[200px] truncate" title={reg.detalhes}>
                      {reg.detalhes || reg.registroId ? (
                        <span>{reg.detalhes || `ID: ${reg.registroId}`}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
