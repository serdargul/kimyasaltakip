import React, { useEffect, useState } from 'react';
import type { ChemicalPrice } from '../types/price';
import { fetchPrices, triggerManualSync } from '../services/priceApi';
import { ChemicalPriceCard } from '../components/ChemicalPriceCard';
import { PriceChartModal } from '../components/PriceChartModal';
import {
  RefreshCw,
  Table as TableIcon,
  LayoutGrid,
  Search,
  ArrowUp,
  ArrowDown,
  Minus,
  X,
  TrendingUp,
} from 'lucide-react';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<ChemicalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [selectedProduct, setSelectedProduct] = useState<ChemicalPrice | null>(null);

  // Auto-switch to cards on mobile/small tablet screens initially
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setViewMode('cards');
    }
  }, []);

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
    return (
      '$' +
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val)
    );
  };

  const formatEur = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '--';
    return (
      '€' +
      new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val)
    );
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full bg-slate-100/90 text-gray-900 font-sans antialiased selection:bg-blue-100 flex flex-col p-2 sm:p-3 lg:p-2.5 box-border overflow-y-auto lg:overflow-hidden">
      <div className="w-full h-full max-w-[1920px] mx-auto flex flex-col min-h-0 justify-between gap-1.5 sm:gap-2">
        {/* Responsive Header Bar */}
        <header className="bg-white px-2.5 sm:px-3 py-2 rounded-lg border border-slate-300 shadow-2xs flex flex-col gap-2 shrink-0">
          {/* Main Top Row */}
          <div className="flex items-center justify-between gap-2 min-h-[38px]">
            {/* Title & Badge */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 bg-emerald-700 text-white rounded shadow-xs shrink-0">
                <TableIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-sm md:text-base font-black tracking-tight text-gray-900 uppercase truncate">
                  Kimyasal Fiyat Takip
                </h1>
                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-800 text-[10px] font-extrabold rounded border border-slate-300 shrink-0">
                  {filteredProducts.length} Ürün
                </span>
              </div>
            </div>

            {/* Desktop Live Rates ($ USD & € EUR in TL) */}
            {products.length > 0 && (
              <div className="hidden lg:flex items-center gap-2 font-semibold text-slate-700 shrink-0">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Canlı Kurlar:
                </span>
                <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-900 px-2 py-0.5 rounded-md font-mono text-xs font-black shadow-2xs">
                  <span className="text-blue-700 font-sans font-extrabold">$ USD:</span>
                  <span>
                    {products[0].usdTry
                      ? products[0].usdTry.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '48,95'}{' '}
                    ₺
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md font-mono text-xs font-black shadow-2xs">
                  <span className="text-emerald-700 font-sans font-extrabold">€ EUR:</span>
                  <span>
                    {products[0].eurTry
                      ? products[0].eurTry.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '55,73'}{' '}
                    ₺
                  </span>
                </div>
              </div>
            )}

            {/* Right Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Desktop/Tablet Search */}
              <div className="relative hidden sm:block w-36 md:w-52">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ürün veya CAS ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white focus:border-emerald-600 font-semibold text-gray-800"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* View Toggle Button (Table vs Cards) */}
              <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-300">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tablo Görünümü"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Tablo</span>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Kart Görünümü"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Kartlar</span>
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleManualSync}
                disabled={refreshing}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-gray-700 bg-white hover:bg-slate-100 border border-slate-300 rounded transition-all shadow-2xs disabled:opacity-50 shrink-0 cursor-pointer"
                title="Verileri Yenile"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-emerald-700 ${refreshing ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Yenile</span>
              </button>
            </div>
          </div>

          {/* Mobile / Tablet Sub-Header: Live Rates & Mobile Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200 lg:hidden">
            {/* Live Currency Rates */}
            {products.length > 0 && (
              <div className="flex items-center justify-between sm:justify-start gap-1.5">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Kurlar:
                </span>
                <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-900 px-2 py-0.5 rounded text-[11px] font-mono font-black shadow-2xs">
                  <span className="text-blue-700 font-sans font-bold">$ USD:</span>
                  <span>
                    {products[0].usdTry
                      ? products[0].usdTry.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '48,95'}{' '}
                    ₺
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[11px] font-mono font-black shadow-2xs">
                  <span className="text-emerald-700 font-sans font-bold">€ EUR:</span>
                  <span>
                    {products[0].eurTry
                      ? products[0].eurTry.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '55,73'}{' '}
                    ₺
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Search Input (Visible only on small screens) */}
            <div className="relative w-full sm:hidden">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ürün veya CAS ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white focus:border-emerald-600 font-semibold text-gray-800"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area: Card View vs Table View */}
        {viewMode === 'cards' ? (
          /* Cards Grid View */
          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold text-xs text-gray-500">Yükleniyor...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-gray-500 font-bold text-sm bg-white rounded-xl border border-slate-200">
                Arama kriterinize uygun ürün bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3 pb-2">
                {filteredProducts.map((product) => (
                  <ChemicalPriceCard
                    key={product.id}
                    product={product}
                    onOpenChart={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Excel Data Grid Table (Desktop 1-screen proportional + Mobile/Tablet scrollable) */
          <div className="flex-1 min-h-0 bg-white border border-slate-300 rounded-lg shadow-xs overflow-x-auto overflow-y-auto flex flex-col">
            <table className="w-full text-left border-collapse border border-slate-300 min-w-[680px] lg:min-w-full lg:h-full table-auto lg:table-fixed">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-10 bg-slate-100 shadow-2xs">
                <tr
                  className="bg-slate-100 text-slate-800 text-[11px] sm:text-[clamp(10px,1.1vh,12px)] font-black uppercase tracking-wider select-none border-b border-slate-300 h-10 lg:h-[5.5%]"
                >
                  <th className="px-3 border border-slate-300 w-[30%] lg:w-[32%]">
                    KİMYASAL ÜRÜN BİLGİSİ
                  </th>
                  <th className="px-2 border border-slate-300 text-center w-28 sm:w-36">
                    CAS NO
                  </th>
                  <th className="px-3 border border-slate-300 text-right w-[20%] bg-blue-50/70 text-blue-950 font-black">
                    GÜNCEL ($ USD / TON)
                  </th>
                  <th className="px-3 border border-slate-300 text-right w-[20%] bg-emerald-50/70 text-emerald-950 font-black">
                    GÜNCEL (€ EUR / TON)
                  </th>
                  <th className="px-3 border border-slate-300 text-right w-[16%] text-slate-600">
                    ÖNCEKİ ($ USD)
                  </th>
                  <th className="px-2 border border-slate-300 text-center w-24 sm:w-28">
                    DEĞİŞİM
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-300">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-gray-500 border border-slate-300 py-12"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-bold text-xs">Yükleniyor...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-gray-500 font-bold text-xs border border-slate-300 py-12"
                    >
                      Ürün bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, idx) => {
                    const isUp = (product.changePercent ?? 0) > 0;
                    const isDown = (product.changePercent ?? 0) < 0;
                    const absChange =
                      product.changePercent !== null && product.changePercent !== undefined
                        ? Math.abs(product.changePercent).toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '0,00';

                    return (
                      <tr
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className={`transition-colors border border-slate-300 cursor-pointer ${
                          idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                        } hover:bg-sky-50/90 active:bg-sky-100`}
                        style={{
                          height: `max(42px, ${94.5 / Math.max(filteredProducts.length, 1)}%)`,
                        }}
                        title="Geçmiş Fiyat Grafiği için Tıklayın"
                      >
                        {/* 1. Product Name & Chemical Name */}
                        <td className="px-2.5 sm:px-3 py-1.5 lg:py-0 border border-slate-300 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="min-w-0">
                              <div
                                className="font-black text-gray-950 uppercase tracking-tight text-[12px] sm:text-[clamp(11px,1.35vh,16px)] leading-tight truncate"
                                title={product.displayName}
                              >
                                {product.displayName}
                              </div>
                              <div
                                className="text-[10px] sm:text-[clamp(9px,1vh,11px)] text-slate-500 font-semibold truncate leading-none mt-0.5"
                                title={product.chemicalName}
                              >
                                {product.chemicalName}
                              </div>
                            </div>
                            <TrendingUp className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 shrink-0 opacity-0 lg:opacity-30 hover:opacity-100" />
                          </div>
                        </td>

                        {/* 2. CAS Number */}
                        <td className="px-1 sm:px-2 py-1.5 lg:py-0 border border-slate-300 text-center min-w-0">
                          {product.cas ? (
                            <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded text-[11px] sm:text-[clamp(10px,1.15vh,12px)] font-bold font-mono text-slate-800 inline-block truncate max-w-full">
                              {product.cas}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">--</span>
                          )}
                        </td>

                        {/* 3. Current Price USD */}
                        <td className="px-2.5 sm:px-3 py-1.5 lg:py-0 border border-slate-300 text-right font-mono font-black text-[13px] sm:text-[clamp(12px,1.6vh,18px)] text-blue-900 bg-blue-50/20 tabular-nums truncate">
                          {formatUsd(product.currentPriceUsd)}
                        </td>

                        {/* 4. Current Price EUR */}
                        <td className="px-2.5 sm:px-3 py-1.5 lg:py-0 border border-slate-300 text-right font-mono font-black text-[13px] sm:text-[clamp(12px,1.6vh,18px)] text-emerald-900 bg-emerald-50/20 tabular-nums truncate">
                          {formatEur(product.currentPriceEur)}
                        </td>

                        {/* 5. Previous Price USD */}
                        <td className="px-2.5 sm:px-3 py-1.5 lg:py-0 border border-slate-300 text-right font-mono text-[11px] sm:text-[clamp(10px,1.2vh,13px)] font-semibold text-slate-400 line-through decoration-slate-300 tabular-nums truncate">
                          {formatUsd(product.previousPriceUsd)}
                        </td>

                        {/* 6. Change % */}
                        <td className="px-1.5 sm:px-2 py-1.5 lg:py-0 border border-slate-300 text-center">
                          <div
                            className={`inline-flex items-center justify-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded text-[11px] sm:text-[clamp(10px,1.15vh,12px)] font-extrabold font-mono border tabular-nums ${
                              isUp
                                ? 'text-emerald-900 bg-emerald-100 border-emerald-300'
                                : isDown
                                ? 'text-rose-900 bg-rose-100 border-rose-300'
                                : 'text-slate-600 bg-slate-100 border-slate-300'
                            }`}
                          >
                            {isUp && (
                              <ArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-700 stroke-[3]" />
                            )}
                            {isDown && (
                              <ArrowDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-700 stroke-[3]" />
                            )}
                            {!isUp && !isDown && (
                              <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 stroke-[3]" />
                            )}
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
        )}

        {/* Responsive Status Footer */}
        <footer className="py-1 px-2 text-[10px] text-slate-600 font-medium shrink-0 flex flex-col sm:flex-row items-center justify-between gap-1 border-t border-slate-300 bg-white/70 rounded-md">
          <span className="truncate text-center sm:text-left">
            * Fiyatlar GuideChem verileri ve anlık Google kurları ile TON bazında hesaplanmaktadır.
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Canlı Piyasa</span>
            <span>•</span>
            <span>
              Son güncelleme:{' '}
              <strong className="text-gray-950 font-bold">{lastUpdated || '--'}</strong>
            </span>
          </span>
        </footer>
      </div>

      {/* Interactive Price Trend Chart Modal */}
      {selectedProduct && (
        <PriceChartModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};
