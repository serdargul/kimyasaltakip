export interface ChemicalPrice {
  id: number;
  displayName: string;
  chemicalName: string;
  cas: string | null;
  currentPrice: number | null;
  previousPrice: number | null;
  currentPriceUsd: number | null;
  currentPriceEur: number | null;
  previousPriceUsd: number | null;
  previousPriceEur: number | null;
  priceLow: number | null;
  priceHigh: number | null;
  priceLowUsd: number | null;
  priceHighUsd: number | null;
  priceLowEur: number | null;
  priceHighEur: number | null;
  currency: string;
  unit: string;
  changePercent: number | null;
  sourceDate: string | null;
  lastCheckedAt: string | null;
  fetchStatus: string;
  usdRate?: number;
  eurRate?: number;
}

export interface PriceHistoryPoint {
  date: string;
  price: number | null;
  priceUsd: number | null;
  priceEur: number | null;
  currency: string;
  unit: string;
}

export type TimeRange = '7d' | '30d' | '3m' | '6m' | '1y';

