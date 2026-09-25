import type { ChemicalPrice, PriceHistoryPoint, TimeRange } from '../types/price';

// Resolves path according to Vite's base path (works locally and on GitHub Pages /sub-repo/)
const BASE_URL = import.meta.env.BASE_URL || '/';
const getStaticDataUrl = (file: string) => `${BASE_URL.replace(/\/$/, '')}/data/${file}`;

// Fetches live USD and EUR rates in Turkish Lira directly in the browser
export async function fetchLiveRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const rates = data?.rates;
      if (rates?.TRY && rates?.CNY && rates?.EUR) {
        const usdTry = Number(rates.TRY.toFixed(2));
        const eurTry = Number((rates.TRY / rates.EUR).toFixed(2));
        const usdRate = Number((1 / rates.CNY).toFixed(4));
        const eurRate = Number((rates.EUR / rates.CNY).toFixed(4));
        return { usdTry, eurTry, usdRate, eurRate };
      }
    }
  } catch (err) {
    console.warn('Could not fetch live rates in browser, using fallback static rates:', err);
  }
  return null;
}

export async function fetchPrices(): Promise<ChemicalPrice[]> {
  try {
    const url = `${getStaticDataUrl('prices.json')}?t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load prices: HTTP ${response.status}`);
    }
    const data: ChemicalPrice[] = await response.json();

    // Dynamically apply real-time exchange rates
    const liveRates = await fetchLiveRates();
    if (liveRates) {
      data.forEach((p) => {
        p.usdTry = liveRates.usdTry;
        p.eurTry = liveRates.eurTry;
        p.usdRate = liveRates.usdRate;
        p.eurRate = liveRates.eurRate;

        if (p.currentPrice) {
          p.currentPriceUsd = Number((p.currentPrice * liveRates.usdRate).toFixed(2));
          p.currentPriceEur = Number((p.currentPrice * liveRates.eurRate).toFixed(2));
        }
        if (p.previousPrice) {
          p.previousPriceUsd = Number((p.previousPrice * liveRates.usdRate).toFixed(2));
          p.previousPriceEur = Number((p.previousPrice * liveRates.eurRate).toFixed(2));
        }
      });
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch chemical prices:', error);
    throw error;
  }
}

export async function fetchPriceHistory(id: number, range: TimeRange = '30d'): Promise<PriceHistoryPoint[]> {
  try {
    const url = `${getStaticDataUrl('history.json')}?t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load history: HTTP ${response.status}`);
    }
    const allHistory: Record<string, PriceHistoryPoint[]> = await response.json();
    const points = allHistory[id.toString()] || [];

    if (points.length === 0) return [];

    const now = new Date();
    const cutoffDate = new Date();
    
    switch (range) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 30);
    }

    return points.filter((p) => new Date(p.date) >= cutoffDate);
  } catch (error) {
    console.error(`Failed to fetch price history for ID ${id}:`, error);
    return [];
  }
}

export async function triggerManualSync(): Promise<void> {
  await fetchPrices();
}
