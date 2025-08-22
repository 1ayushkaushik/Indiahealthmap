import type { ColorScheme } from '@/lib/constants/color-schemes';

export interface DiseaseData {
  [key: string]: {
    cases: number;
    deaths: number;
  };
}

export interface Disease {
  id: number;
  name: string;
  totalCases: number;
  totalDeaths: number;
}

export interface MapConfig {
  id: string;
  disease: string;
  totalCases: number;
  totalDeaths: number;
  timeRange: { start: string; end: string };
  metric: 'cases' | 'deaths';
  view?: 'district' | 'state';
  colorScheme?: ColorScheme;
} 