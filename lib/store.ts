import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { type ColorScheme } from '@/lib/constants/color-schemes'

export type TimeRangeType = 'total' | 'yearly' | 'specific'
export type ViewType = 'district' | 'state'
export type MetricType = 'cases' | 'deaths'

interface FilterState {
  view: ViewType
  disease: string
  metric: MetricType
  colorScheme: ColorScheme
  timeRangeType: TimeRangeType
  showLabels: boolean
  showComparisonDialog: boolean
  timeRange: {
    start: string
    end: string
  }
  selectedRegion: string | null
  setView: (view: ViewType) => void
  setDisease: (disease: string) => void
  setMetric: (metric: MetricType) => void
  setColorScheme: (scheme: ColorScheme) => void
  setTimeRangeType: (type: TimeRangeType) => void
  setTimeRange: (range: { start: string, end: string }) => void
  setShowLabels: (show: boolean) => void
  setShowComparisonDialog: (show: boolean) => void
  setSelectedRegion: (region: string | null) => void
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      view: 'district',
      disease: 'acute diarrheal disease',
      metric: 'cases',
      colorScheme: 'teal',
      timeRangeType: 'yearly',
      showLabels: true,
      showComparisonDialog: false,
      timeRange: {
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-12-31T23:59:59.999Z'
      },
      selectedRegion: null,
      setView: (view) => set({ view }),
      setDisease: (disease) => set({ disease }),
      setMetric: (metric) => set({ metric }),
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
      setTimeRangeType: (type) => set((state) => {
        let start = state.timeRange.start;
        let end = '2024-12-31T23:59:59.999Z';

        switch (type) {
          case 'total':
            start = '2020-01-01T00:00:00.000Z';
            break;
          case 'yearly':
            start = '2024-01-01T00:00:00.000Z';
            break;
          case 'specific':
            // Keep existing range for specific
            break;
        }

        return { timeRangeType: type, timeRange: { start, end } }
      }),
      setTimeRange: (range) => set({ timeRange: range }),
      setShowLabels: (show) => set({ showLabels: show }),
      setShowComparisonDialog: (show) => set({ showComparisonDialog: show }),
      setSelectedRegion: (region) => set({ selectedRegion: region })
    }),
    {
      name: 'disease-dashboard-filters',
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      version: 1,
    }
  )
)

declare global {
  interface Window {
    store: {
      getState: () => FilterState
    }
  }
}

// After creating store
if (typeof window !== 'undefined') {
  window.store = useFilterStore
} 