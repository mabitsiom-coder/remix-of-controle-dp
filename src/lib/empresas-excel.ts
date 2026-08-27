import * as XLSX from "xlsx";
import type { Empresa } from "./mock-data";
import { getAnalistas, getSupervisores, getCarteiras } from "./cadastros-store";

export interface OpcoesImportacao {
  permitirApagarCamposVazios: boolean;
}

export interface AlteracaoCampo {
  campo: string;
  label: string;
  valorAtual: string | number;
  novoValor: string | number;
}

export interface EmpresaParaAtualizar {
  empresaExistente: Empresa;
  linhaArquivo: number;
  cnpj: string;
  nome: string;
  alteracoes: AlteracaoCampo[];
  novosDados: {
    nome: string;
    cnpj: string;
    analista: string;
    supervisor: string;
    funcionarios: number;
    carteira: string;
    convenio: string;
    tipo: "com-movimento" | "sem-movimento";
  };
}

export interface NovaEmpresaImportacao {
  linhaArquivo: number;
  nome: string;
  cnpj: string;
  analista: string;
  supervisor: string;
  funcionarios: number;
  carteira: string;
  convenio: string;
  tipo: "com-movimento" | "sem-movimento";
}

export interface EmpresaSemAlteracao {
  empresa: Empresa;
  linhaArquivo: number;
  cnpj: string;
  nome: string;
}

export interface ErroImportacao {
  linhaArquivo: number;
  empresa: string;
  cnpj: string;
  campo: string;
  problema: string;
}

export interface PreviaImportacao {
  totalLinhas: number;
  novas: NovaEmpresaImportacao[];
  alteradas: EmpresaParaAtualizar[];
  semAlteracao: EmpresaSemAlteracao[];
  erros: ErroImportacao[];
  nomeArquivo: string;
}

export interface ResultadoProcessamento {
  nomeArquivo: string;
  totalLinhas: number;
  cadastradasCount: number;
  atualizadasCount: number;
  semAlteracaoCount: number;
  errosCount: number;
  novas: NovaEmpresaImportacao[];
  alteradas: EmpresaParaAtualizar[];
  semAlteracao: EmpresaSemAlteracao[];
  erros: ErroImportacao[];
  dataHora: string;
}

/**
 * Normaliza CNPJ removendo pontos, barras, hífens e espaços.
 */
export function normalizarCNPJ(cnpj?: string | null): string {
  if (!cnpj) return "";
  return cnpj.replace(/\D/g, "").trim();
}

/**
 * Formata CNPJ para exibição padrão XX.XXX.XXX/XXXX-XX
 */
export function formatarCNPJ(cnpj: string): string {
  const digits = normalizarCNPJ(cnpj);
  if (digits.length === 14) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    );
  }
  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return cnpj;
}

/**
 * Normaliza texto para comparações (sem acentos, minúsculas, espaços unificados).
 */
function normalizarTexto(texto?: string | null): string {
  return (texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Mapeia cabeçalhos da planilha para as colunas esperadas.
 */
const COLUNAS_ESPERADAS = [
  "Empresa",
  "CNPJ",
  "Analista",
  "Supervisor",
  "Funcionários",
  "Carteira",
  "Convenção",
  "Com ou sem movimento",
];

function mapearCabecalhos(headers: string[]): { [key: string]: number } {
  const map: { [key: string]: number } = {};

  headers.forEach((h, idx) => {
    const limpo = normalizarTexto(h);
    if (!limpo) return;

    if (limpo === "empresa" || limpo === "razao social" || limpo === "nome" || limpo === "razao") {
      map["empresa"] = idx;
    } else if (limpo === "cnpj" || limpo === "cpf/cnpj" || limpo === "cpf cnpj" || limpo === "cpf") {
      map["cnpj"] = idx;
    } else if (limpo === "analista" || limpo === "analista responsavel") {
      map["analista"] = idx;
    } else if (limpo === "supervisor" || limpo === "supervisor responsavel") {
      map["supervisor"] = idx;
    } else if (
      limpo === "funcionarios" ||
      limpo === "qtd funcionarios" ||
      limpo === "numero de funcionarios" ||
      limpo === "colaboradores" ||
      limpo === "vidas"
    ) {
      map["funcionarios"] = idx;
    } else if (limpo === "carteira" || limpo === "grupo carteira") {
      map["carteira"] = idx;
    } else if (
      limpo === "convencao" ||
      limpo === "convencao coletiva" ||
      limpo === "convenio" ||
      limpo === "sindicato"
    ) {
      map["convenio"] = idx;
    } else if (
      limpo === "com ou sem movimento" ||
      limpo === "movimento" ||
      limpo === "situacao" ||
      limpo === "tipo" ||
      limpo === "situacao de movimento"
    ) {
      map["tipo"] = idx;
    }
  });

  return map;
}

/**
 * Lê matriz de células a partir de arquivo (.xlsx, .xls, .csv)
 */
export async function lerMatrizArquivo(file: File): Promise<string[][]> {
  const nome = file.name.toLowerCase();

  if (nome.endsWith(".csv")) {
    const text = await file.text();
    return text
      .split(/\r?\n/)
      .filter((l) => l.trim() !== "")
      .map((l) => {
        // Detecta separador ; ou ,
        const sep = l.includes(";") ? ";" : ",";
        return l.split(sep).map((c) => c.replace(/^["']|["']$/g, "").trim());
      });
  }

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const primeiraAba = wb.SheetNames[0];
  if (!primeiraAba) return [];
  const sheet = wb.Sheets[primeiraAba];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  return rows
    .map((r) => (r as unknown[]).map((c) => (c == null ? "" : String(c).trim())))
    .filter((r) => r.some((c) => c !== ""));
}

/**
 * Processa a planilha de importação e retorna a prévia com diffs e validações.
 */
export async function processarPlanilhaImportacao(
  file: File,
  empresasAtuais: Empresa[],
  opcoes: OpcoesImportacao
): Promise<PreviaImportacao> {
  const matriz = await lerMatrizArquivo(file);

  if (matriz.length < 1) {
    throw new Error("O arquivo selecionado está completamente vazio.");
  }

  const cabecalhosLinha = matriz[0] || [];
  const mapaColunas = mapearCabecalhos(cabecalhosLinha);

  // Validação dos cabeçalhos mínimos obrigatórios
  const faltantes: string[] = [];
  if (mapaColunas["empresa"] === undefined) faltantes.push("Empresa");
  if (mapaColunas["cnpj"] === undefined) faltantes.push("CNPJ");

  if (faltantes.length > 0) {
    throw new Error(
      `Estrutura da planilha inválida. Colunas obrigatórias não encontradas: ${faltantes.join(", ")}. Utilize o modelo padrão fornecido.`
    );
  }

  const cadastrosAnalistas = getAnalistas();
  const cadastrosSupervisores = getSupervisores();
  const cadastrosCarteiras = getCarteiras();

  const cnpjsNoArquivo = new Map<string, number>(); // CNPJ -> primeira linha
  const novas: NovaEmpresaImportacao[] = [];
  const alteradas: EmpresaParaAtualizar[] = [];
  const semAlteracao: EmpresaSemAlteracao[] = [];
  const erros: ErroImportacao[] = [];

  let totalLinhasProcessadas = 0;

  for (let idx = 1; idx < matriz.length; idx++) {
    const linha = matriz[idx];
    if (!linha || linha.every((c) => !c.trim())) continue; // Pula linha em branco

    totalLinhasProcessadas++;
    const numeroLinha = idx + 1; // 1-indexado para o usuário (linha 1 = cabeçalho)

    const rawEmpresa = mapaColunas["empresa"] !== undefined ? (linha[mapaColunas["empresa"]] || "").trim() : "";
    const rawCnpj = mapaColunas["cnpj"] !== undefined ? (linha[mapaColunas["cnpj"]] || "").trim() : "";
    const rawAnalista = mapaColunas["analista"] !== undefined ? (linha[mapaColunas["analista"]] || "").trim() : "";
    const rawSupervisor = mapaColunas["supervisor"] !== undefined ? (linha[mapaColunas["supervisor"]] || "").trim() : "";
    const rawFuncionarios = mapaColunas["funcionarios"] !== undefined ? (linha[mapaColunas["funcionarios"]] || "").trim() : "";
    const rawCarteira = mapaColunas["carteira"] !== undefined ? (linha[mapaColunas["carteira"]] || "").trim() : "";
    const rawConvenio = mapaColunas["convenio"] !== undefined ? (linha[mapaColunas["convenio"]] || "").trim() : "";
    const rawTipo = mapaColunas["tipo"] !== undefined ? (linha[mapaColunas["tipo"]] || "").trim() : "";

    const cnpjLimpo = normalizarCNPJ(rawCnpj);

    // 1. Validação do CNPJ
    if (!cnpjLimpo) {
      erros.push({
        linhaArquivo: numeroLinha,
        empresa: rawEmpresa || "Não informada",
        cnpj: rawCnpj || "(Vazio)",
        campo: "CNPJ",
        problema: "CNPJ não informado ou vazio na linha.",
      });
      continue;
    }

    if (cnpjLimpo.length < 11 || cnpjLimpo.length > 14) {
      erros.push({
        linhaArquivo: numeroLinha,
        empresa: rawEmpresa || "Não informada",
        cnpj: rawCnpj,
        campo: "CNPJ",
        problema: `CNPJ inválido (${cnpjLimpo.length} dígitos encontrados. Deve conter 14 dígitos para PJ ou 11 para PF).`,
      });
      continue;
    }

    // 2. Verificação de duplicidade dentro da própria planilha
    if (cnpjsNoArquivo.has(cnpjLimpo)) {
      const linhaAnterior = cnpjsNoArquivo.get(cnpjLimpo);
      erros.push({
        linhaArquivo: numeroLinha,
        empresa: rawEmpresa || "Não informada",
        cnpj: formatarCNPJ(cnpjLimpo),
        campo: "CNPJ",
        problema: `CNPJ duplicado dentro da própria planilha (já apareceu na linha ${linhaAnterior}).`,
      });
      continue;
    }
    cnpjsNoArquivo.set(cnpjLimpo, numeroLinha);

    // 3. Validação do Nome da Empresa
    if (!rawEmpresa) {
      erros.push({
        linhaArquivo: numeroLinha,
        empresa: "(Vazio)",
        cnpj: formatarCNPJ(cnpjLimpo),
        campo: "Empresa",
        problema: "Razão social / Nome da empresa é obrigatório.",
      });
      continue;
    }

    // 4. Validação de Quantidade de Funcionários
    let numFuncionarios = 0;
    if (rawFuncionarios) {
      const parsed = parseInt(rawFuncionarios.replace(/\D/g, ""), 10);
      if (isNaN(parsed) || parsed < 0) {
        erros.push({
          linhaArquivo: numeroLinha,
          empresa: rawEmpresa,
          cnpj: formatarCNPJ(cnpjLimpo),
          campo: "Funcionários",
          problema: `Quantidade de funcionários inválida ("${rawFuncionarios}"). Deve ser um número maior ou igual a 0.`,
        });
        continue;
      }
      numFuncionarios = parsed;
    }

    // 5. Validação de "Com ou sem movimento"
    let tipoFinal: "com-movimento" | "sem-movimento" = "com-movimento";
    if (rawTipo) {
      const tipoNorm = normalizarTexto(rawTipo);
      if (tipoNorm.includes("sem")) {
        tipoFinal = "sem-movimento";
      } else if (tipoNorm.includes("com") || tipoNorm.includes("movimento") || tipoNorm === "ativa") {
        tipoFinal = "com-movimento";
      } else {
        erros.push({
          linhaArquivo: numeroLinha,
          empresa: rawEmpresa,
          cnpj: formatarCNPJ(cnpjLimpo),
          campo: "Com ou sem movimento",
          problema: `Valor inválido ("${rawTipo}"). Deve ser "Com movimento" ou "Sem movimento".`,
        });
        continue;
      }
    }

    // 6. Validação de Analista existente no cadastro
    if (rawAnalista) {
      const analistaExiste = cadastrosAnalistas.some(
        (a) => normalizarTexto(a.nome) === normalizarTexto(rawAnalista)
      );
      if (!analistaExiste && cadastrosAnalistas.length > 0) {
        erros.push({
          linhaArquivo: numeroLinha,
          empresa: rawEmpresa,
          cnpj: formatarCNPJ(cnpjLimpo),
          campo: "Analista",
          problema: `Analista "${rawAnalista}" não está cadastrado(a) no sistema. Cadastre-o(a) previamente em Cadastros.`,
        });
        continue;
      }
    }

    // 7. Validação de Supervisor existente no cadastro
    if (rawSupervisor) {
      const supervisorExiste = cadastrosSupervisores.some(
        (s) => normalizarTexto(s.nome) === normalizarTexto(rawSupervisor)
      );
      if (!supervisorExiste && cadastrosSupervisores.length > 0) {
        erros.push({
          linhaArquivo: numeroLinha,
          empresa: rawEmpresa,
          cnpj: formatarCNPJ(cnpjLimpo),
          campo: "Supervisor",
          problema: `Supervisor "${rawSupervisor}" não está cadastrado no sistema. Cadastre-o previamente em Cadastros.`,
        });
        continue;
      }
    }

    // 8. Validação de Carteira existente no cadastro
    if (rawCarteira) {
      const carteiraExiste = cadastrosCarteiras.some(
        (c) => normalizarTexto(c.nome) === normalizarTexto(rawCarteira)
      );
      if (!carteiraExiste && cadastrosCarteiras.length > 0) {
        erros.push({
          linhaArquivo: numeroLinha,
          empresa: rawEmpresa,
          cnpj: formatarCNPJ(cnpjLimpo),
          campo: "Carteira",
          problema: `Carteira "${rawCarteira}" não encontrada no sistema. Cadastre-a previamente em Cadastros.`,
        });
        continue;
      }
    }

    // 9. Identificar se empresa já existe no banco pelo CNPJ
    const empresaExistente = empresasAtuais.find(
      (e) => e.cnpj && normalizarCNPJ(e.cnpj) === cnpjLimpo
    );

    if (!empresaExistente) {
      // É UMA NOVA EMPRESA
      novas.push({
        linhaArquivo: numeroLinha,
        nome: rawEmpresa,
        cnpj: formatarCNPJ(cnpjLimpo),
        analista: rawAnalista || "Sistema",
        supervisor: rawSupervisor || "Sistema",
        funcionarios: numFuncionarios,
        carteira: rawCarteira || "Carteira Geral",
        convenio: rawConvenio || "Geral",
        tipo: tipoFinal,
      });
    } else {
      // EMPRESA JÁ EXISTE: COMPARAÇÃO CAMPO A CAMPO (DIFF)
      const alteracoes: AlteracaoCampo[] = [];
      const permitirApagar = opcoes.permitirApagarCamposVazios;

      // Nome / Razão Social
      if (rawEmpresa && rawEmpresa !== empresaExistente.nome) {
        alteracoes.push({
          campo: "nome",
          label: "Razão Social",
          valorAtual: empresaExistente.nome,
          novoValor: rawEmpresa,
        });
      }

      // Analista
      if (rawAnalista) {
        if (rawAnalista !== empresaExistente.analista) {
          alteracoes.push({
            campo: "analista",
            label: "Analista",
            valorAtual: empresaExistente.analista || "—",
            novoValor: rawAnalista,
          });
        }
      } else if (permitirApagar && empresaExistente.analista) {
        alteracoes.push({
          campo: "analista",
          label: "Analista",
          valorAtual: empresaExistente.analista,
          novoValor: "Sistema",
        });
      }

      // Supervisor
      if (rawSupervisor) {
        if (rawSupervisor !== empresaExistente.supervisor) {
          alteracoes.push({
            campo: "supervisor",
            label: "Supervisor",
            valorAtual: empresaExistente.supervisor || "—",
            novoValor: rawSupervisor,
          });
        }
      } else if (permitirApagar && empresaExistente.supervisor) {
        alteracoes.push({
          campo: "supervisor",
          label: "Supervisor",
          valorAtual: empresaExistente.supervisor,
          novoValor: "Sistema",
        });
      }

      // Funcionários
      if (rawFuncionarios !== "") {
        if (numFuncionarios !== empresaExistente.funcionarios) {
          alteracoes.push({
            campo: "funcionarios",
            label: "Funcionários",
            valorAtual: empresaExistente.funcionarios,
            novoValor: numFuncionarios,
          });
        }
      }

      // Carteira
      if (rawCarteira) {
        if (rawCarteira !== empresaExistente.carteira) {
          alteracoes.push({
            campo: "carteira",
            label: "Carteira",
            valorAtual: empresaExistente.carteira || "—",
            novoValor: rawCarteira,
          });
        }
      } else if (permitirApagar && empresaExistente.carteira) {
        alteracoes.push({
          campo: "carteira",
          label: "Carteira",
          valorAtual: empresaExistente.carteira,
          novoValor: "Carteira Geral",
        });
      }

      // Convenção
      if (rawConvenio) {
        if (rawConvenio !== (empresaExistente.convenio || "")) {
          alteracoes.push({
            campo: "convenio",
            label: "Convenção",
            valorAtual: empresaExistente.convenio || "—",
            novoValor: rawConvenio,
          });
        }
      } else if (permitirApagar && empresaExistente.convenio) {
        alteracoes.push({
          campo: "convenio",
          label: "Convenção",
          valorAtual: empresaExistente.convenio,
          novoValor: "",
        });
      }

      // Com ou sem movimento
      if (rawTipo) {
        const tipoAtual = empresaExistente.tipo || "com-movimento";
        if (tipoFinal !== tipoAtual) {
          alteracoes.push({
            campo: "tipo",
            label: "Situação",
            valorAtual: tipoAtual === "sem-movimento" ? "Sem movimento" : "Com movimento",
            novoValor: tipoFinal === "sem-movimento" ? "Sem movimento" : "Com movimento",
          });
        }
      }

      // Define os dados finais a serem salvos
      const nomeSalvar = rawEmpresa || empresaExistente.nome;
      const analistaSalvar = rawAnalista || (permitirApagar ? "Sistema" : empresaExistente.analista);
      const supervisorSalvar = rawSupervisor || (permitirApagar ? "Sistema" : empresaExistente.supervisor);
      const funcionariosSalvar = rawFuncionarios !== "" ? numFuncionarios : empresaExistente.funcionarios;
      const carteiraSalvar = rawCarteira || (permitirApagar ? "Carteira Geral" : empresaExistente.carteira);
      const convenioSalvar = rawConvenio || (permitirApagar ? "" : empresaExistente.convenio || "");
      const tipoSalvar = rawTipo ? tipoFinal : (empresaExistente.tipo || "com-movimento");

      if (alteracoes.length > 0) {
        alteradas.push({
          empresaExistente,
          linhaArquivo: numeroLinha,
          cnpj: formatarCNPJ(cnpjLimpo),
          nome: nomeSalvar,
          alteracoes,
          novosDados: {
            nome: nomeSalvar,
            cnpj: formatarCNPJ(cnpjLimpo),
            analista: analistaSalvar,
            supervisor: supervisorSalvar,
            funcionarios: funcionariosSalvar,
            carteira: carteiraSalvar,
            convenio: convenioSalvar,
            tipo: tipoSalvar,
          },
        });
      } else {
        semAlteracao.push({
          empresa: empresaExistente,
          linhaArquivo: numeroLinha,
          cnpj: formatarCNPJ(cnpjLimpo),
          nome: empresaExistente.nome,
        });
      }
    }
  }

  return {
    totalLinhas: totalLinhasProcessadas,
    novas,
    alteradas,
    semAlteracao,
    erros,
    nomeArquivo: file.name,
  };
}

/**
 * Exporta as empresas cadastradas para planilha Excel (.xlsx).
 */
export function exportarEmpresasParaExcel(empresas: Empresa[]) {
  const dadosExportacao = empresas.map((e) => ({
    Empresa: e.nome || "",
    CNPJ: e.cnpj || "",
    Analista: e.analista || "",
    Supervisor: e.supervisor || "",
    Funcionários: Number(e.funcionarios) || 0,
    Carteira: e.carteira || "",
    Convenção: e.convenio || "",
    "Com ou sem movimento": e.tipo === "sem-movimento" ? "Sem movimento" : "Com movimento",
  }));

  const worksheet = XLSX.utils.json_to_sheet(dadosExportacao, {
    header: COLUNAS_ESPERADAS,
  });

  // Ajusta largura visual das colunas
  worksheet["!cols"] = [
    { wch: 35 }, // Empresa
    { wch: 22 }, // CNPJ
    { wch: 24 }, // Analista
    { wch: 24 }, // Supervisor
    { wch: 15 }, // Funcionários
    { wch: 20 }, // Carteira
    { wch: 22 }, // Convenção
    { wch: 24 }, // Com ou sem movimento
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Empresas");

  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  const nomeArquivo = `empresas_dp_control_center_${yyyy}-${mm}-${dd}.xlsx`;

  XLSX.writeFile(workbook, nomeArquivo);
}

/**
 * Gera e faz download do modelo vazio (.xlsx) com cabeçalhos padrão e linhas de exemplo.
 */
export function gerarModeloImportacaoExcel() {
  const linhasExemplo = [
    {
      Empresa: "Empresa Exemplo Alpha Ltda",
      CNPJ: "12.345.678/0001-90",
      Analista: "Camila Rocha",
      Supervisor: "Paulo Serra",
      Funcionários: 25,
      Carteira: "Carteira Geral",
      Convenção: "SINDCON - Comércio",
      "Com ou sem movimento": "Com movimento",
    },
    {
      Empresa: "Beta Serviços Administrativos ME",
      CNPJ: "98.765.432/0001-10",
      Analista: "Mariana Silva",
      Supervisor: "Carlos Eduardo",
      Funcionários: 8,
      Carteira: "Carteira Geral",
      Convenção: "SINTEC - Tecnologia",
      "Com ou sem movimento": "Sem movimento",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(linhasExemplo, {
    header: COLUNAS_ESPERADAS,
  });

  worksheet["!cols"] = [
    { wch: 35 },
    { wch: 22 },
    { wch: 24 },
    { wch: 24 },
    { wch: 15 },
    { wch: 20 },
    { wch: 22 },
    { wch: 24 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo_Empresas");

  XLSX.writeFile(workbook, "modelo_importacao_empresas.xlsx");
}

/**
 * Gera e faz download do relatório de processamento em Excel (.xlsx).
 */
export function gerarRelatorioProcessamentoExcel(resultado: ResultadoProcessamento) {
  const workbook = XLSX.utils.book_new();

  // Aba 1: Resumo Geral
  const resumo = [
    { Indicador: "Arquivo Processado", Valor: resultado.nomeArquivo },
    { Indicador: "Data / Hora", Valor: resultado.dataHora },
    { Indicador: "Total de Linhas", Valor: resultado.totalLinhas },
    { Indicador: "Novas Empresas Cadastradas", Valor: resultado.cadastradasCount },
    { Indicador: "Empresas Atualizadas", Valor: resultado.atualizadasCount },
    { Indicador: "Empresas Sem Alteração", Valor: resultado.semAlteracaoCount },
    { Indicador: "Registros com Erro", Valor: resultado.errosCount },
  ];
  const wsResumo = XLSX.utils.json_to_sheet(resumo);
  wsResumo["!cols"] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, wsResumo, "Resumo");

  // Aba 2: Detalhe das Alterações
  if (resultado.alteradas.length > 0) {
    const linhasAlteradas: Array<Record<string, string | number>> = [];
    for (const alt of resultado.alteradas) {
      for (const c of alt.alteracoes) {
        linhasAlteradas.push({
          Linha: alt.linhaArquivo,
          Empresa: alt.nome,
          CNPJ: alt.cnpj,
          Campo: c.label,
          "Valor Anterior": c.valorAtual,
          "Novo Valor": c.novoValor,
        });
      }
    }
    const wsAlteradas = XLSX.utils.json_to_sheet(linhasAlteradas);
    wsAlteradas["!cols"] = [
      { wch: 8 },
      { wch: 35 },
      { wch: 20 },
      { wch: 18 },
      { wch: 30 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsAlteradas, "Alterações");
  }

  // Aba 3: Novas Empresas
  if (resultado.novas.length > 0) {
    const linhasNovas = resultado.novas.map((n) => ({
      Linha: n.linhaArquivo,
      Empresa: n.nome,
      CNPJ: n.cnpj,
      Analista: n.analista,
      Supervisor: n.supervisor,
      Funcionários: n.funcionarios,
      Carteira: n.carteira,
      Convenção: n.convenio,
      "Com ou sem movimento": n.tipo === "sem-movimento" ? "Sem movimento" : "Com movimento",
    }));
    const wsNovas = XLSX.utils.json_to_sheet(linhasNovas);
    wsNovas["!cols"] = [
      { wch: 8 },
      { wch: 35 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsNovas, "Novas Cadastradas");
  }

  // Aba 4: Erros e Inconsistências
  if (resultado.erros.length > 0) {
    const linhasErros = resultado.erros.map((e) => ({
      Linha: e.linhaArquivo,
      Empresa: e.empresa,
      CNPJ: e.cnpj,
      Campo: e.campo,
      "Problema Encontrado": e.problema,
    }));
    const wsErros = XLSX.utils.json_to_sheet(linhasErros);
    wsErros["!cols"] = [
      { wch: 8 },
      { wch: 35 },
      { wch: 20 },
      { wch: 18 },
      { wch: 60 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsErros, "Erros");
  }

  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  const nomeArquivo = `relatorio_importacao_dp_control_${yyyy}-${mm}-${dd}.xlsx`;

  XLSX.writeFile(workbook, nomeArquivo);
}
