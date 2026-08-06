import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  FileCheck2,
  HeartPulse,
  Receipt,
  ListChecks,
  KanbanSquare,
  GanttChartSquare,
  FolderOpen,
  TriangleAlert,
  GraduationCap,
  BarChart3,
  BellRing,
  Sparkles,
  ShieldCheck,
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

const grupos = [
  {
    label: "Visão geral",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "BI Gerencial", url: "/bi", icon: BarChart3 },
      { title: "Alertas", url: "/alertas", icon: BellRing },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Empresas", url: "/empresas", icon: Building2 },
      { title: "Calendário", url: "/calendario", icon: CalendarDays },
      { title: "Obrigações", url: "/obrigacoes", icon: FileCheck2 },
      { title: "SST", url: "/sst", icon: HeartPulse },
      { title: "Folha de Pagamento", url: "/folha", icon: Receipt },
      { title: "Tarefas", url: "/tarefas", icon: KanbanSquare },
      { title: "Painel Gantt", url: "/gantt", icon: GanttChartSquare },
      { title: "Checklists", url: "/checklists", icon: ListChecks },
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
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

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
              <p className="truncate text-[11px] text-sidebar-foreground/60">
                Centro de Controle Operacional
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {grupos.map((grupo) => (
          <SidebarGroup key={grupo.label}>
            <SidebarGroupLabel>{grupo.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.items.map((item) => (
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
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            PS
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-sidebar-accent-foreground">Paulo Serra</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">Supervisor de DP</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
