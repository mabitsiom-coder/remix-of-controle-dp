import { linhasPlanilha } from "./planilha-seed-data";
import { createEmpresa, getStoredEmpresas } from "./empresas-store";
import { getStoredGrupos, addGrupo } from "./grupos-store";
import {
  getCarteiras,
  addCarteira,
  getAnalistas,
  addAnalista,
  getSupervisores,
  addSupervisor,
} from "./cadastros-store";

const SEED_FLAG = "dp_control_seed_planilha_v1";

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
  const chavesExistentes = new Set(
    existentes.map((e) => `${norm(e.nome)}|${e.cnpj.replace(/\D/g, "")}`),
  );

  for (const linha of linhasPlanilha) {
    const chave = `${norm(linha.nome)}|${linha.cnpj.replace(/\D/g, "")}`;
    if (!linha.nome || chavesExistentes.has(chave)) continue;
    chavesExistentes.add(chave);

    const isPF = /\(pf\)/i.test(linha.nome) || !linha.cnpj;

    createEmpresa({
      nome: linha.nome,
      cnpj: linha.cnpj,
      regime: isPF ? "Pessoa Física" : "Simples Nacional",
      tipo: isPF ? "domestico-pf" : "com-movimento",
      grupoId: linha.grupo ? (gruposPorNome.get(norm(linha.grupo)) ?? "none") : "none",
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
  }

  localStorage.setItem(SEED_FLAG, "done");
}
