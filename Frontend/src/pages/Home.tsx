import React, { useEffect, useState } from 'react';
import type { ChemicalPrice } from '../types/price';
import { fetchPrices, triggerManualSync } from '../services/priceApi';
import { ChemicalPriceCard } from '../components/ChemicalPriceCard';
import { PriceChartModal } from '../components/PriceChartModal';
import { RefreshCw, Activity, Search } from 'lucide-react';

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

  return (
    <div className="min-h-screen w-full bg-slate-100/70 text-gray-900 font-sans antialiased selection:bg-blue-100 flex flex-col">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 py-4 flex-1 flex flex-col">
        
        {/* Top Header Bar */}
        <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/90 shadow-xs gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm shadow-blue-500/20">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 uppercase">
                  Kimyasal Fiyat Takip Paneli
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                  {filteredProducts.length} ÜRÜN
                </span>
              </div>
              {products.length > 0 && products[0].usdRate && products[0].eurRate && (
                <div className="text-[11px] font-medium text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                  <span>Canlı Kurlar:</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200/80 font-mono font-bold">
                    1 CNY = ${products[0].usdRate.toFixed(4)} USD
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200/80 font-mono font-bold">
                    1 CNY = €{products[0].eurRate.toFixed(4)} EUR
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Search & Refresh */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 lg:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Kimyasal adı veya CAS ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all font-medium text-gray-800"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualSync}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all shadow-2xs hover:shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
              title="Fiyatları Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>
        </header>

        {/* Product Grid Area */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 text-gray-400 bg-white rounded-xl border border-gray-200">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold text-gray-600">Piyasa Fiyatları Yükleniyor...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-sm font-medium bg-white rounded-xl border border-gray-200">
              Aramanıza uygun kimyasal ürün bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
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

        {/* Footer */}
        <footer className="mt-4 py-2 px-1 text-[11px] text-gray-500 font-medium shrink-0 flex flex-col sm:flex-row items-center justify-between gap-1 border-t border-gray-200/80">
          <span>* Fiyatlar GuideChem verileri ve anlık Google döviz kurları ile TON bazında hesaplanmaktadır.</span>
          <span className="flex items-center gap-1.5 text-gray-600">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
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
