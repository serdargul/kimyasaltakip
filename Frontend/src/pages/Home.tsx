import React, { useEffect, useState } from 'react';
import type { ChemicalPrice } from '../types/price';
import { fetchPrices, triggerManualSync } from '../services/priceApi';
import { PriceChartModal } from '../components/PriceChartModal';
import { RefreshCw, Table as TableIcon, Search, LineChart, ArrowUp, ArrowDown, Minus } from 'lucide-react';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<ChemicalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ChemicalPrice | null>(null);
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
    <div className="min-h-screen w-full bg-slate-100/80 text-gray-900 font-sans antialiased selection:bg-blue-100 flex flex-col">
      <div className="w-full max-w-[1760px] mx-auto px-3 sm:px-6 py-4 flex-1 flex flex-col">
        
        {/* Excel-style Toolbar Header */}
        <header className="mb-3.5 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 text-white rounded-lg shadow-xs">
              <TableIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-gray-900 uppercase">
                  Kimyasal Fiyat Takip Tablosu
                </h1>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-xs font-extrabold rounded-full border border-slate-300">
                  {filteredProducts.length} Ürün
                </span>
              </div>
              {products.length > 0 && products[0].usdRate && products[0].eurRate && (
                <div className="text-xs sm:text-sm font-semibold text-slate-600 flex flex-wrap items-center gap-2 mt-1">
                  <span>Canlı Kurlar:</span>
                  <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-xs sm:text-sm">
                    1 CNY = ${products[0].usdRate.toFixed(4)} USD
                  </span>
                  <span className="bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded border border-emerald-200 font-mono font-bold text-xs sm:text-sm">
                    1 CNY = €{products[0].eurRate.toFixed(4)} EUR
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrele (Ürün adı veya CAS)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:border-emerald-600 font-semibold text-gray-800"
              />
            </div>

            <button
              onClick={handleManualSync}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-extrabold text-gray-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-all shadow-2xs disabled:opacity-50 shrink-0 cursor-pointer"
              title="Verileri Yenile"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-700 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>
          </div>
        </header>

        {/* Excel Data Grid Table Container */}
        <div className="flex-1 bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-175px)]">
            <table className="w-full text-left border-collapse border border-slate-300">
              {/* Table Column Headers */}
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-xs sm:text-sm font-black uppercase tracking-wider select-none sticky top-0 z-10 border-b-2 border-slate-400 shadow-2xs">
                  <th className="py-3 px-3 border border-slate-300 text-center w-14 bg-slate-200/90">#</th>
                  <th className="py-3 px-4 border border-slate-300">KİMYASAL ÜRÜN BİLGİSİ</th>
                  <th className="py-3 px-4 border border-slate-300 text-center w-40">CAS NUMARASI</th>
                  <th className="py-3 px-4 border border-slate-300 text-right w-56 bg-blue-50/70 text-blue-950 font-black">
                    GÜNCEL ($ USD / TON)
                  </th>
                  <th className="py-3 px-4 border border-slate-300 text-right w-56 bg-emerald-50/70 text-emerald-950 font-black">
                    GÜNCEL (€ EUR / TON)
                  </th>
                  <th className="py-3 px-4 border border-slate-300 text-right w-44 text-slate-600">
                    ÖNCEKİ FİYAT ($ USD)
                  </th>
                  <th className="py-3 px-4 border border-slate-300 text-center w-36">DEĞİŞİM (%)</th>
                  <th className="py-3 px-4 border border-slate-300 text-center w-28">GRAFİK</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-gray-500 border border-slate-300">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-bold text-sm">Fiyat Verileri Yükleniyor...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-500 font-bold text-sm border border-slate-300">
                      Filtre kriterlerine uygun kimyasal ürün bulunamadı.
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
                          idx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'
                        } hover:bg-sky-50/90`}
                      >
                        {/* 1. Row Index */}
                        <td className="py-3 px-3 border border-slate-300 text-center font-mono text-slate-500 text-xs sm:text-sm bg-slate-100/60 font-bold select-none">
                          {idx + 1}
                        </td>

                        {/* 2. Product Name & Chemical Name */}
                        <td className="py-3 px-4 border border-slate-300">
                          <div className="font-black text-gray-950 uppercase tracking-tight text-sm sm:text-base md:text-lg leading-snug">
                            {product.displayName}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
                            {product.chemicalName}
                          </div>
                        </td>

                        {/* 3. CAS Number */}
                        <td className="py-3 px-3 border border-slate-300 text-center">
                          {product.cas ? (
                            <span className="bg-slate-100 border border-slate-300 px-2.5 py-1 rounded text-xs sm:text-sm font-extrabold font-mono text-slate-800">
                              {product.cas}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">--</span>
                          )}
                        </td>

                        {/* 4. Current Price USD */}
                        <td className="py-3 px-4 border border-slate-300 text-right font-mono font-black text-base sm:text-lg md:text-xl text-blue-900 bg-blue-50/20 tabular-nums">
                          {formatUsd(product.currentPriceUsd)}
                        </td>

                        {/* 5. Current Price EUR */}
                        <td className="py-3 px-4 border border-slate-300 text-right font-mono font-black text-base sm:text-lg md:text-xl text-emerald-900 bg-emerald-50/20 tabular-nums">
                          {formatEur(product.currentPriceEur)}
                        </td>

                        {/* 6. Previous Price USD */}
                        <td className="py-3 px-4 border border-slate-300 text-right font-mono text-xs sm:text-sm font-bold text-slate-500 line-through decoration-slate-400 tabular-nums">
                          {formatUsd(product.previousPriceUsd)}
                        </td>

                        {/* 7. Change % */}
                        <td className="py-3 px-3 border border-slate-300 text-center">
                          <div className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-md text-xs sm:text-sm font-black font-mono border tabular-nums shadow-2xs ${
                            isUp ? 'text-emerald-900 bg-emerald-100 border-emerald-300' :
                            isDown ? 'text-rose-900 bg-rose-100 border-rose-300' :
                            'text-slate-700 bg-slate-100 border-slate-300'
                          }`}>
                            {isUp && <ArrowUp className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />}
                            {isDown && <ArrowDown className="w-3.5 h-3.5 text-rose-700 stroke-[3]" />}
                            {!isUp && !isDown && <Minus className="w-3.5 h-3.5 text-slate-500 stroke-[3]" />}
                            <span>%{absChange}</span>
                          </div>
                        </td>

                        {/* 8. Chart Action */}
                        <td className="py-3 px-3 border border-slate-300 text-center">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            title="Geçmiş Fiyat Grafiği"
                            className="p-1.5 px-3 text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-300 hover:border-blue-300 transition-colors inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm cursor-pointer shadow-2xs"
                          >
                            <LineChart className="w-4 h-4 text-blue-600" />
                            <span>Grafik</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Excel-style Status Footer */}
        <footer className="mt-3 py-1.5 px-2 text-xs text-slate-600 font-semibold shrink-0 flex flex-col sm:flex-row items-center justify-between gap-1 border-t border-slate-300">
          <span>* Fiyatlar GuideChem verileri ve anlık Google döviz kurları ile TON bazında hesaplanmaktadır.</span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Canlı Piyasa Verileri</span>
            <span>•</span>
            <span>Son güncelleme: <strong className="text-gray-950 font-black">{lastUpdated || '--'}</strong></span>
          </span>
        </footer>
      </div>

      {/* Price Chart Modal */}
      <PriceChartModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
