import type { ColorScheme } from '@/lib/constants/color-schemes';

interface ComparisonMap {
  id: string;
  disease: string;
  metric: 'cases' | 'deaths';
  view: 'district' | 'state';
  colorScheme: ColorScheme;
  timeRange: {
    start: string;
    end: string;
  };
}

export async function generateComparisonImage(
  maps: ComparisonMap[],
  view: 'district' | 'state',
  colorScheme: ColorScheme
): Promise<void> {
  try {
    const response = await fetch('/api/export/comparison', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maps, view, colorScheme })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate comparison');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `disease-comparison-${new Date().toISOString().split('.')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating comparison image:', error);
    throw error;
  }
} 