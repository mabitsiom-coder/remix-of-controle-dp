import { linhasPlanilha } from "./planilha-seed-data";
import { createEmpresa, getStoredEmpresas, saveEmpresas } from "./empresas-store";
import { getStoredGrupos, addGrupo, vincularEmpresaAoGrupo } from "./grupos-store";
import {
  getCarteiras,
  addCarteira,
  getAnalistas,
  addAnalista,
  getSupervisores,
  addSupervisor,
} from "./cadastros-store";

const SEED_FLAG = "dp_control_seed_planilha_v2";

function norm(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function emailDe(nome: string) {
  return `${norm(nome).replace(/[^a-z0-9]+/g, ".")}@dpcontrol.com.br`;
}

/**
 * Cria no sistema todos os cadastros presentes na planilha importada
 * (carteiras, analistas, supervisores, grupos econômicos e empresas)
 * e faz os vínculos entre eles. Executa apenas uma vez por navegador.
 */
export function seedPlanilha() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;

  // Carteiras
  const carteirasExistentes = getCarteiras();
  for (const nome of new Set(linhasPlanilha.map((l) => l.carteira).filter(Boolean))) {
    if (!carteirasExistentes.some((c) => norm(c.nome) === norm(nome))) {
      addCarteira({
        nome,
        descricao: "Carteira operacional importada da planilha de clientes.",
        categoria: "Operacional",
      });
    }
  }

  // Analistas
  const analistasExistentes = getAnalistas();
  for (const nome of new Set(linhasPlanilha.map((l) => l.analista).filter(Boolean))) {
    if (!analistasExistentes.some((a) => norm(a.nome) === norm(nome))) {
      addAnalista({
        nome,
        email: emailDe(nome),
        cargo: "Analista de Departamento Pessoal",
        status: "ativo",
      });
    }
  }

  // Supervisores
  const supervisoresExistentes = getSupervisores();
  for (const nome of new Set(linhasPlanilha.map((l) => l.supervisor).filter(Boolean))) {
    if (!supervisoresExistentes.some((s) => norm(s.nome) === norm(nome))) {
      addSupervisor({
        nome,
        email: emailDe(nome),
        departamento: "Operações DP",
        status: "ativo",
      });
    }
  }

  // Grupos econômicos
  const gruposPorNome = new Map<string, string>();
  for (const g of getStoredGrupos()) gruposPorNome.set(norm(g.nome), g.id);
  for (const nome of new Set(linhasPlanilha.map((l) => l.grupo).filter(Boolean))) {
    const chave = norm(nome);
    if (!gruposPorNome.has(chave)) {
      gruposPorNome.set(chave, addGrupo({ nome, responsavel: "Não informado" }).id);
    }
  }

  // Empresas
  const existentes = getStoredEmpresas();
  const porChave = new Map(
    existentes.map((e) => [`${norm(e.nome)}|${e.cnpj.replace(/\D/g, "")}`, e]),
  );
  const atualizadas = [...existentes];
  const vinculos: Array<{ grupoId: string; empresaId: string }> = [];

  for (const linha of linhasPlanilha) {
    if (!linha.nome) continue;
    const chave = `${norm(linha.nome)}|${linha.cnpj.replace(/\D/g, "")}`;
    const grupoId = linha.grupo ? (gruposPorNome.get(norm(linha.grupo)) ?? "none") : "none";
    const existente = porChave.get(chave);

    if (existente) {
      // Atualiza vínculos operacionais da empresa já cadastrada
      const idx = atualizadas.findIndex((e) => e.id === existente.id);
      if (idx >= 0) {
        atualizadas[idx] = {
          ...existente,
          carteira: linha.carteira,
          analista: linha.analista,
          supervisor: linha.supervisor,
        };
      }
      if (grupoId !== "none") vinculos.push({ grupoId, empresaId: existente.id });
      continue;
    }

    const isPF = /\(pf\)/i.test(linha.nome) || !linha.cnpj;

    const nova = createEmpresa({
      nome: linha.nome,
      cnpj: linha.cnpj,
      regime: isPF ? "Pessoa Física" : "Simples Nacional",
      tipo: isPF ? "domestico-pf" : "com-movimento",
      grupoId,
      responsavel: "",
      carteira: linha.carteira,
      analista: linha.analista,
      supervisor: linha.supervisor,
      funcionarios: 1,
      convenio: "",
      certificadoDigital: "",
      procuracao: "",
      risco: "baixo",
      status: "ativa",
      observacoes: "Cadastro importado da planilha de clientes.",
    });
    porChave.set(chave, nova);
    atualizadas.push(nova);
  }

  // Persiste atualizações mantendo as empresas criadas acima
  const criadas = getStoredEmpresas();
  const mapaAtualizacoes = new Map(atualizadas.map((e) => [e.id, e]));
  saveEmpresas(criadas.map((e) => mapaAtualizacoes.get(e.id) ?? e));

  for (const v of vinculos) vincularEmpresaAoGrupo(v.grupoId, v.empresaId);

  localStorage.setItem(SEED_FLAG, "done");
}
