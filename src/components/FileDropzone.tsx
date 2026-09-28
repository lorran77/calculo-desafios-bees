import React, { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { lerArquivoGenerico } from "../utils/engine";

interface FileDropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null, records?: Record<string, any>[]) => void;
  isLoadingFile?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  file,
  onFileSelect,
  isLoadingFile = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previaLinhas, setPreviaLinhas] = useState<number | null>(null);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processarArquivo = async (arquivoSelecionado: File) => {
    const extensao = arquivoSelecionado.name.split(".").pop()?.toLowerCase();
    if (extensao !== "csv" && extensao !== "xlsx" && extensao !== "xls") {
      setErroLeitura("Formato não suportado. Por favor, envie um arquivo .xlsx, .xls ou .csv");
      return;
    }

    setErroLeitura(null);
    setAnalisando(true);

    try {
      const dados = await lerArquivoGenerico(arquivoSelecionado);
      setPreviaLinhas(dados.totalLinhas);
      onFileSelect(arquivoSelecionado, dados.registros);
    } catch (err: any) {
      console.error(err);
      setErroLeitura(err.message || "Não foi possível ler o arquivo.");
      onFileSelect(null);
    } finally {
      setAnalisando(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropFile = e.dataTransfer.files[0];
      await processarArquivo(dropFile);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const inputFile = e.target.files[0];
      await processarArquivo(inputFile);
    }
  };

  const removerArquivo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputRef.current) inputRef.current.value = "";
    setPreviaLinhas(null);
    setErroLeitura(null);
    onFileSelect(null);
  };

  const formatarTamanho = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
        onChange={handleInputChange}
      />

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-150 ${
            isDragging
              ? "border-[#FFC600] bg-[#1F1C10]"
              : "border-[#2E2E2E] hover:border-[#FFC600] bg-[#121212] hover:bg-[#161616]"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-11 h-11 rounded-full bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center text-white">
              <UploadCloud className="w-5 h-5 text-[#FFC600]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Arraste o arquivo aqui ou <span className="text-[#FFC600] underline">clique para selecionar</span>
              </p>
              <p className="text-xs text-[#8A8A8A] mt-1">
                Suporta planilhas do Power BI / BEES em formato <strong className="text-white">.xlsx</strong>, <strong className="text-white">.xls</strong> ou <strong className="text-white">.csv</strong>
              </p>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span className="bg-[#1A1A1A] text-[#CCCCCC] border border-[#2E2E2E] px-2 py-0.5 rounded font-mono font-medium">.XLSX</span>
              <span className="bg-[#1A1A1A] text-[#CCCCCC] border border-[#2E2E2E] px-2 py-0.5 rounded font-mono font-medium">.XLS</span>
              <span className="bg-[#1A1A1A] text-[#CCCCCC] border border-[#2E2E2E] px-2 py-0.5 rounded font-mono font-medium">.CSV</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-[#2E2E2E] bg-[#141414] rounded-lg p-3.5 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-[#241E0F] border border-[#483B1A] flex items-center justify-center text-[#FFC600] shrink-0 mt-0.5">
                {analisando || isLoadingFile ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#FFC600]" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white break-all">{file.name}</span>
                  <span className="bg-[#FFC600] text-black text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                    {file.name.split(".").pop()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8A8A8A] mt-1 font-mono">
                  <span>{formatarTamanho(file.size)}</span>
                  <span>·</span>
                  {previaLinhas !== null ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {previaLinhas.toLocaleString("pt-BR")} linhas identificadas
                    </span>
                  ) : (
                    <span>Carregando dados...</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs text-[#CCCCCC] hover:text-[#FFC600] px-2 py-1 font-medium cursor-pointer"
              >
                Trocar
              </button>
              <button
                type="button"
                onClick={removerArquivo}
                title="Remover arquivo"
                className="p-1 text-[#8A8A8A] hover:text-red-400 rounded hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {erroLeitura && (
        <div className="p-3 bg-[#2A1414] border border-[#4D2424] rounded-md flex items-start gap-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{erroLeitura}</span>
        </div>
      )}
    </div>
  );
};
