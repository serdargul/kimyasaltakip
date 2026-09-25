import React from 'react';
import type { ChemicalPrice } from '../types/price';
import { LineChart } from 'lucide-react';

interface Props {
  product: ChemicalPrice;
  onOpenChart: (product: ChemicalPrice) => void;
}

export const ChemicalPriceRow: React.FC<Props> = ({ product, onOpenChart }) => {
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

  const formatChange = () => {
    if (product.changePercent === null || product.changePercent === undefined) {
      return { text: '%0,00', colorClass: 'text-slate-600 bg-slate-100 border border-slate-200' };
    }

    const absVal = Math.abs(product.changePercent).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (product.changePercent > 0) {
      return { text: `↑ %${absVal}`, colorClass: 'text-emerald-800 bg-emerald-100 border border-emerald-300 font-bold' };
    } else if (product.changePercent < 0) {
      return { text: `↓ %${absVal}`, colorClass: 'text-rose-800 bg-rose-100 border border-rose-300 font-bold' };
    } else {
      return { text: `%${absVal}`, colorClass: 'text-slate-600 bg-slate-100 border border-slate-200' };
    }
  };

  const changeInfo = formatChange();

  return (
    <div className={`ticker-row grid grid-cols-12 items-center py-0.5 sm:py-1 px-4 sm:px-6 transition-all hover:bg-slate-50 flex-1 min-h-0 ${
      product.changePercent && product.changePercent > 0 ? 'bg-emerald-50/15' : 
      product.changePercent && product.changePercent < 0 ? 'bg-rose-50/15' : ''
    }`}>
      {/* 1. Left Section (4 cols - 33%): Product Name & CAS */}
      <div className="col-span-4 min-w-0 pr-2 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-gray-900 text-xs sm:text-sm tracking-tight uppercase truncate">
            {product.displayName}
          </span>
          {product.cas && (
            <span className="hidden sm:inline-block px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold border border-slate-200 shrink-0">
              CAS: {product.cas}
            </span>
          )}
        </div>
        <div className="text-[10px] text-gray-500 font-medium truncate flex items-center gap-1.5 leading-none mt-0.5">
          <span>{product.chemicalName}</span>
          {product.cas && (
            <span className="sm:hidden text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded">
              CAS {product.cas}
            </span>
          )}
        </div>
      </div>

      {/* 2. Center Section (4 cols - 33%): CURRENT PRICES ($ USD & € EUR / TON) */}
      <div className="col-span-4 flex flex-col items-center justify-center text-center px-2">
        <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black text-gray-900 tabular-nums">
          <span className="text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60 font-mono shadow-2xs">
            {formatUsd(product.currentPriceUsd)} / TON
          </span>
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60 font-mono shadow-2xs">
            {formatEur(product.currentPriceEur)} / TON
          </span>
        </div>
        {product.currentPrice && (
          <div className="text-[9px] text-gray-400 font-medium leading-none mt-0.5">
            Orijinal: {product.currentPrice.toLocaleString('tr-TR')} CNY/TON
          </div>
        )}
      </div>

      {/* 3. Right Section (4 cols - 33%): PREVIOUS PRICES, CHANGE BADGE & CHART BUTTON */}
      <div className="col-span-4 flex items-center justify-end space-x-2 text-right pl-2">
        <div className="hidden md:flex flex-col items-end text-right">
          <div className="text-[11px] font-semibold text-gray-400 line-through decoration-gray-300 font-mono leading-none">
            {formatUsd(product.previousPriceUsd)} | {formatEur(product.previousPriceEur)}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-gray-400 font-medium leading-none mt-0.5">
            ÖNCEKİ
          </div>
        </div>

        {/* Change % Badge */}
        <div className={`px-2 py-0.5 rounded-md text-xs tabular-nums flex items-center justify-center min-w-[70px] sm:min-w-[80px] shadow-2xs ${changeInfo.colorClass}`}>
          {changeInfo.text}
        </div>

        {/* Chart Button */}
        <button
          onClick={() => onOpenChart(product)}
          title="Fiyat Grafiği Göster"
          className="p-1 sm:p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-md transition-all border border-slate-200 hover:border-blue-200 focus:outline-none flex items-center gap-1 cursor-pointer shrink-0"
        >
          <LineChart className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden xl:inline text-[11px] font-semibold text-slate-700">Grafik</span>
        </button>
      </div>
    </div>
  );
};
