import React, { useEffect, useState } from 'react';
import type { ChemicalPrice, PriceHistoryPoint, TimeRange } from '../types/price';
import { fetchPriceHistory } from '../services/priceApi';
import { X, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface Props {
  product: ChemicalPrice | null;
  onClose: () => void;
}

export const PriceChartModal: React.FC<Props> = ({ product, onClose }) => {
  const [range, setRange] = useState<TimeRange>('30d');
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [currencyMode, setCurrencyMode] = useState<'USD' | 'EUR' | 'CNY'>('USD');

  useEffect(() => {
    if (!product) return;

    let isMounted = true;
    setLoading(true);

    fetchPriceHistory(product.id, range)
      .then((data) => {
        if (isMounted) {
          setHistory(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product, range]);

  if (!product) return null;

  const ranges: { label: string; value: TimeRange }[] = [
    { label: '7 Gün', value: '7d' },
    { label: '30 Gün', value: '30d' },
    { label: '3 Ay', value: '3m' },
    { label: '6 Ay', value: '6m' },
    { label: '1 Yıl', value: '1y' },
  ];

  const getActivePrice = (item: PriceHistoryPoint) => {
    if (currencyMode === 'USD') return item.priceUsd;
    if (currencyMode === 'EUR') return item.priceEur;
    return item.price;
  };

  const getCurrencySymbol = () => {
    if (currencyMode === 'USD') return '$';
    if (currencyMode === 'EUR') return '€';
    return '¥';
  };

  const formattedChartData = history.map((item) => {
    const val = getActivePrice(item);
    return {
      date: new Date(item.date).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
      }),
      price: val,
      formattedPrice: val
        ? `${getCurrencySymbol()}${val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
        : '--',
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-wide uppercase flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              {product.displayName}
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {product.chemicalName} • {currencyMode}/{product.unit}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Time Range & Currency Selectors */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-gray-100 bg-white gap-2">
          {/* Currency Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg space-x-1">
            <button
              onClick={() => setCurrencyMode('USD')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currencyMode === 'USD' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              $ USD
            </button>
            <button
              onClick={() => setCurrencyMode('EUR')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currencyMode === 'EUR' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              € EUR
            </button>
            <button
              onClick={() => setCurrencyMode('CNY')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currencyMode === 'CNY' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ¥ CNY
            </button>
          </div>

          {/* Range Selector */}
          <div className="flex bg-gray-100/80 p-1 rounded-lg space-x-1">
            {ranges.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  range === r.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Body */}
        <div className="p-6 flex-1 min-h-[300px] flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium">Veriler Yükleniyor...</span>
            </div>
          ) : formattedChartData.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Bu zaman aralığı için henüz fiyat geçmişi verisi bulunmuyor.
            </div>
          ) : (
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: '#E5E5E5' }}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `${getCurrencySymbol()}${v.toLocaleString('tr-TR')}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#FFF',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [
                      `${getCurrencySymbol()}${Number(value).toLocaleString('tr-TR')} / ${product.unit}`,
                      'Fiyat',
                    ]}
                    labelFormatter={(label) => `Tarih: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={currencyMode === 'USD' ? '#2563EB' : currencyMode === 'EUR' ? '#059669' : '#475569'}
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1, stroke: '#FFF' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
