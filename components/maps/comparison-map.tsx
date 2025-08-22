"use client"

import { useEffect, useState, useMemo, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, GeoJSON } from 'react-leaflet'
import { processGeoJSON } from '@/lib/utils/geo'
import { Loading } from '@/components/shared/loading'
import L from 'leaflet'
import { COLOR_SCHEMES, type ColorScheme } from '@/lib/constants/color-schemes'
import type { LeafletEvent } from 'leaflet'
import type { GeoJsonObject, Feature, Geometry } from 'geojson'
import type { MapContainerProps } from 'react-leaflet'

interface DiseaseData {
  [key: string]: {
    cases: number
    deaths: number
  }
}

interface ComparisonMapProps {
  id?: string;
  disease: string;
  metric: 'cases' | 'deaths';
  view: 'district' | 'state';
  colorScheme: ColorScheme;
  timeRange: { start: string; end: string };
  height?: number;
  totalMaps?: number;
  showLabels?: boolean;
  onMapReady?: () => void;
  exportMode?: boolean;
  comparisonMode?: boolean;
}

function calculateLegendRanges(data: DiseaseData, metric: 'cases' | 'deaths'): number[] {
  // Get all non-zero values
  const values = Object.values(data)
    .map(d => d[metric])
    .filter(val => val > 0)
    .sort((a, b) => b - a)

  if (values.length === 0) return [100, 50, 25, 10, 5, 2, 1, 0]

  const max = Math.max(...values)
  const quantiles = [
    max,                          // Max value
    values[Math.floor(values.length * 0.12)], // 88th percentile
    values[Math.floor(values.length * 0.25)], // 75th percentile
    values[Math.floor(values.length * 0.37)], // 63th percentile
    values[Math.floor(values.length * 0.5)],  // Median
    values[Math.floor(values.length * 0.63)], // 37th percentile
    values[Math.floor(values.length * 0.75)], // 25th percentile
    0                            // Min value
  ]

  // Round numbers for cleaner display
  return quantiles.map(val => {
    if (val >= 1000) return Math.round(val / 100) * 100
    if (val >= 100) return Math.round(val / 10) * 10
    return Math.round(val)
  })
}

// India's bounding box coordinates
const INDIA_BOUNDS: L.LatLngBoundsLiteral = [
  [6.2325, 68.1097],  // Southwest corner
  [35.6745, 97.1647]  // Northeast corner
];

function useComparisonMapZoom(totalMaps: number) {
  const [zoom, setZoom] = useState(4);
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function updateZoom() {
      if (!containerRef.current || !mapRef.current) return;
      
      const width = containerRef.current.clientWidth;
      
      // Base zoom level depends on number of maps
      let baseZoom = totalMaps <= 2 ? 4.4 : 3.8;
      
      // Adjust for screen size
      if (width < 640) { // sm
        baseZoom -= 0.8;
      } else if (width < 768) { // md
        baseZoom -= 0.6;
      } else if (width < 1024) { // lg
        baseZoom -= 0.4;
      } else if (width < 1536) { // xl
        baseZoom -= 0.2;
      } else if (width < 1920) { // 2xl
        baseZoom += 0.2;
      } else if (width < 2560) { // 3xl
        baseZoom += 0.4;
      } else { // 4k and above
        baseZoom += 0.6;
      }
      
      setZoom(baseZoom);
      
      // Ensure map fits bounds after zoom change
      mapRef.current.fitBounds(INDIA_BOUNDS);
    }

    // Initial update
    updateZoom();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateZoom);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [totalMaps]);

  return { zoom, mapRef, containerRef };
}

export function ComparisonMap({ 
  id,
  disease, 
  metric, 
  view, 
  colorScheme, 
  timeRange,
  height = 400,
  totalMaps = 2,
  showLabels = true,
  onMapReady,
  exportMode = false,
  comparisonMode = false
}: ComparisonMapProps) {
  const { zoom, mapRef, containerRef } = useComparisonMapZoom(totalMaps);
  const [diseaseData, setDiseaseData] = useState<DiseaseData>({})
  const [isLoading, setIsLoading] = useState(true)
  const processedGeoJSON = processGeoJSON(view)

  const thresholds = useMemo(() =>
    calculateLegendRanges(diseaseData, metric),
    [diseaseData, metric]
  )

  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams({
      disease,
      view,
      start: timeRange.start,
      end: timeRange.end
    })

    fetch(`/api/disease-data?${params}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch disease data: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid data format received from API')
        }
        setDiseaseData(data)
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error fetching disease data:', error)
        setDiseaseData({})
        setIsLoading(false)
      })
  }, [disease, view, timeRange])

  const getColor = (value: number) => {
    if (value === 0) return '#ffffff';
    const colors = COLOR_SCHEMES[colorScheme]
    for (let i = 0; i < thresholds.length; i++) {
      if (value >= thresholds[i]) return colors[i]
    }
    return colors[colors.length - 1]
  }

  const style = (feature: GeoJSON.Feature) => {
    if (!feature.properties) return {};
    const name = view === 'state' ? feature.properties.stateName : feature.properties.name;
    const value = diseaseData[name]?.[metric] || 0;

    return {
      fillColor: getColor(value),
      weight: 1,
      opacity: 1,
      color: '#0f172a',
      fillOpacity: 0.7
    };
  }

  // Initialize map when it's mounted
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.fitBounds(INDIA_BOUNDS);
  }, []); // Empty dependency array since this should only run once on mount

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    map.setView([23.5937, 78.9629], zoom);
    
    // Disable interactions
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if ('tap' in map) (map as any).tap.disable();

    // Cleanup function
    return () => {
      if (map) {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
        if ('tap' in map) (map as any).tap.enable();
      }
    };
  }, [zoom]); // Only zoom should trigger this effect

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Update map when data changes
    map.fitBounds(INDIA_BOUNDS);
    
    // Call onMapReady callback if provided
    if (onMapReady) {
      onMapReady();
    }
  }, [disease, metric, view, timeRange, onMapReady]); // Add all dependencies that should trigger map updates

  if (isLoading) {
    return <Loading height={height} />;
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
    >
      <MapContainer
        ref={mapRef}
        style={{ height: '100%', width: '100%' }}
        center={[23.5937, 78.9629]}
        zoom={zoom}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={zoom - 0.5}
        maxZoom={zoom + 0.5}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
      >
        <GeoJSON
          key={`${view}-${metric}-${colorScheme}-${disease}`}
          data={processedGeoJSON as GeoJsonObject}
          style={style as any}
        />
      </MapContainer>
      
      <div className="absolute top-2 left-2 z-10 p-2 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 hidden sm:block">
        <div className="text-sm font-medium">{disease}</div>
      </div>
    </div>
  );
}

export default ComparisonMap; 