import React, { useEffect, useState } from 'react';
import type { ChemicalPrice } from '../types/price';
import { fetchPrices, triggerManualSync } from '../services/priceApi';
import { ChemicalPriceRow } from '../components/ChemicalPriceRow';
import { PriceChartModal } from '../components/PriceChartModal';
import { RefreshCw, Activity } from 'lucide-react';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<ChemicalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ChemicalPrice | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

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
    setTimeout(() => loadData(true), 2000);
  };

  const [searchTerm, setSearchTerm] = useState('');

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
    <div className="h-screen w-full bg-slate-50/60 text-gray-900 font-sans antialiased selection:bg-blue-100 flex flex-col overflow-hidden">
      <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 py-2 h-full flex flex-col min-h-0">
        
        {/* Top Header */}
        <header className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-2 shrink-0 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm shadow-blue-500/20">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 uppercase">
                Kimyasal Fiyat Takip
              </h1>
              {products.length > 0 && products[0].usdRate && products[0].eurRate && (
                <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>Google Canlı Kur:</span>
                  <span className="bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 font-mono">1 CNY = ${products[0].usdRate.toFixed(4)} USD</span>
                  <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200 font-mono">1 CNY = €{products[0].eurRate.toFixed(4)} EUR</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56 lg:w-72">
              <input
                type="text"
                placeholder="Kimyasal adı veya CAS No ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 py-1 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-800 shadow-2xs"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualSync}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-all shadow-2xs hover:shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
              title="Fiyatları Güncelle"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>
        </header>

        {/* Table Column Headers (3 Equal Sections) */}
        <div className="grid grid-cols-12 items-center py-1.5 px-4 sm:px-6 bg-slate-900 text-white rounded-t-lg text-[11px] font-extrabold tracking-wider uppercase shrink-0 shadow-2xs">
          <div className="col-span-4 text-left">KİMYASAL ÜRÜN BİLGİSİ</div>
          <div className="col-span-4 text-center">GÜNCEL FİYAT ($ USD / € EUR TON)</div>
          <div className="col-span-4 text-right pr-2">ÖNCEKİ FİYAT & DEĞİŞİM</div>
        </div>

        {/* List Container (Fit Single Screen) */}
        <div className="flex-1 min-h-0 bg-white border-x border-b border-gray-200 rounded-b-lg shadow-2xs overflow-hidden flex flex-col justify-between divide-y divide-gray-100">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 py-6 text-gray-400">
              <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold text-gray-600">Piyasa Fiyatları Yükleniyor...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-6 text-gray-400 text-xs font-medium">
              Aramanıza uygun kimyasal fiyatı bulunamadı.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <ChemicalPriceRow
                key={product.id}
                product={product}
                onOpenChart={setSelectedProduct}
              />
            ))
          )}
        </div>

        {/* Compact Footer Bar */}
        <footer className="py-1 px-1 text-[10px] text-gray-500 font-semibold shrink-0 flex items-center justify-between">
          <span>* Fiyatlar GuideChem verileri ve Google canlı USD/EUR döviz kurları ile TON bazında hesaplanmaktadır.</span>
          <span className="flex items-center gap-1 text-gray-600">
            <span>Canlı Piyasa Verileri</span>
            <span>•</span>
            <span>Son güncelleme: <strong className="text-gray-900 font-bold">{lastUpdated || '--'}</strong></span>
          </span>
        </footer>
      </div>

      {/* Recharts Modal */}
      <PriceChartModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
