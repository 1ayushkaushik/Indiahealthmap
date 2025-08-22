"use client"

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Loading } from '@/components/shared/loading';
import { ColorScheme } from '@/lib/constants/color-schemes';

// Import UploadMap dynamically to avoid SSR issues with Leaflet
const UploadMap = dynamic(() => import('@/components/maps/upload-map'), { 
  ssr: false,
  loading: () => <Loading height={1600} />
});

interface UploadData {
  data: any;
  colorScheme: ColorScheme;
  title?: string;
  includeCredits?: boolean;
}

function ExportUploadContent() {
  const searchParams = useSearchParams();
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    try {
      const rawData = searchParams.get('data');
      if (rawData) {
        const parsedData = JSON.parse(rawData);
        setUploadData(parsedData);
      }
    } catch (error) {
      console.error('Failed to parse upload data:', error);
    }
  }, [searchParams]);

  if (!uploadData || !uploadData.data) {
    return <div className="flex items-center justify-center h-screen">No upload data provided</div>;
  }

  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div 
      id="export-container"
      className="relative bg-white"
      style={{ width: '1800px', height: '1800px', overflow: 'hidden' }}
    >
      {/* Title and Header Layer */}
      <div 
        className="absolute top-0 left-0 w-full pt-10 px-12 z-10"
        style={{ height: '200px' }}
      >
        <h1 className="text-4xl font-bold text-slate-800">
          {uploadData.title || 'Custom Data Visualization'}
        </h1>
      </div>

      {/* Map Layer */}
      <div 
        className="absolute" 
        style={{ top: '200px', left: '0', right: '0', height: 'calc(100% - 300px)' }}
      >
        <UploadMap
          uploadedData={uploadData.data}
          colorScheme={uploadData.colorScheme}
          height={1500}
          exportMode={true}
          onMapReady={() => setIsMapReady(true)}
        />
      </div>

      {/* Credits Layer */}
      {uploadData.includeCredits && (
        <div 
          className="absolute bottom-0 left-0 w-full px-12 py-6 text-slate-500 flex justify-between items-center"
          style={{ height: '100px', borderTop: '1px solid #e2e8f0' }}
        >
          <div>
            <p>Disease Dashboard | Generated on {formattedDate}</p>
          </div>
          <div>
            <p>Data source: Custom Upload</p>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-20">
          <Loading height={200} />
        </div>
      )}
    </div>
  );
}

export default function ExportUpload() {
  return (
    <Suspense fallback={<Loading height={1800} />}>
      <ExportUploadContent />
    </Suspense>
  );
} 