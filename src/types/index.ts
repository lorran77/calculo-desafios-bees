export interface PedidoItem {
  "ID Pedido": string;
  "Data de criação": string;
  "Free Good/ Bonificação": string;
  "Itens/Sku": string;
  "Descrição": string;
  "Quant. Item": number;
  "Canal": string;
  "Valor total": number;
  "Desafio": "SIM" | "NÃO";
}

export interface Descartes {
  situacaoPedido: number;
  descOperacao: number;
  situacaoItem: number;
  situacaoNf: number;
  canal: number;
  periodo: number;
  dataInvalida: number;
}

export interface ValorDescartadoAgrupado {
  valor: string;
  contagem: number;
}

export interface RegraDescarteDetalhada {
  campo: string;
  regraEsperada: string;
  totalDescartado: number;
  valoresDistintos: ValorDescartadoAgrupado[];
}

export interface SkuForaDesafio {
  sku: string;
  descricao: string;
  contagem: number;
  valorTotal: number;
}

export interface DescartesDetalhados {
  regras: RegraDescarteDetalhada[];
  skusForaDesafio: SkuForaDesafio[];
}

export interface SkuSummary {
  sku: string;
  descricao: string;
  qtdTotal: number;
  valorTotal: number;
  pedidosUnicos: number;
  percentualDesafio: number;
}

export interface ApuracaoResultado {
  pedidos: PedidoItem[];
  itensDesafio: PedidoItem[];
  totalApurado: number;
  meta: number;
  diferenca: number;
  percentual: number;
  cumpriu: boolean;
  qtdLinhasConsideradas: number;
  qtdLinhasDesafio: number;
  pedidosUnicosCount: number;
  ticketMedioDesafio: number;
  descartes: Descartes;
  descartesDetalhados: DescartesDetalhados;
  skusSummary: SkuSummary[];
  nomeCliente: string;
  mes: number;
  ano: number;
  tipoCliente: string;
  dataCalculo: string;
}

export interface SkuPreset {
  id: string;
  name: string;
  description?: string;
  skus: string[];
  isDefault?: boolean;
  createdAt: number;
}
