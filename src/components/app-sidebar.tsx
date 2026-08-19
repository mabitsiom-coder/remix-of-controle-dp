import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Layers,
  CalendarDays,
  FileCheck2,
  HeartPulse,
  Receipt,
  KanbanSquare,
  GanttChartSquare,
  FolderOpen,
  TriangleAlert,
  GraduationCap,
  BarChart3,
  Sparkles,
  ShieldCheck,
  UserCog,
  Users,
  Plug,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-store";
import { AuthModal } from "@/components/auth-modal";
import { podeAcessarRota } from "@/lib/permissoes";

const grupos = [
  {
    label: "Visão geral",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "BI Gerencial", url: "/bi", icon: BarChart3 },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Empresas", url: "/empresas", icon: Building2 },
      { title: "Grupos Econômicos", url: "/grupos", icon: Layers },
      { title: "Carteiras", url: "/carteiras", icon: Briefcase },
      { title: "Calendário", url: "/calendario", icon: CalendarDays },
      { title: "Obrigações", url: "/obrigacoes", icon: FileCheck2 },
      { title: "SST", url: "/sst", icon: HeartPulse },
      { title: "Folha de Pagamento", url: "/folha", icon: Receipt },
      { title: "Rotinas", url: "/tarefas", icon: KanbanSquare },
      { title: "Painel Gantt", url: "/gantt", icon: GanttChartSquare },
    ],
  },
  {
    label: "Conhecimento",
    items: [
      { title: "Documentos", url: "/documentos", icon: FolderOpen },
      { title: "Central de Erros", url: "/erros", icon: TriangleAlert },
      { title: "Treinamentos", url: "/treinamentos", icon: GraduationCap },
      { title: "Assistente IA", url: "/assistente", icon: Sparkles },
    ],
  },
  {
    label: "Administração",
    items: [
      {
        title: "Cadastros do Sistema",
        url: "/cadastros",
        icon: ShieldCheck,
      },
      { title: "Usuários & Acesso", url: "/usuarios", icon: UserCog },
      {
        title: "API & Integrações",
        url: "/integracoes",
        icon: Plug,
      },
    ],
  },
] satisfies {
  label: string;
  items: { title: string; url: string; icon: typeof LayoutDashboard; perfis?: string[] }[];
}[];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { currentUser } = useAuth();

  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  const getInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
    return nome.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">DP Control</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">Centro de Controle Operacional</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {grupos.map((grupo) => {
          const items = grupo.items.filter((item) => podeAcessarRota(currentUser.perfil, item.url));
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={grupo.label}>
              <SidebarGroupLabel>{grupo.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <AuthModal
          trigger={
            <button className="flex w-full items-center gap-2 rounded-lg bg-sidebar-accent px-2 py-2 text-left hover:bg-sidebar-accent/80 transition-colors cursor-pointer">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                {getInitials(currentUser.nome)}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-sidebar-accent-foreground">{currentUser.nome}</p>
                  <p className="truncate text-[11px] text-sidebar-foreground/60">{currentUser.perfil}</p>
                </div>
              )}
            </button>
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
