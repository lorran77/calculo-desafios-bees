/**
 * Formatador e utilitários monetários para o padrão Real Brasileiro (BRL)
 */

export function formatBRL(valor: number): string {
  if (isNaN(valor) || valor === null || valor === undefined) return "0,00";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatBRLWithSymbol(valor: number): string {
  return `R$ ${formatBRL(valor)}`;
}

/**
 * Converte texto monetário BRL ou número para float numérico
 * Ex: "R$ 50.000,00" -> 50000.00
 * Ex: "50000,50" -> 50000.50
 * Ex: "50000" -> 50000.00
 */
export function parseBRL(texto: string | number): number {
  if (typeof texto === "number") return isNaN(texto) ? 0 : texto;
  if (!texto) return 0;

  const limpo = texto
    .replace(/R\$/g, "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");

  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Máscara em tempo real para digitação de moeda (estilo bancário BRL)
 * Ao digitar "5000000", vira "R$ 50.000,00"
 */
export function maskCurrencyInput(valorAtual: string): { display: string; numericValue: number } {
  if (!valorAtual) {
    return { display: "", numericValue: 0 };
  }

  // Remove tudo que não for dígito
  const apenasDigitos = valorAtual.replace(/\D/g, "");

  if (!apenasDigitos || apenasDigitos === "0") {
    return { display: "", numericValue: 0 };
  }

  const centavos = parseInt(apenasDigitos, 10);
  const valorReal = centavos / 100;

  const display = valorReal.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return {
    display,
    numericValue: valorReal,
  };
}

/**
 * Cria a máscara a partir de um valor numérico pré-existente
 */
export function numberToCurrencyMask(valor: number): string {
  if (!valor || valor <= 0) return "";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
