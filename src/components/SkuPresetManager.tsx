import React, { useState, useEffect } from "react";
import { Bookmark, Plus, Trash2, Sparkles, AlertCircle, Check } from "lucide-react";
import { SkuPreset } from "../types";
import { loadPresets, savePresets, parseSkuList } from "../utils/presets";

interface SkuPresetManagerProps {
  skuText: string;
  onSkuTextChange: (text: string) => void;
}

export const SkuPresetManager: React.FC<SkuPresetManagerProps> = ({
  skuText,
  onSkuTextChange,
}) => {
  const [presets, setPresets] = useState<SkuPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetDesc, setNewPresetDesc] = useState("");
  const [alerta, setAlerta] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadPresets();
    setPresets(loaded);
  }, []);

  const parsedSkus = parseSkuList(skuText);

  const aplicarPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const encontrado = presets.find((p) => p.id === presetId);
    if (encontrado) {
      onSkuTextChange(encontrado.skus.join("\n"));
    }
  };

  const handleSalvarNovoPreset = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!newPresetName.trim()) {
      setAlerta("Dê um nome para o grupo de SKUs.");
      return;
    }
    if (parsedSkus.length === 0) {
      setAlerta("Cole ou digite ao menos um SKU no campo abaixo antes de salvar o grupo.");
      return;
    }

    const novo: SkuPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || `${parsedSkus.length} SKUs`,
      skus: parsedSkus,
      createdAt: Date.now(),
    };

    const atualizados = [...presets, novo];
    setPresets(atualizados);
    savePresets(atualizados);
    setSelectedPresetId(novo.id);
    setIsCreatingNew(false);
    setNewPresetName("");
    setNewPresetDesc("");
    setAlerta(null);
    setMensagemSucesso(`Grupo "${novo.name}" salvo com ${novo.skus.length} SKUs!`);
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  const handleExcluirPreset = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const atualizados = presets.filter((p) => p.id !== id);
    setPresets(atualizados);
    savePresets(atualizados);
    if (selectedPresetId === id) {
      setSelectedPresetId("");
    }
  };

  const limparEDuplicados = () => {
    if (parsedSkus.length > 0) {
      onSkuTextChange(parsedSkus.join("\n"));
    }
  };

  return (
    <div className="space-y-3">
      {/* Barra superior de seleção e presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-[#CCCCCC] uppercase tracking-wider flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-[#FFC600]" />
          Grupos Salvos
        </label>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsCreatingNew(!isCreatingNew);
            setAlerta(null);
          }}
          className="text-xs font-semibold text-[#FFC600] hover:text-[#FBBF24] inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isCreatingNew ? "Cancelar" : "Salvar grupo de SKUs"}</span>
        </button>
      </div>

      {/* Alerta de Sucesso temporário */}
      {mensagemSucesso && (
        <div className="p-2.5 bg-[#122416] border border-[#23582E] rounded-md flex items-center gap-2 text-xs text-emerald-300">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Caixa para salvar novo grupo (DIV, não FORM para evitar conflito com formulário externo) */}
      {isCreatingNew && (
        <div className="p-3 bg-[#1A1812] border border-[#3E351E] rounded-lg space-y-2.5 text-xs">
          <div className="font-semibold text-[#FDE68A]">Salvar lista atual como novo grupo:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nome do grupo (ex: Cervejas Premium)"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSalvarNovoPreset(e);
                }
              }}
              className="px-2.5 py-1.5 bg-[#121212] border border-[#333333] rounded text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FFC600]"
              autoFocus
            />
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={newPresetDesc}
              onChange={(e) => setNewPresetDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSalvarNovoPreset(e);
                }
              }}
              className="px-2.5 py-1.5 bg-[#121212] border border-[#333333] rounded text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FFC600]"
            />
          </div>

          {alerta && (
            <div className="text-red-400 flex items-center gap-1 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" />
              {alerta}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#8A8A8A]">
              {parsedSkus.length > 0 ? (
                <span>
                  Serão gravados <strong className="text-white font-mono">{parsedSkus.length}</strong> SKUs
                </span>
              ) : (
                <span className="text-amber-400/90">Cole os SKUs no campo abaixo</span>
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCreatingNew(false);
                }}
                className="px-2.5 py-1 text-xs text-[#8A8A8A] hover:text-white font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarNovoPreset}
                className="px-3 py-1 bg-[#FFC600] hover:bg-[#F59E0B] text-black rounded text-xs font-bold cursor-pointer"
              >
                Salvar Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Grupos salvos pelo usuário */}
      {presets.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => {
            const ativo = selectedPresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => aplicarPreset(preset.id)}
                className={`group inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded text-xs font-medium cursor-pointer transition-all border ${
                  ativo
                    ? "bg-[#FFC600] text-black border-[#FFC600] font-bold"
                    : "bg-[#181818] text-[#CCCCCC] border-[#2E2E2E] hover:border-[#FFC600] hover:bg-[#202020]"
                }`}
              >
                <span>{preset.name}</span>
                <span
                  className={`text-[10px] px-1 rounded font-mono ${
                    ativo ? "bg-black/20 text-black font-bold" : "bg-[#262626] text-[#8A8A8A]"
                  }`}
                >
                  {preset.skus.length}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleExcluirPreset(preset.id, e)}
                  title="Excluir este grupo"
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    ativo
                      ? "hover:bg-black/20 text-black hover:text-red-900"
                      : "hover:bg-red-950/60 text-[#8A8A8A] hover:text-red-400"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-[11px] text-[#737373] italic">
          Nenhum grupo salvo ainda. Cole os SKUs abaixo e clique em "+ Salvar grupo de SKUs" para reutilizar depois.
        </div>
      )}

      {/* Campo de Textarea para SKUs */}
      <div className="relative">
        <textarea
          rows={6}
          value={skuText}
          onChange={(e) => {
            onSkuTextChange(e.target.value);
            setSelectedPresetId("");
          }}
          placeholder="Cole os SKUs aqui (um por linha, ou separados por vírgula/espaço)..."
          className="w-full px-3 py-2 text-xs font-mono bg-[#121212] border border-[#2E2E2E] rounded-md text-white placeholder-[#737373] focus:outline-none focus:ring-1 focus:ring-[#FFC600] focus:border-[#FFC600] resize-y leading-relaxed"
          required
        />

        {/* Barra de rodapé do textarea com contagem e ação de limpeza */}
        <div className="flex items-center justify-between mt-1 text-[11px] text-[#8A8A8A]">
          <span className="flex items-center gap-1 font-medium">
            <span className="font-mono font-bold text-white">{parsedSkus.length}</span>{" "}
            {parsedSkus.length === 1 ? "SKU participante identificado" : "SKUs participantes identificados"}
          </span>
          {parsedSkus.length > 0 && (
            <button
              type="button"
              onClick={limparEDuplicados}
              className="text-[#CCCCCC] hover:text-[#FFC600] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#FFC600]" />
              Normalizar lista (remover duplicados)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
