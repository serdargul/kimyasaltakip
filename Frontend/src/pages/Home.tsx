import React, { useEffect, useState } from 'react';
import type { ChemicalPrice } from '../types/price';
import { fetchPrices, triggerManualSync } from '../services/priceApi';
import { RefreshCw, Table as TableIcon, Search, ArrowUp, ArrowDown, Minus } from 'lucide-react';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<ChemicalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      const data = await fetchPrices();
      setProducts(data);

      const latestCheck = data.find((d) => d.lastCheckedAt)?.lastCheckedAt;
      if (latestCheck) {
        setLastUpdated(latestCheck);
      } else {
        const now = new Date();
        setLastUpdated(
          now.toLocaleDateString('tr-TR') +
            ' ' +
            now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        );
      }
    } catch (err) {
      console.error('Failed to load prices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    setRefreshing(true);
    await triggerManualSync();
    setTimeout(() => loadData(true), 800);
  };

  const filteredProducts = products.filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.displayName.toLowerCase().includes(q) ||
      p.chemicalName.toLowerCase().includes(q) ||
      (p.cas && p.cas.toLowerCase().includes(q))
    );
  });

  const formatUsd = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '--';
    return '$' + new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatEur = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '--';
    return '€' + new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="h-screen w-full bg-slate-100/90 text-gray-900 font-sans antialiased selection:bg-blue-100 flex flex-col overflow-hidden p-2 sm:p-3">
      <div className="w-full h-full max-w-[1920px] mx-auto flex flex-col min-h-0">
        
        {/* Compact Header Bar */}
        <header className="mb-2 bg-white px-3 py-2 rounded-lg border border-slate-300 shadow-2xs flex flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-emerald-700 text-white rounded shadow-xs shrink-0">
              <TableIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-gray-900 uppercase truncate">
                  Kimyasal Fiyat Takip Tablosu
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.2 bg-slate-100 text-slate-800 text-[11px] font-extrabold rounded border border-slate-300">
                  {filteredProducts.length} Ürün
                </span>
              </div>
            </div>
          </div>

          {/* Rates in Header */}
          {products.length > 0 && products[0].usdRate && products[0].eurRate && (
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span>Canlı Kurlar:</span>
              <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200 font-mono font-bold">
                1 CNY = ${products[0].usdRate.toFixed(4)} USD
              </span>
              <span className="bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded border border-emerald-200 font-mono font-bold">
                1 CNY = €{products[0].eurRate.toFixed(4)} EUR
              </span>
            </div>
          )}

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrele..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white focus:border-emerald-600 font-semibold text-gray-800"
              />
            </div>

            <button
              onClick={handleManualSync}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-gray-700 bg-white hover:bg-slate-100 border border-slate-300 rounded transition-all shadow-2xs disabled:opacity-50 shrink-0 cursor-pointer"
              title="Verileri Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>
        </header>

        {/* Excel Data Grid Table (Strictly Fits Screen - Zero Scroll) */}
        <div className="flex-1 min-h-0 bg-white border border-slate-300 rounded-lg shadow-xs overflow-hidden flex flex-col">
          <table className="w-full h-full text-left border-collapse border border-slate-300 table-fixed">
            {/* Table Column Headers */}
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-[11px] sm:text-xs font-black uppercase tracking-wider select-none border-b border-slate-300 h-8">
                <th className="px-2 border border-slate-300 text-center w-10 sm:w-12 bg-slate-200/90">#</th>
                <th className="px-3 border border-slate-300 w-[28%]">KİMYASAL ÜRÜN BİLGİSİ</th>
                <th className="px-2 border border-slate-300 text-center w-28 sm:w-32">CAS NO</th>
                <th className="px-3 border border-slate-300 text-right w-[19%] bg-blue-50/70 text-blue-950 font-black">
                  GÜNCEL ($ USD / TON)
                </th>
                <th className="px-3 border border-slate-300 text-right w-[19%] bg-emerald-50/70 text-emerald-950 font-black">
                  GÜNCEL (€ EUR / TON)
                </th>
                <th className="px-3 border border-slate-300 text-right w-[16%] text-slate-600">
                  ÖNCEKİ ($ USD)
                </th>
                <th className="px-2 border border-slate-300 text-center w-24 sm:w-28">DEĞİŞİM</th>
              </tr>
            </thead>

            {/* Table Body - Equal distributed rows filling 100% height */}
            <tbody className="divide-y divide-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 border border-slate-300">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold text-xs">Yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 font-bold text-xs border border-slate-300">
                    Ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, idx) => {
                  const isUp = (product.changePercent ?? 0) > 0;
                  const isDown = (product.changePercent ?? 0) < 0;
                  const absChange = product.changePercent !== null && product.changePercent !== undefined
                    ? Math.abs(product.changePercent).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0,00';

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors border border-slate-300 ${
                        idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                      } hover:bg-sky-50/90`}
                      style={{ height: `${100 / Math.max(filteredProducts.length, 1)}%` }}
                    >
                      {/* 1. Row Index */}
                      <td className="px-2 border border-slate-300 text-center font-mono text-slate-400 text-xs bg-slate-100/50 font-bold select-none">
                        {idx + 1}
                      </td>

                      {/* 2. Product Name & Chemical Name */}
                      <td className="px-3 border border-slate-300 truncate">
                        <div className="font-black text-gray-950 uppercase tracking-tight text-xs sm:text-sm md:text-base leading-none truncate">
                          {product.displayName}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate leading-none mt-0.5">
                          {product.chemicalName}
                        </div>
                      </td>

                      {/* 3. CAS Number */}
                      <td className="px-2 border border-slate-300 text-center truncate">
                        {product.cas ? (
                          <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-bold font-mono text-slate-800">
                            {product.cas}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">--</span>
                        )}
                      </td>

                      {/* 4. Current Price USD */}
                      <td className="px-3 border border-slate-300 text-right font-mono font-black text-sm sm:text-base md:text-lg text-blue-900 bg-blue-50/20 tabular-nums truncate">
                        {formatUsd(product.currentPriceUsd)}
                      </td>

                      {/* 5. Current Price EUR */}
                      <td className="px-3 border border-slate-300 text-right font-mono font-black text-sm sm:text-base md:text-lg text-emerald-900 bg-emerald-50/20 tabular-nums truncate">
                        {formatEur(product.currentPriceEur)}
                      </td>

                      {/* 6. Previous Price USD */}
                      <td className="px-3 border border-slate-300 text-right font-mono text-xs sm:text-sm font-semibold text-slate-400 line-through decoration-slate-300 tabular-nums truncate">
                        {formatUsd(product.previousPriceUsd)}
                      </td>

                      {/* 7. Change % */}
                      <td className="px-2 border border-slate-300 text-center">
                        <div className={`inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded text-[11px] sm:text-xs font-extrabold font-mono border tabular-nums ${
                          isUp ? 'text-emerald-900 bg-emerald-100 border-emerald-300' :
                          isDown ? 'text-rose-900 bg-rose-100 border-rose-300' :
                          'text-slate-600 bg-slate-100 border-slate-300'
                        }`}>
                          {isUp && <ArrowUp className="w-3 h-3 text-emerald-700 stroke-[3]" />}
                          {isDown && <ArrowDown className="w-3 h-3 text-rose-700 stroke-[3]" />}
                          {!isUp && !isDown && <Minus className="w-3 h-3 text-slate-500 stroke-[3]" />}
                          <span>%{absChange}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Status Footer */}
        <footer className="mt-1.5 py-0.5 px-2 text-[10px] sm:text-[11px] text-slate-600 font-medium shrink-0 flex items-center justify-between border-t border-slate-300">
          <span>* Fiyatlar GuideChem verileri ve anlık Google kurları ile TON bazında hesaplanmaktadır.</span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Canlı Piyasa Verileri</span>
            <span>•</span>
            <span>Son güncelleme: <strong className="text-gray-950 font-bold">{lastUpdated || '--'}</strong></span>
          </span>
        </footer>
      </div>
    </div>
  );
};
