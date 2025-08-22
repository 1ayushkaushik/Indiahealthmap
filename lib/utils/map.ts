export function calculateLegendRanges(data: Record<string, { cases: number; deaths: number }>, metric: 'cases' | 'deaths'): number[] {
  const values = Object.values(data)
    .map(d => d[metric])
    .filter(val => val > 0)
    .sort((a, b) => b - a);

  if (values.length === 0) return [100, 50, 25, 10, 5, 2, 1, 0];

  const max = Math.max(...values);
  const quantiles = [
    max,
    values[Math.floor(values.length * 0.12)],
    values[Math.floor(values.length * 0.25)],
    values[Math.floor(values.length * 0.37)],
    values[Math.floor(values.length * 0.5)],
    values[Math.floor(values.length * 0.63)],
    values[Math.floor(values.length * 0.75)],
    0
  ];

  return quantiles.map(val => {
    if (val >= 1000) return Math.round(val / 100) * 100;
    if (val >= 100) return Math.round(val / 10) * 10;
    return Math.round(val);
  });
} 