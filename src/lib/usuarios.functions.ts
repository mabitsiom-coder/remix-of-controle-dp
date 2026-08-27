import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const perfilSchema = z.enum([
  "Analista",
  "CS",
  "Supervisor",
  "Gerente",
  "Auditoria",
  "Coordenação",
  "Administração",
  "CKO",
  "Administrador",
  "Coordenador",
]);

const criarSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
  perfil: perfilSchema,
  cargo: z.string().optional().default(""),
  departamento: z.string().default(""),
  status: z.enum(["ativo", "inativo"]).default("ativo"),
});

/** Cria o primeiro administrador quando ainda não existe nenhum usuário. */
export const registrarPrimeiroAdmin = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ nome: z.string().min(1), email: z.string().email(), senha: z.string().min(6) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("./supabase-admin.server");
    const admin = getAdminClient();

    const { count, error: erroContagem } = await admin
      .from("usuarios")
      .select("id", { count: "exact", head: true });
    if (erroContagem) throw new Error(erroContagem.message);
    if ((count ?? 0) > 0) throw new Error("Já existe um administrador cadastrado. Entre com seu e-mail e senha.");

    const { data: criado, error } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
    });
    if (error || !criado.user) throw new Error(error?.message ?? "Não foi possível criar o acesso.");

    const { error: erroPerfil } = await admin.from("usuarios").insert({
      id: criado.user.id,
      nome: data.nome,
      email: data.email,
      perfil: "Administração",
      departamento: "Diretoria & Tecnologia",
      status: "ativo",
    });
    if (erroPerfil) throw new Error(erroPerfil.message);

    return { ok: true };
  });

/**
 * Validação de permissão no backend:
 * Apenas usuários de Nível 3 (Coordenação, Administração, CKO, Administrador, Coordenador)
 * podem executar operações administrativas de usuários.
 */
async function exigirNivelAdmin(supabase: {
  from: (t: string) => any;
}, userId: string) {
  const { data, error } = await supabase.from("usuarios").select("perfil").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  
  const perfisAutorizados = [
    "Coordenação",
    "Administração",
    "CKO",
    "Administrador",
    "Coordenador",
  ];

  if (!data || !perfisAutorizados.includes(data.perfil)) {
    throw new Error("Acesso negado: Apenas Coordenação, Administração e CKO podem gerenciar usuários e permissões.");
  }
}

export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => criarSchema.parse(data))
  .handler(async ({ data, context }) => {
    await exigirNivelAdmin(context.supabase, context.userId);
    const { getAdminClient } = await import("./supabase-admin.server");
    const admin = getAdminClient();

    const { data: criado, error } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
    });
    if (error || !criado.user) throw new Error(error?.message ?? "Não foi possível criar o acesso.");

    const { error: erroPerfil } = await admin.from("usuarios").insert({
      id: criado.user.id,
      nome: data.nome,
      email: data.email,
      perfil: data.perfil,
      departamento: data.departamento,
      status: data.status,
    });
    if (erroPerfil) throw new Error(erroPerfil.message);

    return { id: criado.user.id };
  });

export const atualizarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        nome: z.string().optional(),
        email: z.string().email().optional(),
        senha: z.string().min(6).optional(),
        perfil: perfilSchema.optional(),
        departamento: z.string().optional(),
        status: z.enum(["ativo", "inativo"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await exigirNivelAdmin(context.supabase, context.userId);
    const { getAdminClient } = await import("./supabase-admin.server");
    const admin = getAdminClient();

    if (data.email || data.senha) {
      const { error } = await admin.auth.admin.updateUserById(data.id, {
        ...(data.email ? { email: data.email } : {}),
        ...(data.senha ? { password: data.senha } : {}),
      });
      if (error) throw new Error(error.message);
    }

    const campos = {
      ...(data.nome !== undefined ? { nome: data.nome } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.perfil !== undefined ? { perfil: data.perfil } : {}),
      ...(data.departamento !== undefined ? { departamento: data.departamento } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    };

    if (Object.keys(campos).length > 0) {
      const { error } = await admin.from("usuarios").update(campos).eq("id", data.id);
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });

export const removerUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await exigirNivelAdmin(context.supabase, context.userId);
    if (data.id === context.userId) throw new Error("Você não pode remover o seu próprio acesso.");

    const { getAdminClient } = await import("./supabase-admin.server");
    const admin = getAdminClient();
    const { error } = await admin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Indica se já existe algum usuário cadastrado (usado na primeira configuração). */
export const existeUsuario = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Configuração do banco de dados indisponível.");

  const res = await fetch(`${url}/rest/v1/rpc/existe_usuario`, {
    method: "POST",
    headers: { apikey: key, "content-type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error(await res.text());
  return { existe: Boolean(await res.json()) };
});
