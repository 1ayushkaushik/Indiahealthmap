"use client"

import { useEffect, useState, useMemo } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, GeoJSON } from 'react-leaflet'
import { processGeoJSON } from '@/lib/utils/geo'
import { Loading } from '@/components/shared/loading'
import { COLOR_SCHEMES, type ColorScheme } from '@/lib/constants/color-schemes'
import type { Feature, GeoJsonObject, GeoJsonProperties } from 'geojson'

interface UploadedData {
  headers: string[];
  rows: string[][];
}

interface ValidationError {
  row: number;
  message: string;
}

interface UploadMapProps {
  uploadedData: {
    headers: string[];
    rows: string[][];
  } | null;
  colorScheme?: ColorScheme;
  height?: number;
  exportMode?: boolean;
  onMapReady?: () => void;
}

interface ProcessedData {
  [key: string]: { 
    cases: number; 
    deaths: number; 
  };
}

function normalizeStateName(name: string): string {
  // Convert to title case and handle special cases
  return name.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/And/g, 'and')  // Handle 'and' in state names
    .replace(/Of/g, 'of');   // Handle 'of' in state names
}

function validateData(data: UploadedData): { 
  isValid: boolean; 
  errors: ValidationError[]; 
  type: 'state' | 'district' | null;
} {
  const errors: ValidationError[] = [];
  let hasStateName = false;
  let hasDistrictName = false;
  let hasCases = false;
  let hasDeaths = false;

  // Check headers
  data.headers.forEach(header => {
    if (header.toLowerCase().includes('state')) hasStateName = true;
    if (header.toLowerCase().includes('district')) hasDistrictName = true;
    if (header.toLowerCase().includes('case')) hasCases = true;
    if (header.toLowerCase().includes('death')) hasDeaths = true;
  });

  if (!hasStateName) {
    errors.push({ row: 0, message: 'Missing state name column' });
  }
  if (!hasCases && !hasDeaths) {
    errors.push({ row: 0, message: 'Missing cases or deaths column' });
  }

  // Validate each row
  data.rows.forEach((row, index) => {
    if (row.length !== data.headers.length) {
      errors.push({ 
        row: index + 1, 
        message: `Row ${index + 1} has incorrect number of columns` 
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    type: hasDistrictName ? 'district' : 'state'
  };
}

function processUploadedData(data: UploadedData | null): ProcessedData {
  if (!data) return {};
  
  const processedData: ProcessedData = {};
  
  // Find column indices
  const stateIndex = data.headers.findIndex(h => h.toLowerCase().includes('state'));
  const districtIndex = data.headers.findIndex(h => h.toLowerCase().includes('district'));
  const casesIndex = data.headers.findIndex(h => h.toLowerCase().includes('case'));
  const deathsIndex = data.headers.findIndex(h => h.toLowerCase().includes('death'));

  data.rows.forEach(row => {
    let key = districtIndex !== -1 ? row[districtIndex] : row[stateIndex];
    // Normalize the key (state/district name)
    key = normalizeStateName(key);
    
    const cases = casesIndex !== -1 ? parseInt(row[casesIndex]) || 0 : 0;
    const deaths = deathsIndex !== -1 ? parseInt(row[deathsIndex]) || 0 : 0;

    if (!processedData[key]) {
      processedData[key] = { cases: 0, deaths: 0 };
    }
    processedData[key].cases += cases;
    processedData[key].deaths += deaths;
  });

  return processedData;
}

function calculateLegendRanges(data: ProcessedData, metric: 'cases' | 'deaths'): number[] {
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

function formatNumber(num: number): string {
  return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
}

function useMapZoom() {
  const [zoom, setZoom] = useState(4.7);

  useEffect(() => {
    function updateZoom() {
      const width = window.innerWidth;
      if (width < 640) { // sm breakpoint
        setZoom(3.8);
      } else if (width < 768) { // md breakpoint
        setZoom(4.2);
      } else if (width < 1024) { // lg breakpoint
        setZoom(4.5);
      } else {
        setZoom(4.7);
      }
    }

    // Set initial zoom
    updateZoom();

    // Update zoom on window resize
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, []);

  return zoom;
}

export default function UploadMap({ 
  uploadedData, 
  colorScheme = 'teal', 
  height = 600, 
  exportMode = false,
  onMapReady
}: UploadMapProps) {
  const [processedData, setProcessedData] = useState<ProcessedData>({});
  const [hasErrors, setHasErrors] = useState(false);
  const zoom = useMapZoom();
  
  const mapType = useMemo(() => {
    if (!uploadedData) return 'state';
    return uploadedData.headers.some(h => h.toLowerCase().includes('district')) ? 'district' : 'state';
  }, [uploadedData]);

  const thresholds = useMemo(() =>
    calculateLegendRanges(processedData, 'cases'),
    [processedData]
  );

  useEffect(() => {
    console.log('Uploaded Data:', uploadedData);
    if (!uploadedData) {
      setProcessedData({});
      setHasErrors(false);
      return;
    }

    const validationResult = validateData(uploadedData);
    console.log('Validation Result:', validationResult);
    
    if (validationResult.isValid) {
      const processed = processUploadedData(uploadedData);
      console.log('Processed Data:', processed);
      setProcessedData(processed);
      setHasErrors(false);
    } else {
      setProcessedData({});
      setHasErrors(true);
    }
  }, [uploadedData]);

  useEffect(() => {
    if (uploadedData) {
      // Process data and set states
      processUploadedData(uploadedData);
    }
  }, [uploadedData]);

  // Notify parent when map is ready (for export purposes)
  useEffect(() => {
    if (exportMode && onMapReady && processedData && Object.keys(processedData).length > 0) {
      // Small delay to ensure map is fully rendered
      setTimeout(() => {
        onMapReady();
      }, 1000);
    }
  }, [exportMode, onMapReady, processedData]);

  const getColor = (value: number) => {
    if (!value || value === 0) return '#ffffff';
    
    const colors = COLOR_SCHEMES[colorScheme];
    for (let i = 0; i < thresholds.length; i++) {
      if (value >= thresholds[i]) return colors[i];
    }
    return colors[colors.length - 1];
  };

  const style = (feature: Feature<any, GeoJsonProperties>) => {
    if (!feature.properties) {
      return {
        fillColor: '#ffffff',
        weight: 1,
        opacity: 1,
        color: '#0f172a',
        fillOpacity: 0.7
      };
    }

    const name = mapType === 'state' ? 
      normalizeStateName(feature.properties.stateName) : 
      normalizeStateName(feature.properties.name);
    
    console.log('Feature Name:', name, 'Data:', processedData[name]);
    const value = processedData[name]?.cases || 0;

    return {
      fillColor: getColor(value),
      weight: 1,
      opacity: 1,
      color: '#0f172a',
      fillOpacity: 0.7
    };
  };

  const geoJSONData = processGeoJSON(mapType) as GeoJsonObject;

  return (
    <div 
      className={`relative rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden ${exportMode ? 'export-map-container' : 'map-container'}`} 
      style={{ height }}
    >
      <MapContainer
        center={[20.5937, 78.9629]} // Center of India
        zoom={exportMode ? 5 : 4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={!exportMode}
        attributionControl={!exportMode}
        className={exportMode ? 'export-leaflet-container' : ''}
      >
        <GeoJSON
          key={`upload-${mapType}-${colorScheme}`}
          data={geoJSONData}
          style={style as any}
        />
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-2 left-2 z-[400] bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="text-xs font-mono space-y-1">
          <div className="mb-2 font-semibold">Cases</div>
          {thresholds.map((threshold, index) => (
            <div key={threshold} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: COLOR_SCHEMES[colorScheme][index] }}
              />
              <span>
                {index === 0 ? `≥ ${formatNumber(threshold)}` :
                  index === thresholds.length - 1 ? `< ${formatNumber(thresholds[index - 1])}` :
                  `${formatNumber(threshold)} - ${formatNumber(thresholds[index - 1])}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Debug Info */}
      <div className="absolute bottom-2 left-2 z-[400] bg-white/90 dark:bg-slate-800/90 p-2 rounded text-xs">
        Map Type: {mapType}, Data Count: {Object.keys(processedData).length}
      </div>

      {/* Overlay Messages */}
      {!uploadedData && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80">
          <p className="text-slate-500">Upload data to preview map</p>
        </div>
      )}
      {hasErrors && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80">
          <p className="text-red-500">Please fix validation errors</p>
        </div>
      )}
    </div>
  );
} 