"use client"

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Loading } from '@/components/shared/loading';
import { ColorScheme } from '@/lib/constants/color-schemes';

// Import Map dynamically to avoid SSR issues with Leaflet
const DiseaseMap = dynamic(() => import('@/components/maps/disease-map'), { 
  ssr: false,
  loading: () => <Loading height={700} />
});

interface MapData {
  disease: string;
  metric: 'cases' | 'deaths';
  view: 'district' | 'state';
  colorScheme: ColorScheme;
  timeRange: { start: string; end: string };
  showLabels: boolean;
}

interface ComparisonData {
  maps: MapData[];
  title?: string;
  includeCredits?: boolean;
}

function ExportComparisonContent() {
  const searchParams = useSearchParams();
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [mapsReady, setMapsReady] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const rawData = searchParams.get('data');
      if (rawData) {
        const parsedData = JSON.parse(rawData);
        setComparisonData(parsedData);
      }
    } catch (error) {
      console.error('Failed to parse comparison data:', error);
    }
  }, [searchParams]);

  // Determine if all maps are ready
  const allMapsReady = comparisonData?.maps
    ? Object.keys(mapsReady).length === comparisonData.maps.length && 
      Object.values(mapsReady).every(ready => ready)
    : false;

  if (!comparisonData || !comparisonData.maps || comparisonData.maps.length === 0) {
    return <div className="flex items-center justify-center h-screen">No comparison data provided</div>;
    }

  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mapCount = comparisonData.maps.length;
  const columns = mapCount <= 2 ? mapCount : Math.min(3, mapCount);
  const rows = Math.ceil(mapCount / columns);

  return (
    <div 
      id="comparison-container" 
      className="relative bg-white"
      style={{ width: '2400px', height: '1800px', overflow: 'hidden' }}
    >
      {/* Title and Header */}
      <div className="pt-10 px-16 pb-5 text-center">
        <h1 className="text-4xl font-bold text-slate-800">
          {comparisonData.title || 'Disease Comparison'}
      </h1>
      </div>

      {/* Maps Grid */}
      <div 
        className="p-8 grid gap-8"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          height: comparisonData.includeCredits ? 'calc(100% - 180px)' : 'calc(100% - 100px)'
        }}
      >
        {comparisonData.maps.map((mapData, index) => (
          <div key={index} className="flex flex-col border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-semibold">{mapData.disease}</h2>
              <p className="text-sm text-slate-500">
                {mapData.metric === 'cases' ? 'Cases' : 'Deaths'} by {mapData.view} 
                ({new Date(mapData.timeRange.start).toLocaleDateString()} - {new Date(mapData.timeRange.end).toLocaleDateString()})
              </p>
            </div>
            <div className="flex-1">
              <DiseaseMap
                height={500}
                exportMode={true}
                exportData={mapData}
                onMapReady={() => setMapsReady(prev => ({ ...prev, [index]: true }))}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Credits */}
      {comparisonData.includeCredits && (
        <div className="absolute bottom-0 left-0 w-full px-16 py-6 text-slate-500 flex justify-between items-center border-t border-slate-200">
          <div>
            <p>Disease Dashboard | Generated on {formattedDate}</p>
          </div>
          <div>
            <p>Data source: Disease Surveillance System</p>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {!allMapsReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-20">
          <Loading height={200} />
      </div>
      )}
    </div>
  );
}

export default function ExportComparison() {
  return (
    <Suspense fallback={<Loading height={1800} />}>
      <ExportComparisonContent />
    </Suspense>
  );
} 