import React from 'react';
import type { ChemicalPrice } from '../types/price';
import { LineChart, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface Props {
  product: ChemicalPrice;
  onOpenChart: (product: ChemicalPrice) => void;
}

export const ChemicalPriceCard: React.FC<Props> = ({ product, onOpenChart }) => {
  const formatUsd = (val: number | null) => {
    if (val === null || val === undefined) return '--';
    return '$' + new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatEur = (val: number | null) => {
    if (val === null || val === undefined) return '--';
    return '€' + new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const isUp = (product.changePercent ?? 0) > 0;
  const isDown = (product.changePercent ?? 0) < 0;

  const changeText = () => {
    if (product.changePercent === null || product.changePercent === undefined) {
      return '%0,00';
    }
    const absVal = Math.abs(product.changePercent).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `%${absVal}`;
  };

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between p-3.5 relative overflow-hidden group ${
      isUp ? 'border-gray-200 hover:border-emerald-300' :
      isDown ? 'border-gray-200 hover:border-rose-300' :
      'border-gray-200 hover:border-blue-300'
    }`}>
      {/* Top Accent Strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isUp ? 'bg-emerald-500' :
        isDown ? 'bg-rose-500' :
        'bg-slate-300'
      }`} />

      {/* Card Header: Product Name, CAS & Chart Button */}
      <div className="flex items-start justify-between gap-2 pt-0.5">
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm tracking-tight uppercase truncate" title={product.displayName}>
            {product.displayName}
          </h3>
          <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5" title={product.chemicalName}>
            {product.chemicalName}
          </p>
        </div>

        <button
          onClick={() => onOpenChart(product)}
          title="Fiyat Grafiği Göster"
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-100 hover:border-blue-200 shrink-0 cursor-pointer"
        >
          <LineChart className="w-4 h-4 text-blue-600" />
        </button>
      </div>

      {/* CAS Tag */}
      {product.cas && (
        <div className="mt-1.5">
          <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold border border-slate-200/80">
            CAS: {product.cas}
          </span>
        </div>
      )}

      {/* Pricing Boxes (USD & EUR TON) */}
      <div className="grid grid-cols-2 gap-2 my-2.5">
        {/* USD Box */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-2 text-center flex flex-col justify-center">
          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">USD / TON</span>
          <span className="text-xs sm:text-sm font-black text-blue-900 font-mono tracking-tight mt-0.5">
            {formatUsd(product.currentPriceUsd)}
          </span>
        </div>

        {/* EUR Box */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2 text-center flex flex-col justify-center">
          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">EUR / TON</span>
          <span className="text-xs sm:text-sm font-black text-emerald-900 font-mono tracking-tight mt-0.5">
            {formatEur(product.currentPriceEur)}
          </span>
        </div>
      </div>

      {/* Footer: Previous Price & Change Badge */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
        {/* Previous Price */}
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">ÖNCEKİ FİYAT</span>
          <span className="text-[10px] font-medium text-gray-500 font-mono">
            {formatUsd(product.previousPriceUsd)}
          </span>
        </div>

        {/* Change Badge */}
        <div className={`px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums flex items-center gap-0.5 border shadow-2xs ${
          isUp ? 'text-emerald-800 bg-emerald-100/80 border-emerald-300' :
          isDown ? 'text-rose-800 bg-rose-100/80 border-rose-300' :
          'text-slate-600 bg-slate-100 border-slate-200'
        }`}>
          {isUp ? <ArrowUpRight className="w-3 h-3 text-emerald-700 stroke-[2.5]" /> :
           isDown ? <ArrowDownRight className="w-3 h-3 text-rose-700 stroke-[2.5]" /> :
           <Minus className="w-3 h-3 text-slate-500" />}
          <span>{changeText()}</span>
        </div>
      </div>
    </div>
  );
};
