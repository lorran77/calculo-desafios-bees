import { SkuPreset } from "../types";

export const DEFAULT_PRESETS: SkuPreset[] = [];

const STORAGE_KEY = "ambev_bees_sku_user_presets_v2";

export function loadPresets(): SkuPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error("Erro ao carregar grupos salvos:", err);
    return [];
  }
}

export function savePresets(presets: SkuPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.error("Erro ao salvar grupos:", err);
  }
}

/**
 * Normaliza SKU removendo formatações decimais de exportação (ex: 13205.0 -> 13205)
 */
export function normalizeSku(valor: string | number | undefined | null): string {
  if (valor === undefined || valor === null) return "";
  const str = String(valor).trim();
  if (!str) return "";

  // Se for representação de número com decimal como 13205.0 ou 13205,0
  const matchFloat = str.match(/^(\d+)[.,]0+$/);
  if (matchFloat) return matchFloat[1];

  const n = parseFloat(str.replace(",", "."));
  if (!isNaN(n) && /^[0-9.,]+$/.test(str)) {
    return String(Math.trunc(n));
  }
  return str;
}

/**
 * Faz parse de texto livre de SKUs (quebras de linha, vírgulas, ponto e vírgula, espaços, tabs)
 */
export function parseSkuList(textoBruto: string): string[] {
  if (!textoBruto) return [];
  const normalizado = textoBruto.replace(/[,;\t]/g, "\n");
  const skusSet = new Set<string>();

  normalizado.split("\n").forEach((linha) => {
    const limpo = linha.trim();
    if (limpo) {
      const skuNorm = normalizeSku(limpo);
      if (skuNorm) skusSet.add(skuNorm);
    }
  });

  return Array.from(skusSet);
}
