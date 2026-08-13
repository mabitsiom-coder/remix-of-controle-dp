import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const perfilSchema = z.enum(["Administrador", "Coordenador", "Supervisor", "Analista"]);

const criarSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
  perfil: perfilSchema,
  departamento: z.string().default(""),
  status: z.enum(["ativo", "inativo"]).default("ativo"),
});

/** Cria o primeiro administrador quando ainda não existe nenhum usuário. */
export const registrarPrimeiroAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ nome: z.string().min(1), email: z.string().email(), senha: z.string().min(6) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: erroContagem } = await supabaseAdmin
      .from("usuarios")
      .select("id", { count: "exact", head: true });
    if (erroContagem) throw new Error(erroContagem.message);
    if ((count ?? 0) > 0) throw new Error("Já existe um administrador cadastrado. Entre com seu e-mail e senha.");

    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
    });
    if (error || !criado.user) throw new Error(error?.message ?? "Não foi possível criar o acesso.");

    const { error: erroPerfil } = await supabaseAdmin.from("usuarios").insert({
      id: criado.user.id,
      nome: data.nome,
      email: data.email,
      perfil: "Administrador",
      departamento: "Diretoria & Tecnologia",
      status: "ativo",
    });
    if (erroPerfil) throw new Error(erroPerfil.message);

    return { ok: true };
  });

async function exigirAdmin(supabase: {
  from: (t: string) => any;
}, userId: string) {
  const { data, error } = await supabase.from("usuarios").select("perfil").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.perfil !== "Administrador") {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }
}

export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => criarSchema.parse(data))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
    });
    if (error || !criado.user) throw new Error(error?.message ?? "Não foi possível criar o acesso.");

    const { error: erroPerfil } = await supabaseAdmin.from("usuarios").insert({
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
  .inputValidator((data: unknown) =>
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
    await exigirAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.email || data.senha) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
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
      const { error } = await supabaseAdmin.from("usuarios").update(campos).eq("id", data.id);
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });

export const removerUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context.supabase, context.userId);
    if (data.id === context.userId) throw new Error("Você não pode remover o seu próprio acesso.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
