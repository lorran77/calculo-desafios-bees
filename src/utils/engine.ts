import * as XLSX from "xlsx";
import {
  ApuracaoResultado,
  Descartes,
  DescartesDetalhados,
  PedidoItem,
  RegraDescarteDetalhada,
  SkuForaDesafio,
  SkuSummary,
  ValorDescartadoAgrupado,
} from "../types";
import { formatBRL, parseBRL } from "./currency";
import { normalizeSku } from "./presets";

export const COLUNAS_OBRIGATORIAS_CDD = [
  "Número pedido cliente",
  "Data entrada",
  "Desc. operação",
  "Cód. produto",
  "Desc. produto",
  "Quant. venda",
  "Canal origem",
  "Valor sem ADF",
  "Situação pedido",
  "Situação item",
  "Situação NF",
];

export function removerAcentos(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function sanitizarMojibake(str: string): string {
  return str
    .replace(/Ã¡/g, "á")
    .replace(/Ã /g, "à")
    .replace(/Ã¢/g, "â")
    .replace(/Ã£/g, "ã")
    .replace(/Ã©/g, "é")
    .replace(/Ãª/g, "ê")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ã´/g, "ô")
    .replace(/Ãµ/g, "õ")
    .replace(/Ãº/g, "ú")
    .replace(/Ã§/g, "ç")
    .replace(/Ã/g, "Á")
    .replace(/Ã€/g, "À")
    .replace(/Ã‚/g, "Â")
    .replace(/Ãƒ/g, "Ã")
    .replace(/Ã‰/g, "É")
    .replace(/ÃŠ/g, "Ê")
    .replace(/Ã“/g, "Ó")
    .replace(/Ã”/g, "Ô")
    .replace(/Ã•/g, "Õ")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã‡/g, "Ç");
}

export function normalizarChave(str: string): string {
  return removerAcentos(sanitizarMojibake(str.toLowerCase()))
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const MAPEAMENTOS_ALIAS: Record<string, string[]> = {
  idPedido: [
    "Número pedido cliente",
    "Numero pedido cliente",
    "ID Pedido",
    "Num Pedido",
    "Pedido",
    "Número pedido",
    "Numero pedido",
    "Num. pedido",
  ],
  dataEntrada: [
    "Data entrada",
    "Data Entrada",
    "Data de criação",
    "Data de criacao",
    "Data",
    "Data entrega",
  ],
  descOperacao: [
    "Desc. operação",
    "Desc. operacao",
    "Desc operacao",
    "Operação",
    "Operacao",
    "Tipo Operacao",
    "Free Good/ Bonificação",
    "Free Good/ Bonificacao",
    "Desc. tipo movimento",
  ],
  codProduto: [
    "Cód. produto",
    "Cod. produto",
    "Cod produto",
    "Cód produto",
    "Itens/Sku",
    "SKU",
    "Sku",
    "Cód. Produto",
    "Codigo Produto",
    "Código produto",
  ],
  descProduto: [
    "Desc. produto",
    "Desc. Produto",
    "Desc produto",
    "Descrição",
    "Descricao",
    "Nome Produto",
  ],
  quantVenda: [
    "Quant. venda",
    "Quant. Venda",
    "Quant venda",
    "Quant. Item",
    "Qtd",
    "Quantidade",
    "Quant",
  ],
  canalOrigem: [
    "Canal origem",
    "Canal Origem",
    "Canal",
    "Origem",
    "Tipo canal origem",
  ],
  valorSemAdf: [
    "Valor sem ADF",
    "Valor Sem ADF",
    "Valor sem adf",
    "Valor líquido item",
    "Valor liquido item",
    "Valor total",
    "Valor Total",
    "Valor Líquido",
    "Valor",
  ],
  situacaoPedido: [
    "Situação pedido",
    "Situacao pedido",
    "Situacao Pedido",
    "Status Pedido",
    "Situação Pedido",
    "Situação atend. pedido",
  ],
  situacaoItem: [
    "Situação item",
    "Situacao item",
    "Situacao Item",
    "Status Item",
    "Situação Item",
    "Situação atend. item",
  ],
  situacaoNf: [
    "Situação NF",
    "Situacao NF",
    "Status NF",
    "Situação Nf",
    "Situacao Nf",
    "Situação da NF",
  ],
};

function resolverColuna(objeto: Record<string, any>, aliases: string[]): string | undefined {
  const chaves = Object.keys(objeto);

  // 1. Tenta correspondência exata ou case-insensitive
  for (const alias of aliases) {
    const chaveEncontrada = chaves.find(
      (c) => c.trim().toLowerCase() === alias.trim().toLowerCase()
    );
    if (chaveEncontrada) return chaveEncontrada;
  }

  // 2. Tenta correspondência normalizada (sem acentos, sem pontuação, sem espaços)
  const aliasesNorm = aliases.map(normalizarChave);
  for (const chave of chaves) {
    const chaveLimpa = limparBOM(chave).trim();
    const chaveNorm = normalizarChave(chaveLimpa);
    if (aliasesNorm.includes(chaveNorm)) {
      return chave;
    }
  }

  // 3. Tenta inclusão parcial caso o nome da coluna contenha o alias
  for (const alias of aliases) {
    const aliasNorm = normalizarChave(alias);
    if (aliasNorm.length < 5) continue;
    const chaveParcial = chaves.find((c) => {
      const cNorm = normalizarChave(limparBOM(c));
      return cNorm.includes(aliasNorm) || aliasNorm.includes(cNorm);
    });
    if (chaveParcial) return chaveParcial;
  }

  return undefined;
}

export function limparBOM(texto: string): string {
  return texto.replace(/^(\uFEFF|ï»¿|\uEFBB|\uBFBD)+/, "");
}

export function detectarDelimitador(primeiraLinha: string): string {
  const qtdPV = (primeiraLinha.match(/;/g) || []).length;
  const qtdV = (primeiraLinha.match(/,/g) || []).length;
  const qtdTab = (primeiraLinha.match(/\t/g) || []).length;
  if (qtdTab > qtdPV && qtdTab > qtdV) return "\t";
  return qtdPV >= qtdV ? ";" : ",";
}

export function parseCSVTexto(texto: string, delimitador: string): string[][] {
  const linhas: string[][] = [];
  let linhaAtual: string[] = [];
  let campoAtual = "";
  let dentroDeAspas = false;
  let i = 0;
  const tam = texto.length;

  while (i < tam) {
    const c = texto[i];
    if (dentroDeAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campoAtual += '"';
          i += 2;
          continue;
        }
        dentroDeAspas = false;
        i++;
        continue;
      }
      campoAtual += c;
      i++;
      continue;
    }
    if (c === '"') {
      dentroDeAspas = true;
      i++;
      continue;
    }
    if (c === delimitador) {
      linhaAtual.push(campoAtual);
      campoAtual = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      linhaAtual.push(campoAtual);
      linhas.push(linhaAtual);
      linhaAtual = [];
      campoAtual = "";
      i++;
      continue;
    }
    campoAtual += c;
    i++;
  }
  if (campoAtual.length > 0 || linhaAtual.length > 0) {
    linhaAtual.push(campoAtual);
    linhas.push(linhaAtual);
  }
  return linhas;
}

export interface ParseDataResultado {
  dia: number;
  mes: number;
  ano: number;
}

export function parseDataGenerica(valor: any): ParseDataResultado | null {
  if (valor === null || valor === undefined || valor === "") return null;

  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return {
      dia: valor.getDate(),
      mes: valor.getMonth() + 1,
      ano: valor.getFullYear(),
    };
  }

  if (typeof valor === "number" || (/^\d{5}$/.test(String(valor).trim()) && Number(valor) > 30000)) {
    try {
      const parsedDate = XLSX.SSF.parse_date_code(Number(valor));
      if (parsedDate) {
        return {
          dia: parsedDate.d,
          mes: parsedDate.m,
          ano: parsedDate.y,
        };
      }
    } catch {
      // continua
    }
  }

  const str = String(valor).trim();
  const parteData = str.split(" ")[0].split("T")[0];

  if (parteData.includes("/") || parteData.includes("-")) {
    const separador = parteData.includes("/") ? "/" : "-";
    const partes = parteData.split(separador);

    if (partes.length === 3 && partes[2].length === 4) {
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10);
      const ano = parseInt(partes[2], 10);
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
        return { dia, mes, ano };
      }
    }

    if (partes.length === 3 && partes[0].length === 4) {
      const ano = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10);
      const dia = parseInt(partes[2], 10);
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
        return { dia, mes, ano };
      }
    }
  }

  return null;
}

export async function lerArquivoGenerico(file: File): Promise<{
  registros: Record<string, any>[];
  totalLinhas: number;
  colunas: string[];
}> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "xlsx" || ext === "xls") {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
    const nomePrimeiraAba = workbook.SheetNames[0];
    if (!nomePrimeiraAba) throw new Error("A planilha não contém nenhuma aba.");

    const sheet = workbook.Sheets[nomePrimeiraAba];
    const json: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    });

    if (json.length === 0) {
      throw new Error("A planilha selecionada está vazia.");
    }

    const colunas = Object.keys(json[0] || {});
    return {
      registros: json,
      totalLinhas: json.length,
      colunas,
    };
  } else {
    const buffer = await file.arrayBuffer();
    let texto = "";

    // 1. Tenta decodificar como UTF-8 estrito primeiro
    try {
      texto = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      // Se não for UTF-8 válido, tenta Windows-1252 / ISO-8859-1
      try {
        texto = new TextDecoder("windows-1252").decode(buffer);
      } catch {
        texto = new TextDecoder("utf-8").decode(buffer);
      }
    }

    // Se o texto tiver caractere de substituição (erro de UTF-8), tenta windows-1252
    if (texto.includes("\uFFFD")) {
      try {
        const textoWin = new TextDecoder("windows-1252").decode(buffer);
        if (!textoWin.includes("\uFFFD")) {
          texto = textoWin;
        }
      } catch {
        // mantém
      }
    }

    texto = limparBOM(texto);
    const primeiraLinha = texto.split("\n", 1)[0] || "";
    const delimitador = detectarDelimitador(primeiraLinha);
    const linhas = parseCSVTexto(texto, delimitador).filter(
      (l) => !(l.length === 1 && l[0].trim() === "")
    );

    if (linhas.length < 2) {
      throw new Error("O arquivo CSV não contém linhas de dados válidas.");
    }

    const cabecalho = linhas[0].map((h) => limparBOM(h).trim());
    const registros: Record<string, any>[] = [];

    for (let i = 1; i < linhas.length; i++) {
      const valores = linhas[i];
      if (valores.length === 1 && valores[0].trim() === "") continue;
      const obj: Record<string, any> = {};
      for (let j = 0; j < cabecalho.length; j++) {
        obj[cabecalho[j]] = (valores[j] !== undefined ? valores[j] : "").trim();
      }
      registros.push(obj);
    }

    return {
      registros,
      totalLinhas: registros.length,
      colunas: cabecalho,
    };
  }
}

/**
 * Executa a lógica de apuração do desafio BEES formato CDD
 * e mapeia valores distintos deletados/descartados por critério
 */
export function processarDesafioBEES(
  registros: Record<string, any>[],
  skusDesafioLista: string[],
  mes: number,
  ano: number,
  meta: number,
  nomeCliente: string = "",
  tipoCliente: string = "CDD"
): ApuracaoResultado {
  if (registros.length === 0) {
    throw new Error("Nenhum dado encontrado para processamento.");
  }

  // Verifica mapeamento das colunas
  const primeiro = registros[0];
  const colIdPedido = resolverColuna(primeiro, MAPEAMENTOS_ALIAS.idPedido);
  const colDataEntrada = resolverColuna(primeiro, MAPEAMENTOS_ALIAS.dataEntrada);
  const colDescOperacao = resolverColuna(primeiro, MAPEAMENTOS_ALIAS.descOperacao);
  const colCodProduto = resolverColuna(primeiro, MAPEAMENTOS_ALIAS.codProduto);
  const colDescProduto = resolverColuna(primeiro, MAPEAMENTOS_ALIAS.descProduto);
  const colQuantVenda = resolverColuna(primeiro, MAPEAMENTOS_ALIAS.quantVenda);
  const colCanalOrigem = resolverColuna(primeiro, MAPEAMENTOS_ALIAS.canalOrigem);
  const colValorSemAdf = resolverColuna(primeiro, MAPEAMENTOS_ALIAS.valorSemAdf);
  const colSituacaoPedido = resolverColuna(primeiro, MAPEAMENTOS_ALIAS.situacaoPedido);
  const colSituacaoItem = resolverColuna(primeiro, MAPEAMENTOS_ALIAS.situacaoItem);
  const colSituacaoNf = resolverColuna(primeiro, MAPEAMENTOS_ALIAS.situacaoNf);

  const colunasFaltando: string[] = [];
  if (!colIdPedido) colunasFaltando.push("Número pedido cliente");
  if (!colDataEntrada) colunasFaltando.push("Data entrada");
  if (!colDescOperacao) colunasFaltando.push("Desc. operação");
  if (!colCodProduto) colunasFaltando.push("Cód. produto / SKU");
  if (!colValorSemAdf) colunasFaltando.push("Valor sem ADF");
  if (!colSituacaoPedido) colunasFaltando.push("Situação pedido");
  if (!colSituacaoItem) colunasFaltando.push("Situação item");
  if (!colSituacaoNf) colunasFaltando.push("Situação NF");
  if (!colCanalOrigem) colunasFaltando.push("Canal origem");

  if (colunasFaltando.length > 0) {
    throw new Error(
      `O arquivo enviado não contém as colunas necessárias para apuração CDD: ${colunasFaltando.join(", ")}`
    );
  }

  const skusSet = new Set(skusDesafioLista.map((s) => normalizeSku(s)).filter(Boolean));
  const pedidos: PedidoItem[] = [];

  const descartes: Descartes = {
    situacaoPedido: 0,
    descOperacao: 0,
    situacaoItem: 0,
    situacaoNf: 0,
    canal: 0,
    periodo: 0,
    dataInvalida: 0,
  };

  // Mapas para coletar valores distintos descartados sem repetição
  const mapSituacaoPedido = new Map<string, number>();
  const mapDescOperacao = new Map<string, number>();
  const mapSituacaoItem = new Map<string, number>();
  const mapSituacaoNf = new Map<string, number>();
  const mapCanal = new Map<string, number>();
  const mapPeriodo = new Map<string, number>();
  const mapDataInvalida = new Map<string, number>();

  // SKUs que passaram nos 5 filtros e no período, mas não pertenciam ao desafio
  const skusForaDesafioMap = new Map<
    string,
    { descricao: string; contagem: number; valorTotal: number }
  >();

  const normalizarTexto = (val: any) =>
    removerAcentos(sanitizarMojibake(String(val || "")))
      .trim()
      .toUpperCase();

  for (const reg of registros) {
    // 1. Situação pedido === ENTREGUE
    const sitPedido = normalizarTexto(reg[colSituacaoPedido!]);
    if (sitPedido !== "ENTREGUE") {
      descartes.situacaoPedido++;
      const valOriginal = String(reg[colSituacaoPedido!] || "").trim() || "(Vazio / Nulo)";
      mapSituacaoPedido.set(valOriginal, (mapSituacaoPedido.get(valOriginal) || 0) + 1);
      continue;
    }

    // 2. Desc. operação === VENDA DE PRODUTOS
    const operacao = normalizarTexto(reg[colDescOperacao!]);
    if (operacao !== "VENDA DE PRODUTOS") {
      descartes.descOperacao++;
      const valOriginal = String(reg[colDescOperacao!] || "").trim() || "(Vazio / Nulo)";
      mapDescOperacao.set(valOriginal, (mapDescOperacao.get(valOriginal) || 0) + 1);
      continue;
    }

    // 3. Situação item === ENTREGUE
    const sitItem = normalizarTexto(reg[colSituacaoItem!]);
    if (sitItem !== "ENTREGUE") {
      descartes.situacaoItem++;
      const valOriginal = String(reg[colSituacaoItem!] || "").trim() || "(Vazio / Nulo)";
      mapSituacaoItem.set(valOriginal, (mapSituacaoItem.get(valOriginal) || 0) + 1);
      continue;
    }

    // 4. Situação NF === NOTA EMITIDA
    const sitNf = normalizarTexto(reg[colSituacaoNf!]);
    if (sitNf !== "NOTA EMITIDA") {
      descartes.situacaoNf++;
      const valOriginal = String(reg[colSituacaoNf!] || "").trim() || "(Vazio / Nulo)";
      mapSituacaoNf.set(valOriginal, (mapSituacaoNf.get(valOriginal) || 0) + 1);
      continue;
    }

    // 5. Canal origem === BEES
    const canal = normalizarTexto(reg[colCanalOrigem!]);
    if (canal !== "BEES") {
      descartes.canal++;
      const valOriginal = String(reg[colCanalOrigem!] || "").trim() || "(Vazio / Nulo)";
      mapCanal.set(valOriginal, (mapCanal.get(valOriginal) || 0) + 1);
      continue;
    }

    // 6. Data no mês e ano selecionados
    const dataObj = parseDataGenerica(reg[colDataEntrada!]);
    if (!dataObj) {
      descartes.dataInvalida++;
      const valOriginal = String(reg[colDataEntrada!] || "").trim() || "(Data vazia)";
      mapDataInvalida.set(valOriginal, (mapDataInvalida.get(valOriginal) || 0) + 1);
      continue;
    }

    if (dataObj.mes !== mes || dataObj.ano !== ano) {
      descartes.periodo++;
      const valOriginal = `${String(dataObj.mes).padStart(2, "0")}/${dataObj.ano}`;
      mapPeriodo.set(valOriginal, (mapPeriodo.get(valOriginal) || 0) + 1);
      continue;
    }

    // Linha válida aprovada em todos os filtros
    const rawSku = reg[colCodProduto!];
    const skuNorm = normalizeSku(rawSku);
    const pertenceDesafio = skusSet.has(skuNorm);

    const valorTotalNum = parseBRL(reg[colValorSemAdf!]);
    const quantItemNum = parseBRL(reg[colQuantVenda!]);

    if (!pertenceDesafio) {
      const desc = String(reg[colDescProduto!] || "").trim() || `SKU ${skuNorm}`;
      const existing = skusForaDesafioMap.get(skuNorm);
      if (existing) {
        existing.contagem += 1;
        existing.valorTotal += valorTotalNum;
      } else {
        skusForaDesafioMap.set(skuNorm, {
          descricao: desc,
          contagem: 1,
          valorTotal: valorTotalNum,
        });
      }
    }

    // Data formatada para visualização
    const dataFormatada = `${String(dataObj.dia).padStart(2, "0")}/${String(dataObj.mes).padStart(2, "0")}/${dataObj.ano}`;

    const item: PedidoItem = {
      "ID Pedido": String(reg[colIdPedido!] || "").trim(),
      "Data de criação": dataFormatada,
      "Free Good/ Bonificação": String(reg[colDescOperacao!] || "").trim(),
      "Itens/Sku": skuNorm,
      "Descrição": String(reg[colDescProduto!] || "").trim(),
      "Quant. Item": Math.round(quantItemNum * 100) / 100,
      "Canal": String(reg[colCanalOrigem!] || "").trim(),
      "Valor total": Math.round(valorTotalNum * 100) / 100,
      "Desafio": pertenceDesafio ? "SIM" : "NÃO",
    };

    pedidos.push(item);
  }

  // Cálculos consolidados do desafio
  const itensDesafio = pedidos.filter((p) => p.Desafio === "SIM");
  let totalApurado = 0;
  const pedidosUnicosSet = new Set<string>();

  // Agrupamento por SKU para análise profunda do analista
  const skuAgrupado: Record<
    string,
    { descricao: string; qtdTotal: number; valorTotal: number; pedidosSet: Set<string> }
  > = {};

  for (const item of itensDesafio) {
    totalApurado += item["Valor total"];
    if (item["ID Pedido"]) pedidosUnicosSet.add(item["ID Pedido"]);

    const s = item["Itens/Sku"];
    if (!skuAgrupado[s]) {
      skuAgrupado[s] = {
        descricao: item["Descrição"] || `SKU ${s}`,
        qtdTotal: 0,
        valorTotal: 0,
        pedidosSet: new Set(),
      };
    }
    skuAgrupado[s].qtdTotal += item["Quant. Item"];
    skuAgrupado[s].valorTotal += item["Valor total"];
    if (item["ID Pedido"]) skuAgrupado[s].pedidosSet.add(item["ID Pedido"]);
  }

  totalApurado = Math.round(totalApurado * 100) / 100;
  const diferenca = Math.round((totalApurado - meta) * 100) / 100;
  const percentual = meta > 0 ? Math.round((totalApurado / meta) * 1000) / 10 : 0;
  const cumpriu = totalApurado >= meta;

  const skusSummary: SkuSummary[] = Object.entries(skuAgrupado)
    .map(([sku, dados]) => ({
      sku,
      descricao: dados.descricao,
      qtdTotal: Math.round(dados.qtdTotal * 100) / 100,
      valorTotal: Math.round(dados.valorTotal * 100) / 100,
      pedidosUnicos: dados.pedidosSet.size,
      percentualDesafio:
        totalApurado > 0 ? Math.round((dados.valorTotal / totalApurado) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal);

  const ticketMedioDesafio =
    pedidosUnicosSet.size > 0 ? Math.round((totalApurado / pedidosUnicosSet.size) * 100) / 100 : 0;

  // Converte mapas de descarte para arrays ordenados sem repetição (Opção 1)
  const mapParaValores = (mapa: Map<string, number>): ValorDescartadoAgrupado[] =>
    Array.from(mapa.entries())
      .map(([valor, contagem]) => ({ valor, contagem }))
      .sort((a, b) => b.contagem - a.contagem);

  const regrasDetalhadas: RegraDescarteDetalhada[] = [
    {
      campo: "Situação pedido",
      regraEsperada: "Deve ser igual a ENTREGUE",
      totalDescartado: descartes.situacaoPedido,
      valoresDistintos: mapParaValores(mapSituacaoPedido),
    },
    {
      campo: "Desc. operação",
      regraEsperada: "Deve ser igual a VENDA DE PRODUTOS",
      totalDescartado: descartes.descOperacao,
      valoresDistintos: mapParaValores(mapDescOperacao),
    },
    {
      campo: "Situação item",
      regraEsperada: "Deve ser igual a ENTREGUE",
      totalDescartado: descartes.situacaoItem,
      valoresDistintos: mapParaValores(mapSituacaoItem),
    },
    {
      campo: "Situação NF",
      regraEsperada: "Deve ser igual a NOTA EMITIDA",
      totalDescartado: descartes.situacaoNf,
      valoresDistintos: mapParaValores(mapSituacaoNf),
    },
    {
      campo: "Canal origem",
      regraEsperada: "Deve ser igual a BEES",
      totalDescartado: descartes.canal,
      valoresDistintos: mapParaValores(mapCanal),
    },
    {
      campo: "Data entrada (Período)",
      regraEsperada: `Deve estar no período ${String(mes).padStart(2, "0")}/${ano}`,
      totalDescartado: descartes.periodo,
      valoresDistintos: mapParaValores(mapPeriodo),
    },
    {
      campo: "Data entrada (Formato)",
      regraEsperada: "Data válida legível (DD/MM/AAAA ou serial)",
      totalDescartado: descartes.dataInvalida,
      valoresDistintos: mapParaValores(mapDataInvalida),
    },
  ];

  const skusForaDesafio: SkuForaDesafio[] = Array.from(skusForaDesafioMap.entries())
    .map(([sku, dados]) => ({
      sku,
      descricao: dados.descricao,
      contagem: dados.contagem,
      valorTotal: Math.round(dados.valorTotal * 100) / 100,
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal);

  const descartesDetalhados: DescartesDetalhados = {
    regras: regrasDetalhadas,
    skusForaDesafio,
  };

  return {
    pedidos,
    itensDesafio,
    totalApurado,
    meta,
    diferenca,
    percentual,
    cumpriu,
    qtdLinhasConsideradas: pedidos.length,
    qtdLinhasDesafio: itensDesafio.length,
    pedidosUnicosCount: pedidosUnicosSet.size,
    ticketMedioDesafio,
    descartes,
    descartesDetalhados,
    skusSummary,
    nomeCliente,
    mes,
    ano,
    tipoCliente,
    dataCalculo: new Date().toLocaleString("pt-BR"),
  };
}

export const MESES_NOMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function getNomeMes(mesNumero: number): string {
  return MESES_NOMES[mesNumero - 1] || String(mesNumero);
}

/**
 * Exporta para arquivo Excel (.xlsx) profissional com abas estruturadas
 */
export function exportarParaExcel(resultado: ApuracaoResultado): void {
  const wb = XLSX.utils.book_new();

  // Aba 1: Resumo do Desafio
  const dadosResumo = [
    ["AMBEV · BEES APURAÇÃO DE DESAFIO COMERCIAL", ""],
    ["Data da Apuração:", resultado.dataCalculo],
    ["Cliente:", resultado.nomeCliente || "Não informado"],
    ["Tipo de Cliente:", resultado.tipoCliente],
    ["Período do Desafio:", `${getNomeMes(resultado.mes)} / ${resultado.ano}`],
    [""],
    ["INDICADORES PRINCIPAIS", ""],
    ["Meta Contratada (R$):", resultado.meta],
    ["Total Faturado no Desafio (R$):", resultado.totalApurado],
    ["Diferença (R$):", resultado.diferenca],
    ["% Atingido:", `${resultado.percentual}%`],
    ["Status do Desafio:", resultado.cumpriu ? "CUMPRIU A META" : "NÃO CUMPRIU"],
    ["Pedidos Únicos com Itens do Desafio:", resultado.pedidosUnicosCount],
    ["Ticket Médio do Desafio (R$):", resultado.ticketMedioDesafio],
    [""],
    ["AUDITORIA DE PROCESSAMENTO E FILTROS", ""],
    ["Linhas aprovadas nos 5 filtros + período:", resultado.qtdLinhasConsideradas],
    ["Linhas com SKUs do Desafio (SIM):", resultado.qtdLinhasDesafio],
    ["Linhas com outros SKUs (NÃO):", resultado.qtdLinhasConsideradas - resultado.qtdLinhasDesafio],
    [""],
    ["MOTIVOS DE DESCARTE (LINHAS EXCLUÍDAS)", ""],
    ["Situação pedido ≠ ENTREGUE:", resultado.descartes.situacaoPedido],
    ["Desc. operação ≠ VENDA DE PRODUTOS:", resultado.descartes.descOperacao],
    ["Situação item ≠ ENTREGUE:", resultado.descartes.situacaoItem],
    ["Situação NF ≠ NOTA EMITIDA:", resultado.descartes.situacaoNf],
    ["Canal ≠ BEES:", resultado.descartes.canal],
    ["Fora do mês/ano selecionado:", resultado.descartes.periodo],
    ["Data inválida / ilegível:", resultado.descartes.dataInvalida],
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(dadosResumo);
  wsResumo["!cols"] = [{ wch: 38 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Executivo");

  // Aba 2: Todos os itens com coluna Desafio (SIM/NÃO)
  const cabecalhoItens = [
    "ID Pedido",
    "Data de criação",
    "Free Good/ Bonificação",
    "Itens/Sku",
    "Descrição",
    "Quant. Item",
    "Canal",
    "Valor total",
    "Desafio",
  ];

  const linhasItens = [
    cabecalhoItens,
    ...resultado.pedidos.map((p) => [
      p["ID Pedido"],
      p["Data de criação"],
      p["Free Good/ Bonificação"],
      p["Itens/Sku"],
      p["Descrição"],
      p["Quant. Item"],
      p["Canal"],
      p["Valor total"],
      p["Desafio"],
    ]),
  ];

  const wsItens = XLSX.utils.aoa_to_sheet(linhasItens);
  wsItens["!cols"] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 36 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, wsItens, "Base de Pedidos Analisada");

  // Aba 3: Ranking por SKU
  if (resultado.skusSummary.length > 0) {
    const cabecalhoSkus = [
      "SKU",
      "Descrição do Produto",
      "Qtd Total Faturada",
      "Valor Total (R$)",
      "Pedidos Únicos",
      "Participação no Desafio (%)",
    ];

    const linhasSkus = [
      cabecalhoSkus,
      ...resultado.skusSummary.map((s) => [
        s.sku,
        s.descricao,
        s.qtdTotal,
        s.valorTotal,
        s.pedidosUnicos,
        s.percentualDesafio,
      ]),
    ];

    const wsSkus = XLSX.utils.aoa_to_sheet(linhasSkus);
    wsSkus["!cols"] = [
      { wch: 14 },
      { wch: 36 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSkus, "Desempenho por SKU");
  }

  const sanitizadoCliente = (resultado.nomeCliente || "Cliente").replace(/[^a-zA-Z0-9_-]+/g, "_");
  const mesFormatado = String(resultado.mes).padStart(2, "0");
  const nomeArquivo = `Apuracao_Desafio_BEES_${sanitizadoCliente}_${mesFormatado}_${resultado.ano}.xlsx`;

  XLSX.writeFile(wb, nomeArquivo);
}

export function exportarParaCsv(resultado: ApuracaoResultado): void {
  const linhas: (string | number)[][] = [];
  linhas.push(["Cliente", resultado.nomeCliente || "-"]);
  linhas.push(["Mês/Ano do desafio", `${getNomeMes(resultado.mes)}/${resultado.ano}`]);
  linhas.push(["Meta (R$)", formatBRL(resultado.meta)]);
  linhas.push(["Total apurado (R$)", formatBRL(resultado.totalApurado)]);
  linhas.push(["Diferença (R$)", formatBRL(resultado.diferenca)]);
  linhas.push(["% Atingido", `${resultado.percentual.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}%`]);
  linhas.push(["Status", resultado.cumpriu ? "CUMPRIU" : "NÃO CUMPRIU"]);
  linhas.push([]);
  linhas.push([
    "ID Pedido",
    "Data de criação",
    "Free Good/ Bonificação",
    "Itens/Sku",
    "Descrição",
    "Quant. Item",
    "Canal",
    "Valor total",
    "Desafio",
  ]);

  resultado.pedidos.forEach((p) => {
    linhas.push([
      p["ID Pedido"],
      p["Data de criação"],
      p["Free Good/ Bonificação"],
      p["Itens/Sku"],
      p["Descrição"],
      String(p["Quant. Item"]).replace(".", ","),
      p["Canal"],
      formatBRL(p["Valor total"]),
      p["Desafio"],
    ]);
  });

  const csvTexto =
    "\uFEFF" +
    linhas
      .map((linha) =>
        linha
          .map((campo) => {
            const str = campo === undefined || campo === null ? "" : String(campo);
            if (str.includes(";") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(";")
      )
      .join("\r\n");

  const sanitizadoCliente = (resultado.nomeCliente || "Cliente").replace(/[^a-zA-Z0-9_-]+/g, "_");
  const mesFormatado = String(resultado.mes).padStart(2, "0");
  const nomeArquivo = `Calculo_desafio_${sanitizadoCliente}_${mesFormatado}_${resultado.ano}.csv`;

  const blob = new Blob([csvTexto], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function gerarTextoResumo(resultado: ApuracaoResultado): string {
  const statusIcon = resultado.cumpriu ? "✅ META CUMPRIDA" : "⚠️ META NÃO CUMPRIDA";
  const clienteNome = resultado.nomeCliente ? `*${resultado.nomeCliente}*` : "Cliente";

  return `📊 *Apuração de Desafio BEES · ${getNomeMes(resultado.mes)}/${resultado.ano}*
Cliente: ${clienteNome}
Status: *${statusIcon}*

🎯 Meta: R$ ${formatBRL(resultado.meta)}
💰 Faturado no Desafio: R$ ${formatBRL(resultado.totalApurado)}
📈 % Atingido: *${resultado.percentual.toFixed(1)}%*
⚖️ Saldo: ${resultado.diferenca >= 0 ? "+" : ""}R$ ${formatBRL(resultado.diferenca)}

📦 Pedidos no Desafio: ${resultado.pedidosUnicosCount}
🎫 Ticket Médio: R$ ${formatBRL(resultado.ticketMedioDesafio)}
🔍 Linhas Válidas BEES: ${resultado.qtdLinhasConsideradas} (sendo ${resultado.qtdLinhasDesafio} nos SKUs foco)

_Apuração automática de acordo com as regras oficiais de CDD BEES._`;
}
