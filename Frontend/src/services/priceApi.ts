import type { ChemicalPrice, PriceHistoryPoint, TimeRange } from '../types/price';

// Resolves path according to Vite's base path (works locally and on GitHub Pages /sub-repo/)
const BASE_URL = import.meta.env.BASE_URL || '/';
const getStaticDataUrl = (file: string) => `${BASE_URL.replace(/\/$/, '')}/data/${file}`;

export async function fetchPrices(): Promise<ChemicalPrice[]> {
  try {
    // Add timestamp to prevent aggressive browser caching
    const url = `${getStaticDataUrl('prices.json')}?t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load prices: HTTP ${response.status}`);
    }
    const data: ChemicalPrice[] = await response.json();
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

    // Filter by date range
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
  // In static / GitHub Pages mode, manual sync refreshes client data from latest static files
  await fetchPrices();
}
