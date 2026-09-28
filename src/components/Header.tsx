import React from "react";
import { RotateCcw } from "lucide-react";

interface HeaderProps {
  onReset?: () => void;
  showReset?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, showReset }) => {
  return (
    <header className="bg-[#121212] text-white border-b border-[#242424] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand title */}
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFC600] inline-block" />
          <h1 className="font-bold text-base tracking-tight text-white">
            Cálculo de Desafios BEES
          </h1>
        </div>

        {/* Action: Nova Apuração */}
        <div>
          {showReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nova Apuração</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
