"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Loading } from '@/components/shared/loading'
import { ColorScheme } from '@/lib/constants/color-schemes'

// Dynamically import map components with no SSR
const DiseaseMap = dynamic(
  () => import('./disease-map'),
  { 
    ssr: false,
    loading: () => <Loading height={700} />
  }
)

const UploadMap = dynamic(
  () => import('./upload-map'),
  { 
    ssr: false,
    loading: () => <Loading height={700} />
  }
)

const ComparisonMap = dynamic(
  () => import('./comparison-map'),
  { 
    ssr: false,
    loading: () => <Loading height={700} />
  }
)

interface MapWrapperProps {
  type: 'disease' | 'upload' | 'comparison';
  data?: {
    uploadedData?: {
      headers: string[];
      rows: string[][];
    };
    colorScheme?: ColorScheme;
    disease?: string;
    metric?: 'cases' | 'deaths';
    view?: 'district' | 'state';
    timeRange?: {
      start: string;
      end: string;
    };
    showLabels?: boolean;
    onMapReady?: () => void;
    height?: number;
    exportMode?: boolean;
    comparisonMode?: boolean;
  };
}

export default function MapWrapper({ type, data }: MapWrapperProps) {
  return (
    <Suspense fallback={<Loading height={700} />}>
      {type === 'upload' && (
        <UploadMap 
          uploadedData={data?.uploadedData || null} 
          colorScheme={data?.colorScheme || 'teal'} 
        />
      )}
      {type === 'disease' && <DiseaseMap />}
      {type === 'comparison' && (
        <ComparisonMap 
          disease={data?.disease || ''}
          metric={data?.metric || 'cases'}
          view={data?.view || 'state'}
          colorScheme={data?.colorScheme || 'teal'}
          timeRange={data?.timeRange || { start: '', end: '' }}
          height={data?.height}
          showLabels={data?.showLabels}
          onMapReady={data?.onMapReady}
          exportMode={data?.exportMode}
          comparisonMode={data?.comparisonMode}
        />
      )}
    </Suspense>
  )
}