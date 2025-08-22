import type { DiseaseData } from '@/types';

export function calculateLegendRanges(data: DiseaseData, metric: 'cases' | 'deaths'): number[] {
  // Get all non-zero values
  const values = Object.values(data)
    .map(d => d[metric])
    .filter(val => val > 0)
    .sort((a, b) => b - a);

  if (values.length === 0) return [100, 50, 25, 10, 5, 2, 1, 0];

  const max = Math.max(...values);
  const quantiles = [
    max,                          // Max value
    values[Math.floor(values.length * 0.12)], // 88th percentile
    values[Math.floor(values.length * 0.25)], // 75th percentile
    values[Math.floor(values.length * 0.37)], // 63th percentile
    values[Math.floor(values.length * 0.5)],  // Median
    values[Math.floor(values.length * 0.63)], // 37th percentile
    values[Math.floor(values.length * 0.75)], // 25th percentile
    0                            // Min value
  ];

  // Round numbers for cleaner display
  return quantiles.map(val => {
    if (val >= 1000) return Math.round(val / 100) * 100;
    if (val >= 100) return Math.round(val / 10) * 10;
    return Math.round(val);
  });
}

export function formatNumber(num: number): string {
  return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
} 