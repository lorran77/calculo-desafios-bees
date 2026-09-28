import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  PackageCheck,
  ShoppingBag,
  RotateCcw,
  FilterX,
} from "lucide-react";
import { ApuracaoResultado } from "../types";
import { formatBRL, formatBRLWithSymbol } from "../utils/currency";
import { exportarParaExcel, exportarParaCsv, gerarTextoResumo, getNomeMes } from "../utils/engine";

interface ResultsDashboardProps {
  resultado: ApuracaoResultado;
  onReset: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ resultado, onReset }) => {
  const [activeTab, setActiveTab] = useState<"itens" | "skus" | "descartes">("itens");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(25);
  const [copiado, setCopiado] = useState(false);

  // Busca para SKUs fora do desafio
  const [buscaSkusFora, setBuscaSkusFora] = useState("");

  // Filtragem dos itens na aba da tabela
  const itensFiltrados = useMemo(() => {
    if (!busca.trim()) return resultado.itensDesafio;
    const termo = busca.toLowerCase().trim();
    return resultado.itensDesafio.filter((item) => {
      return (
        item["ID Pedido"].toLowerCase().includes(termo) ||
        item["Itens/Sku"].toLowerCase().includes(termo) ||
        item["Descrição"].toLowerCase().includes(termo)
      );
    });
  }, [resultado.itensDesafio, busca]);

  const totalPaginas = Math.ceil(itensFiltrados.length / itensPorPagina) || 1;
  const itensPaginados = useMemo(() => {
    const inicio = (pagina - 1) * itensPorPagina;
    return itensFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [itensFiltrados, pagina, itensPorPagina]);

  const skusForaFiltrados = useMemo(() => {
    if (!buscaSkusFora.trim()) return resultado.descartesDetalhados.skusForaDesafio;
    const termo = buscaSkusFora.toLowerCase().trim();
    return resultado.descartesDetalhados.skusForaDesafio.filter((s) => {
      return s.sku.toLowerCase().includes(termo) || s.descricao.toLowerCase().includes(termo);
    });
  }, [resultado.descartesDetalhados.skusForaDesafio, buscaSkusFora]);

  const totalLinhasDescartadas =
    resultado.descartes.situacaoPedido +
    resultado.descartes.descOperacao +
    resultado.descartes.situacaoItem +
    resultado.descartes.situacaoNf +
    resultado.descartes.canal +
    resultado.descartes.periodo +
    resultado.descartes.dataInvalida;

  const handleCopiarResumo = async () => {
    try {
      const texto = gerarTextoResumo(resultado);
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header do Resultado com Status de Cumprimento */}
      <div
        className={`border-2 rounded-xl p-5 sm:p-6 transition-all ${
          resultado.cumpriu
            ? "border-emerald-600 bg-[#121A15]"
            : "border-red-600 bg-[#1A1212]"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#292929]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                  resultado.cumpriu
                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500"
                    : "bg-red-950/80 text-red-300 border border-red-500"
                }`}
              >
                {resultado.cumpriu ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Desafio Cumprido
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    Meta Não Atingida
                  </>
                )}
              </span>
              <span className="text-xs font-semibold text-[#CCCCCC] bg-[#1E1E1E] px-2.5 py-0.5 rounded border border-[#2E2E2E]">
                {resultado.tipoCliente}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {resultado.nomeCliente || "Cliente não informado"}
            </h2>
            <p className="text-xs text-[#8A8A8A]">
              Período: <strong className="text-white">{getNomeMes(resultado.mes)} de {resultado.ano}</strong> · Processado em {resultado.dataCalculo}
            </p>
          </div>

          {/* Botões de Ação de Exportação */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportarParaExcel(resultado)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFC600] hover:bg-[#F59E0B] text-black font-extrabold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Baixar Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => exportarParaCsv(resultado)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#1C1C1C] hover:bg-[#262626] text-white border border-[#333333] font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#8A8A8A]" />
              <span>Baixar CSV (.csv)</span>
            </button>

            <button
              onClick={handleCopiarResumo}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 border font-semibold text-xs rounded-lg transition-all cursor-pointer ${
                copiado
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                  : "bg-[#1C1C1C] hover:bg-[#262626] border-[#333333] text-[#E5E5E5]"
              }`}
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? "Resumo Copiado!" : "Copiar Resumo"}</span>
            </button>

            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-[#1C1C1C] hover:bg-[#262626] text-[#8A8A8A] hover:text-white border border-[#333333] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          </div>
        </div>

        {/* 2. Grid de Métricas Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="bg-[#171717] border border-[#2B2B2B] rounded-lg p-3 sm:p-4">
            <span className="text-xs font-semibold text-[#8A8A8A] block mb-1">Total Faturado</span>
            <div className="text-lg sm:text-2xl font-extrabold text-white font-mono tabular-nums">
              {formatBRLWithSymbol(resultado.totalApurado)}
            </div>
            <span className="text-[11px] text-[#8A8A8A] mt-1 block">
              {resultado.qtdLinhasDesafio} itens de desafio faturados
            </span>
          </div>

          <div className="bg-[#171717] border border-[#2B2B2B] rounded-lg p-3 sm:p-4">
            <span className="text-xs font-semibold text-[#8A8A8A] block mb-1">Meta do Desafio</span>
            <div className="text-lg sm:text-2xl font-extrabold text-white font-mono tabular-nums">
              {formatBRLWithSymbol(resultado.meta)}
            </div>
            <span className="text-[11px] text-[#8A8A8A] mt-1 block">Valor contratado</span>
          </div>

          <div className="bg-[#171717] border border-[#2B2B2B] rounded-lg p-3 sm:p-4">
            <span className="text-xs font-semibold text-[#8A8A8A] block mb-1">% da Meta Atingido</span>
            <div
              className={`text-lg sm:text-2xl font-extrabold font-mono tabular-nums ${
                resultado.cumpriu ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {resultado.percentual.toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              %
            </div>
            <div className="w-full bg-[#262626] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  resultado.cumpriu ? "bg-emerald-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, resultado.percentual))}%` }}
              />
            </div>
          </div>

          <div className="bg-[#171717] border border-[#2B2B2B] rounded-lg p-3 sm:p-4">
            <span className="text-xs font-semibold text-[#8A8A8A] block mb-1">
              {resultado.diferenca >= 0 ? "Superávit (Meta batida)" : "Faltante para Meta"}
            </span>
            <div
              className={`text-lg sm:text-2xl font-extrabold font-mono tabular-nums ${
                resultado.diferenca >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {resultado.diferenca >= 0 ? "+" : ""}
              {formatBRLWithSymbol(resultado.diferenca)}
            </div>
            <span className="text-[11px] text-[#8A8A8A] mt-1 block">Diferença matemática</span>
          </div>
        </div>

        {/* Métricas secundárias analíticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-[#262626] text-xs">
          <div className="flex items-center gap-2 text-[#8A8A8A]">
            <ShoppingBag className="w-4 h-4 text-[#FFC600]" />
            <span>
              Pedidos únicos no desafio:{" "}
              <strong className="text-white font-mono">{resultado.pedidosUnicosCount}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#8A8A8A]">
            <TrendingUp className="w-4 h-4 text-[#FFC600]" />
            <span>
              Ticket médio dos pedidos:{" "}
              <strong className="text-white font-mono">
                {formatBRLWithSymbol(resultado.ticketMedioDesafio)}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#8A8A8A]">
            <PackageCheck className="w-4 h-4 text-[#FFC600]" />
            <span>
              Linhas válidas BEES CDD:{" "}
              <strong className="text-white font-mono">{resultado.qtdLinhasConsideradas}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navegação por Abas */}
      <div className="bg-[#141414] border border-[#292929] rounded-xl overflow-hidden">
        <div className="flex border-b border-[#292929] bg-[#181818] px-4 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("itens")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "itens"
                ? "border-[#FFC600] text-[#FFC600]"
                : "border-transparent text-[#8A8A8A] hover:text-white"
            }`}
          >
            Itens no Desafio ({resultado.qtdLinhasDesafio})
          </button>
          <button
            onClick={() => setActiveTab("skus")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "skus"
                ? "border-[#FFC600] text-[#FFC600]"
                : "border-transparent text-[#8A8A8A] hover:text-white"
            }`}
          >
            Desempenho por SKU ({resultado.skusSummary.length})
          </button>
          <button
            onClick={() => setActiveTab("descartes")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "descartes"
                ? "border-[#FFC600] text-[#FFC600]"
                : "border-transparent text-[#8A8A8A] hover:text-white"
            }`}
          >
            Backlog de Valores Descartados ({totalLinhasDescartadas})
          </button>
        </div>

        {/* CONTEÚDO DA ABA 1: ITENS NO DESAFIO */}
        {activeTab === "itens" && (
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#666666]" />
                <input
                  type="text"
                  placeholder="Filtrar por pedido, SKU ou descrição..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPagina(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#1A1A1A] border border-[#333333] rounded-md text-white placeholder-[#737373] focus:outline-none focus:border-[#FFC600]"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-[#8A8A8A]">
                <span>Exibir:</span>
                <select
                  value={itensPorPagina}
                  onChange={(e) => {
                    setItensPorPagina(Number(e.target.value));
                    setPagina(1);
                  }}
                  className="bg-[#1A1A1A] border border-[#333333] rounded px-2 py-1 text-xs text-white"
                >
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                  <option value={500}>500 por página</option>
                </select>
                <span className="font-mono">
                  {itensFiltrados.length} {itensFiltrados.length === 1 ? "linha" : "linhas"}
                </span>
              </div>
            </div>

            <div className="border border-[#292929] rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#202020] text-[#CCCCCC] font-semibold">
                    <th className="py-2.5 px-3">ID Pedido</th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3 text-right">Qtd</th>
                    <th className="py-2.5 px-3 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242424]">
                  {itensPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#8A8A8A]">
                        Nenhum item encontrado com o filtro "{busca}".
                      </td>
                    </tr>
                  ) : (
                    itensPaginados.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#1C1C1C] transition-colors">
                        <td className="py-2 px-3 font-mono font-medium text-white">
                          {item["ID Pedido"]}
                        </td>
                        <td className="py-2 px-3 font-mono text-[#8A8A8A]">
                          {item["Data de criação"]}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-[#FFC600]">
                          {item["Itens/Sku"]}
                        </td>
                        <td className="py-2 px-3 text-[#E5E5E5] max-w-xs truncate" title={item["Descrição"]}>
                          {item["Descrição"]}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-[#CCCCCC]">
                          {item["Quant. Item"]}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-white">
                          R$ {formatBRL(item["Valor total"])}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-[#8A8A8A]">
                  Página <strong className="font-mono text-white">{pagina}</strong> de{" "}
                  <strong className="font-mono text-white">{totalPaginas}</strong>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    disabled={pagina === 1}
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    className="p-1 rounded border border-[#333333] text-[#CCCCCC] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#242424] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pagina === totalPaginas}
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    className="p-1 rounded border border-[#333333] text-[#CCCCCC] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#242424] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTEÚDO DA ABA 2: DESEMPENHO POR SKU */}
        {activeTab === "skus" && (
          <div className="p-4 space-y-4">
            <div className="text-xs text-[#8A8A8A]">
              Ranking de participação de cada SKU no faturamento apurado do desafio:
            </div>

            <div className="border border-[#292929] rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#202020] text-[#CCCCCC] font-semibold">
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Descrição do Produto</th>
                    <th className="py-2.5 px-3 text-right">Qtd Faturada</th>
                    <th className="py-2.5 px-3 text-right">Pedidos Únicos</th>
                    <th className="py-2.5 px-3 text-right">Total Faturado</th>
                    <th className="py-2.5 px-3 text-right">% do Desafio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242424]">
                  {resultado.skusSummary.map((skuItem, idx) => (
                    <tr key={idx} className="hover:bg-[#1C1C1C] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#FFC600]">
                        {skuItem.sku}
                      </td>
                      <td className="py-2.5 px-3 text-white font-medium">
                        {skuItem.descricao}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#CCCCCC]">
                        {skuItem.qtdTotal.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#CCCCCC]">
                        {skuItem.pedidosUnicos}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-white">
                        R$ {formatBRL(skuItem.valorTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#FFC600]">
                        {skuItem.percentualDesafio.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 3: BACKLOG DE VALORES DESCARTADOS (OPÇÃO 1) */}
        {activeTab === "descartes" && (
          <div className="p-4 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242424] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FilterX className="w-4 h-4 text-[#FFC600]" />
                  Valores Distintos Descartados por Campo e Regra
                </h3>
                <p className="text-xs text-[#8A8A8A] mt-0.5">
                  Lista deduplicada (sem repetição de valores) mostrando exatamente o que continha na planilha que causou a exclusão das linhas.
                </p>
              </div>
              <div className="text-xs text-[#CCCCCC] bg-[#1E1E1E] px-3 py-1.5 rounded border border-[#2E2E2E] font-mono shrink-0">
                Total excluído: <span className="text-red-400 font-bold">{totalLinhasDescartadas.toLocaleString("pt-BR")}</span> linhas
              </div>
            </div>

            {/* TABELA DE VALORES DISTINTOS POR REGRA */}
            <div className="border border-[#292929] rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#202020] text-[#CCCCCC] font-semibold">
                    <th className="py-2.5 px-3 w-44">Campo / Regra</th>
                    <th className="py-2.5 px-3 w-56">Critério Exigido</th>
                    <th className="py-2.5 px-3">Valores Distintos Encontrados na Planilha que foram Excluídos</th>
                    <th className="py-2.5 px-3 text-right w-36">Linhas Excluídas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242424]">
                  {resultado.descartesDetalhados.regras.map((regra, idx) => (
                    <tr key={idx} className="hover:bg-[#1A1A1A] transition-colors align-top">
                      <td className="py-3 px-3 font-semibold text-white">
                        {regra.campo}
                      </td>
                      <td className="py-3 px-3 text-[#CCCCCC] font-mono text-[11px]">
                        {regra.regraEsperada}
                      </td>
                      <td className="py-3 px-3">
                        {regra.valoresDistintos.length === 0 ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Nenhum descarte (100% em conformidade)
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {regra.valoresDistintos.map((item, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-[#1E1E1E] border border-[#333333] text-white"
                              >
                                <span>{item.valor}</span>
                                <span className="text-[#8A8A8A] text-[10px]">
                                  ({item.contagem.toLocaleString("pt-BR")}x)
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                        {regra.totalDescartado === 0 ? (
                          <span className="text-[#666666]">0</span>
                        ) : (
                          <span className="text-red-400">
                            {regra.totalDescartado.toLocaleString("pt-BR")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SEÇÃO ADICIONAL: SKUs QUE PASSARAM NOS FILTROS BEES MAS ESTAVAM FORA DA LISTA DO DESAFIO */}
            {resultado.descartesDetalhados.skusForaDesafio.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      SKUs Válidos BEES CDD fora da lista do desafio ({resultado.descartesDetalhados.skusForaDesafio.length} SKUs distintos)
                    </h4>
                    <p className="text-[11px] text-[#8A8A8A]">
                      Produtos que cumpriram todos os 5 critérios e data do período, mas não foram informados na lista de SKUs participantes.
                    </p>
                  </div>

                  <div className="relative max-w-xs w-full sm:w-auto">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#666666]" />
                    <input
                      type="text"
                      placeholder="Buscar SKU fora do desafio..."
                      value={buscaSkusFora}
                      onChange={(e) => setBuscaSkusFora(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-xs bg-[#1A1A1A] border border-[#333333] rounded text-white placeholder-[#737373] focus:outline-none focus:border-[#FFC600]"
                    />
                  </div>
                </div>

                <div className="border border-[#292929] rounded-lg overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#202020] text-[#CCCCCC] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Descrição do Produto</th>
                        <th className="py-2.5 px-3 text-right">Ocorrências</th>
                        <th className="py-2.5 px-3 text-right">Valor Total Não Computado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#242424]">
                      {skusForaFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-[#8A8A8A]">
                            Nenhum SKU encontrado com o filtro "{buscaSkusFora}".
                          </td>
                        </tr>
                      ) : (
                        skusForaFiltrados.map((s, idx) => (
                          <tr key={idx} className="hover:bg-[#1A1A1A] transition-colors">
                            <td className="py-2 px-3 font-mono font-medium text-white">{s.sku}</td>
                            <td className="py-2 px-3 text-[#CCCCCC]">{s.descricao}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums text-[#8A8A8A]">
                              {s.contagem.toLocaleString("pt-BR")}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-white">
                              R$ {formatBRL(s.valorTotal)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
