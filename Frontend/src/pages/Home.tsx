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
    <div className="min-h-screen w-full bg-slate-50 text-gray-900 font-sans antialiased selection:bg-blue-100 flex flex-col">
      <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 py-3 flex-1 flex flex-col">
        
        {/* Excel-style Toolbar Header */}
        <header className="mb-3 bg-white p-3 rounded-lg border border-slate-300 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-700 text-white rounded shadow-xs">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-gray-900 uppercase">
                  Kimyasal Fiyat Takip Tablosu
                </h1>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-300">
                  {filteredProducts.length} Kayıt
                </span>
              </div>
              {products.length > 0 && products[0].usdRate && products[0].eurRate && (
                <div className="text-[11px] font-medium text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="font-semibold text-slate-600">Döviz Kurları:</span>
                  <span className="bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded border border-blue-200 font-mono font-bold text-[10px]">
                    1 CNY = ${products[0].usdRate.toFixed(4)} USD
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200 font-mono font-bold text-[10px]">
                    1 CNY = €{products[0].eurRate.toFixed(4)} EUR
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrele (Ürün adı veya CAS)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white focus:border-emerald-600 font-medium text-gray-800"
              />
            </div>

            <button
              onClick={handleManualSync}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-gray-700 bg-white hover:bg-slate-100 border border-slate-300 rounded transition-all shadow-2xs disabled:opacity-50 shrink-0 cursor-pointer"
              title="Verileri Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>
          </div>
        </header>

        {/* Excel Data Grid Table Container */}
        <div className="flex-1 bg-white border border-slate-300 rounded-lg shadow-2xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-170px)]">
            <table className="w-full text-left border-collapse border border-slate-300">
              {/* Table Column Headers */}
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-[11px] font-extrabold uppercase tracking-wider select-none sticky top-0 z-10 border-b-2 border-slate-400 shadow-2xs">
                  <th className="py-2.5 px-3 border border-slate-300 text-center w-12 bg-slate-200/80">#</th>
                  <th className="py-2.5 px-3 border border-slate-300">KİMYASAL ÜRÜN BİLGİSİ</th>
                  <th className="py-2.5 px-3 border border-slate-300 text-center w-36">CAS NUMARASI</th>
                  <th className="py-2.5 px-3 border border-slate-300 text-right w-48 bg-blue-50/50 text-blue-950">GÜNCEL ($ USD / TON)</th>
                  <th className="py-2.5 px-3 border border-slate-300 text-right w-48 bg-emerald-50/50 text-emerald-950">GÜNCEL (€ EUR / TON)</th>
                  <th className="py-2.5 px-3 border border-slate-300 text-right w-40 text-slate-600">ÖNCEKİ FİYAT ($ USD)</th>
                  <th className="py-2.5 px-3 border border-slate-300 text-center w-32">DEĞİŞİM (%)</th>
                  <th className="py-2.5 px-3 border border-slate-300 text-center w-24">GRAFİK</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-300 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-500 border border-slate-300">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-semibold text-xs">Fiyat Verileri Yükleniyor...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500 font-medium border border-slate-300">
                      Filtre kriterlerine uygun kimyasal bulunamadı.
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
                        } hover:bg-sky-50/80`}
                      >
                        {/* 1. Row Index */}
                        <td className="py-2 px-3 border border-slate-300 text-center font-mono text-slate-400 text-[11px] bg-slate-100/60 font-semibold select-none">
                          {idx + 1}
                        </td>

                        {/* 2. Product Name & Chemical Name */}
                        <td className="py-2 px-3 border border-slate-300">
                          <div className="font-extrabold text-gray-900 uppercase tracking-tight text-[12px]">
                            {product.displayName}
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium">
                            {product.chemicalName}
                          </div>
                        </td>

                        {/* 3. CAS Number */}
                        <td className="py-2 px-3 border border-slate-300 text-center font-mono text-[11px] text-slate-700 font-semibold">
                          {product.cas ? (
                            <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded">
                              {product.cas}
                            </span>
                          ) : '--'}
                        </td>

                        {/* 4. Current Price USD */}
                        <td className="py-2 px-3 border border-slate-300 text-right font-mono font-black text-[13px] text-blue-900 bg-blue-50/20 tabular-nums">
                          {formatUsd(product.currentPriceUsd)}
                        </td>

                        {/* 5. Current Price EUR */}
                        <td className="py-2 px-3 border border-slate-300 text-right font-mono font-black text-[13px] text-emerald-900 bg-emerald-50/20 tabular-nums">
                          {formatEur(product.currentPriceEur)}
                        </td>

                        {/* 6. Previous Price USD */}
                        <td className="py-2 px-3 border border-slate-300 text-right font-mono text-[11px] text-slate-500 line-through decoration-slate-300 tabular-nums">
                          {formatUsd(product.previousPriceUsd)}
                        </td>

                        {/* 7. Change % */}
                        <td className="py-2 px-3 border border-slate-300 text-center">
                          <div className={`inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold font-mono border tabular-nums ${
                            isUp ? 'text-emerald-800 bg-emerald-100 border-emerald-300' :
                            isDown ? 'text-rose-800 bg-rose-100 border-rose-300' :
                            'text-slate-600 bg-slate-100 border-slate-300'
                          }`}>
                            {isUp && <ArrowUp className="w-3 h-3 text-emerald-700 stroke-[2.5]" />}
                            {isDown && <ArrowDown className="w-3 h-3 text-rose-700 stroke-[2.5]" />}
                            {!isUp && !isDown && <Minus className="w-3 h-3 text-slate-500" />}
                            <span>%{absChange}</span>
                          </div>
                        </td>

                        {/* 8. Chart Action */}
                        <td className="py-2 px-3 border border-slate-300 text-center">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            title="Geçmiş Fiyat Grafiği"
                            className="p-1 px-2 text-slate-600 hover:text-blue-700 hover:bg-blue-100/70 rounded border border-slate-300 hover:border-blue-300 transition-colors inline-flex items-center gap-1 font-semibold text-[10px] cursor-pointer"
                          >
                            <LineChart className="w-3.5 h-3.5 text-blue-600" />
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
        <footer className="mt-2.5 py-1 px-2 text-[11px] text-slate-600 font-medium shrink-0 flex flex-col sm:flex-row items-center justify-between gap-1 border-t border-slate-300">
          <span>* Fiyatlar GuideChem verileri ve anlık Google döviz kurları ile TON bazında hesaplanmaktadır.</span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Canlı Piyasa Verileri</span>
            <span>•</span>
            <span>Son güncelleme: <strong className="text-gray-900 font-bold">{lastUpdated || '--'}</strong></span>
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
