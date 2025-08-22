"use client"

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { ColorScheme } from '@/lib/constants/color-schemes';
import { Loading } from '@/components/shared/loading';

// Import Map dynamically to avoid SSR issues with Leaflet
const DiseaseMap = dynamic(() => import('@/components/maps/disease-map'), { 
  ssr: false,
  loading: () => <Loading height={1600} />
});

interface MapExportData {
  disease: string;
  metric: 'cases' | 'deaths';
  view: 'district' | 'state';
  colorScheme: ColorScheme;
  timeRange: { start: string; end: string };
  showLabels: boolean;
  title?: string;
  description?: string;
  includeCredits?: boolean;
  showLegend?: boolean;
  showTop5?: boolean;
}

function ExportMapContent() {
  const searchParams = useSearchParams();
  const [exportData, setExportData] = useState<MapExportData | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    try {
      // Extract parameters from URL
      if (searchParams) {
        const disease = searchParams.get('disease');
        const metric = searchParams.get('metric') as 'cases' | 'deaths';
        const view = searchParams.get('view') as 'district' | 'state';
        const colorScheme = searchParams.get('colorScheme') as ColorScheme;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const showLabels = searchParams.get('showLabels') === 'true';
        const title = searchParams.get('title') || undefined;
        const description = searchParams.get('description') || undefined;
        const includeCredits = searchParams.get('includeCredits') === 'true';
        const showLegend = searchParams.get('showLegend') !== 'false'; // Default to true if not specified
        const showTop5 = searchParams.get('showTop5') !== 'false'; // Default to true if not specified

        if (disease && metric && view && startDate && endDate) {
          setExportData({
            disease,
            metric,
            view,
            colorScheme,
            timeRange: { start: startDate, end: endDate },
            showLabels,
            title,
            description,
            includeCredits,
            showLegend,
            showTop5
          });
        }
      }
    } catch (error) {
      console.error('Failed to parse export data:', error);
    }
  }, [searchParams]);

  if (!exportData) {
    return <div className="flex items-center justify-center h-screen">Loading export data...</div>;
  }

  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formatDateString = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div 
      id="export-map-container"
      className="relative bg-white"
      style={{ 
        width: '1800px', 
        height: '1200px', 
        overflow: 'hidden',
        backgroundImage: 'radial-gradient(circle, #f0f0f0 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      <div className="flex h-full">
        {/* Map Column - Left Side (70% width) */}
        <div className="w-[70%] h-full relative shadow-2xl overflow-hidden">
          <div className="absolute inset-0">
            <DiseaseMap
              height={1200}
              exportMode={true}
              onMapReady={() => setIsMapReady(true)}
              exportData={exportData}
            />
          </div>
          
          {/* Title overlay on the map for large screens */}
          {exportData.title && exportData.title.trim() !== '' && (
            <div className="absolute top-0 left-0 m-6 p-4 bg-white/80 rounded-lg backdrop-blur-sm z-40 max-w-[80%] shadow-md">
              <h1 className="text-3xl font-bold text-slate-800">
                {exportData.title}
              </h1>
            </div>
          )}
        </div>
        
        {/* Information Column - Right Side (30% width) */}
        <div className="w-[30%] h-full flex flex-col p-6 bg-white border-l border-slate-200">
          {/* Only show title in sidebar if not already shown on map */}
          {!exportData.title && (
            <h1 className="text-3xl font-bold text-slate-800 mb-4 border-b pb-2">
              {exportData.disease} {exportData.metric}
            </h1>
          )}
          
          {(exportData.description && exportData.description.trim() !== '') && (
            <div className="mb-4 mt-2">
              <h3 className="text-lg text-slate-700 italic">
                {exportData.description}
              </h3>
            </div>
          )}
          
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2 text-sm">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Disease:</span>
                <span className="font-semibold">{exportData.disease}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metric:</span> 
                <span className="font-semibold capitalize">{exportData.metric}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Geographic Level:</span>
                <span className="font-semibold capitalize">{exportData.view}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Period:</span>
                <span className="font-semibold">{formatDateString(exportData.timeRange.start)} - {formatDateString(exportData.timeRange.end)}</span>
              </div>
            </div>
          </div>
          
          {/* Top 5 Regions Section */}
          {exportData.showTop5 && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2 text-slate-800 flex items-center">
                <span className="w-1 h-5 bg-blue-500 rounded-full mr-2"></span>
                Top {exportData.view === 'state' ? 'States' : 'Districts'}
              </h2>
              <div id="top-5-container" className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                {/* This will be populated by the disease-map component */}
              </div>
            </div>
          )}
          
          {/* Legend Section */}
          {exportData.showLegend && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2 text-slate-800 flex items-center">
                <span className="w-1 h-5 bg-blue-500 rounded-full mr-2"></span>
                Legend
              </h2>
              <div id="legend-container" className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                {/* This will be populated by the disease-map component */}
              </div>
            </div>
          )}
          
          {/* Credits Section - At bottom */}
          <div className="mt-auto">
            {exportData.includeCredits && (
              <div className="text-xs text-slate-500 pt-3 border-t border-slate-200 mt-4 flex justify-between">
                <div>
                  <p>Disease Dashboard | Generated on {formattedDate}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-20">
          <Loading height={200} />
        </div>
      )}
    </div>
  );
}

export default function ExportMap() {
  return (
    <Suspense fallback={<Loading height={1200} />}>
      <ExportMapContent />
    </Suspense>
  );
} 