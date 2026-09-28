import React, { useState } from "react";
import { Header } from "./components/Header";
import { FileDropzone } from "./components/FileDropzone";
import { SkuPresetManager } from "./components/SkuPresetManager";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { ApuracaoResultado } from "./types";
import { maskCurrencyInput } from "./utils/currency";
import { parseSkuList } from "./utils/presets";
import { processarDesafioBEES, MESES_NOMES } from "./utils/engine";
import { Calculator, AlertTriangle, ArrowRight } from "lucide-react";

export default function App() {
  const dataHoje = new Date();
  const [nomeCliente, setNomeCliente] = useState("");
  const [tipoCliente, setTipoCliente] = useState("CDD");
  const [mes, setMes] = useState(dataHoje.getMonth() + 1);
  const [ano, setAno] = useState(dataHoje.getFullYear());

  // Meta com máscara monetária em tempo real
  const [metaDisplay, setMetaDisplay] = useState("R$ 50.000,00");
  const [metaNumerica, setMetaNumerica] = useState(50000);

  // Arquivo carregado
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [registrosCarregados, setRegistrosCarregados] = useState<Record<string, any>[] | null>(null);

  // SKUs
  const [skuText, setSkuText] = useState("");

  // Estados de cálculo e resultados
  const [calculando, setCalculando] = useState(false);
  const [resultado, setResultado] = useState<ApuracaoResultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleMetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const { display, numericValue } = maskCurrencyInput(raw);
    setMetaDisplay(display);
    setMetaNumerica(numericValue);
  };

  const handleFileSelect = (file: File | null, records?: Record<string, any>[]) => {
    setArquivo(file);
    setRegistrosCarregados(records || null);
    setErro(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!arquivo || !registrosCarregados) {
      setErro("Selecione um arquivo de pedidos (.xlsx, .xls ou .csv) para continuar.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (metaNumerica <= 0) {
      setErro("Informe uma meta válida para o desafio (maior que zero).");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const skusParsed = parseSkuList(skuText);
    if (skusParsed.length === 0) {
      setErro("Informe ao menos um SKU participante do desafio.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setCalculando(true);
    await new Promise((r) => setTimeout(r, 40));

    try {
      const res = processarDesafioBEES(
        registrosCarregados,
        skusParsed,
        mes,
        ano,
        metaNumerica,
        nomeCliente.trim(),
        tipoCliente
      );
      setResultado(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      setErro(err.message || "Erro inesperado ao processar os dados do desafio.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setCalculando(false);
    }
  };

  const handleReset = () => {
    setResultado(null);
    setErro(null);
  };

  const anosDisponiveis = [
    dataHoje.getFullYear() - 2,
    dataHoje.getFullYear() - 1,
    dataHoje.getFullYear(),
    dataHoje.getFullYear() + 1,
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#F5F5F5]">
      <Header onReset={handleReset} showReset={!!resultado} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {erro && (
          <div className="mb-6 p-4 bg-[#2A1414] border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-red-200 uppercase tracking-wide">
                Aviso de Validação
              </h4>
              <p className="text-xs text-red-300 mt-0.5">{erro}</p>
            </div>
          </div>
        )}

        {resultado ? (
          <ResultsDashboard resultado={resultado} onReset={handleReset} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid Principal do Formulário: 2 Colunas no Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Coluna Esquerda: Parâmetros do Desafio & Upload do Arquivo */}
              <div className="lg:col-span-7 space-y-6">
                {/* Seção 1: Dados do Cliente e Parâmetros */}
                <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-[#FFC600] text-black flex items-center justify-center text-[10px] font-mono font-bold">
                        1
                      </span>
                      Parâmetros do Desafio
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#CCCCCC] mb-1">
                        Nome do Cliente (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Supermercado Precito Ltda"
                        value={nomeCliente}
                        onChange={(e) => setNomeCliente(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#111111] border border-[#2E2E2E] rounded-md text-white placeholder-[#737373] focus:outline-none focus:ring-1 focus:ring-[#FFC600] focus:border-[#FFC600]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#CCCCCC] mb-1">
                        Tipo de Operação
                      </label>
                      <select
                        value={tipoCliente}
                        onChange={(e) => setTipoCliente(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#111111] border border-[#2E2E2E] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFC600] focus:border-[#FFC600]"
                      >
                        <option value="CDD">CDD</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#CCCCCC] mb-1">
                        Mês de Referência
                      </label>
                      <select
                        value={mes}
                        onChange={(e) => setMes(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-[#111111] border border-[#2E2E2E] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFC600] focus:border-[#FFC600]"
                      >
                        {MESES_NOMES.map((nome, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            {nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#CCCCCC] mb-1">Ano</label>
                      <select
                        value={ano}
                        onChange={(e) => setAno(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-[#111111] border border-[#2E2E2E] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFC600] focus:border-[#FFC600]"
                      >
                        {anosDisponiveis.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#CCCCCC] mb-1">
                        Meta do Desafio (R$)
                      </label>
                      <input
                        type="text"
                        value={metaDisplay}
                        onChange={handleMetaChange}
                        placeholder="R$ 0,00"
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#111111] border border-[#2E2E2E] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#FFC600] focus:border-[#FFC600]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Seção 2: Arquivo de Pedidos (Excel / CSV) */}
                <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-[#FFC600] text-black flex items-center justify-center text-[10px] font-mono font-bold">
                        2
                      </span>
                      Relatório de Pedidos (.xlsx / .csv)
                    </h2>
                  </div>

                  <FileDropzone
                    file={arquivo}
                    onFileSelect={handleFileSelect}
                    isLoadingFile={calculando}
                  />

                  <div className="text-[11px] text-[#8A8A8A] bg-[#111111] p-2.5 rounded border border-[#262626] leading-relaxed">
                    <strong className="text-[#CCCCCC]">Filtros aplicados automaticamente na apuração CDD:</strong>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 text-[#8A8A8A]">
                      <span>· Situação Pedido = ENTREGUE</span>
                      <span>· Desc. Operação = VENDA DE PRODUTOS</span>
                      <span>· Situação Item = ENTREGUE</span>
                      <span>· Situação NF = NOTA EMITIDA</span>
                      <span>· Canal Origem = BEES</span>
                      <span>· Data dentro do mês/ano informado</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna Direita: Grupos de SKUs & Presets Salvos */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-[#FFC600] text-black flex items-center justify-center text-[10px] font-mono font-bold">
                        3
                      </span>
                      SKUs Participantes do Desafio
                    </h2>
                  </div>

                  <SkuPresetManager skuText={skuText} onSkuTextChange={setSkuText} />
                </div>

                {/* Card de Resumo antes do Cálculo & Botão de Ação */}
                <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 shadow-xs space-y-4">
                  <div className="space-y-1.5 text-xs text-[#CCCCCC]">
                    <div className="flex justify-between">
                      <span className="text-[#8A8A8A]">Período:</span>
                      <strong className="text-white font-mono">
                        {MESES_NOMES[mes - 1]}/{ano}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A8A8A]">Meta contratada:</span>
                      <strong className="text-[#FFC600] font-mono text-sm">{metaDisplay}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A8A8A]">Base de pedidos:</span>
                      <strong className="text-white font-mono truncate max-w-[180px]">
                        {arquivo ? arquivo.name : "Nenhum arquivo enviado"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A8A8A]">SKUs participantes:</span>
                      <strong className="text-white font-mono">
                        {parseSkuList(skuText).length} SKUs configurados
                      </strong>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={calculando}
                    className="w-full mt-2 py-3 px-4 bg-[#FFC600] hover:bg-[#F59E0B] text-black font-extrabold text-sm rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {calculando ? (
                      <span>Processando...</span>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 text-black" />
                        <span>Calcular</span>
                        <ArrowRight className="w-4 h-4 text-black ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      <footer className="border-t border-[#242424] bg-[#111111] mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-[#8A8A8A]">
          Aplicação executada localmente.
        </div>
      </footer>
    </div>
  );
}
