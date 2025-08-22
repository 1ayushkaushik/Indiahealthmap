"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, GeoJSON, useMap } from 'react-leaflet'
import { processGeoJSON } from '@/lib/utils/geo'
import { Loading } from '@/components/shared/loading'
import { useFilterStore } from '@/lib/store'
import L from 'leaflet'
import { COLOR_SCHEMES, type ColorScheme } from '@/lib/constants/color-schemes'
import MapLabels from './map-labels'
import type { LeafletEvent } from 'leaflet'
import type { MapContainerProps } from 'react-leaflet'

interface DiseaseData {
  [key: string]: {
    cases: number
    deaths: number
  }
}

interface DiseaseMapProps {
  height?: number;
  exportMode?: boolean;
  exportData?: {
    disease: string;
    metric: 'cases' | 'deaths';
    view: 'district' | 'state';
    colorScheme: ColorScheme;
    timeRange: { start: string; end: string };
    showLabels: boolean;
    showLegend?: boolean;
    showTop5?: boolean;
    title?: string;
    description?: string;
    includeCredits?: boolean;
  };
  onMapReady?: () => void;
}

// India's bounding box coordinates for normal view
const INDIA_BOUNDS: L.LatLngBoundsLiteral = [
  [7.2325, 68.1097],  // Southwest corner
  [35.6745, 97.1647]  // Northeast corner
];

// India's bounding box with more padding for export view (to ensure map fills the container)
const INDIA_EXPORT_BOUNDS: L.LatLngBoundsLiteral = [
  [5.5, 67.0],  // Southwest corner - expanded
  [37.0, 98.5]  // Northeast corner - expanded
];

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

function formatNumber(num: number): string {
  return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString()
}

// Component to manage labels
function StateLabels({ data, metric }: { data: DiseaseData, metric: 'cases' | 'deaths' }) {
  const map = useMap()
  const labelsRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    // Clear existing labels
    if (labelsRef.current) {
      labelsRef.current.clearLayers()
    } else {
      labelsRef.current = L.layerGroup().addTo(map)
    }

    // Add new labels
    const geoJson = processGeoJSON('state')
    geoJson.features.forEach(feature => {
      const name = feature.properties.stateName
      const value = data[name]?.[metric] || 0
      
      // Calculate center of the state
      const layer = L.geoJSON(feature as GeoJSON.Feature)
      const center = layer.getBounds().getCenter()

      // Create label
      const label = L.divIcon({
        className: 'state-label',
        html: `
          <div>
            <div class="label-title">${name}</div>
            <div class="label-value">${metric === 'cases' ? 'Cases' : 'Deaths'}: ${value.toLocaleString()}</div>
          </div>
        `,
      })

      L.marker(center, { icon: label }).addTo(labelsRef.current!)
    })

    return () => {
      if (labelsRef.current) {
        labelsRef.current.clearLayers()
      }
    }
  }, [map, data, metric])

  return null
}

// Update the HoverInfo component to display at the top center of the map

function HoverInfo() {
  const map = useMap();
  const infoRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    // Create info control
    const info = L.DomUtil.create('div', 'hover-info');
    info.style.display = 'none';
    info.innerHTML = 'Hover over a region';
    
    // Add to map
    const container = map.getContainer();
    container.appendChild(info);
    infoRef.current = info;
    
    // Position the info box at the top center
    if (infoRef.current) {
      infoRef.current.style.position = 'absolute';
      infoRef.current.style.top = '10px';
      infoRef.current.style.left = '50%';
      infoRef.current.style.transform = 'translateX(-50%)';
      infoRef.current.style.zIndex = '1000';
    }
    
    // Clean up on unmount
    return () => {
      if (infoRef.current && container.contains(infoRef.current)) {
        container.removeChild(infoRef.current);
      }
    };
  }, [map]);
  
  // Expose methods to update the info box
  const updateInfo = (props: any, metric: string, value: number) => {
    if (infoRef.current) {
      infoRef.current.style.display = 'block';
      infoRef.current.innerHTML = `
        <strong>${props.name || props.stateName}</strong><br/>
        ${metric === 'cases' ? 'Cases' : 'Deaths'}: ${value.toLocaleString()}
      `;
    }
  };
  
  const hideInfo = () => {
    if (infoRef.current) {
      infoRef.current.style.display = 'none';
    }
  };
  
  // Make methods available to parent component
  (map as any).updateHoverInfo = updateInfo;
  (map as any).hideHoverInfo = hideInfo;
  
  return null;
}

function useResponsiveZoom(exportMode: boolean) {
  const [zoom, setZoom] = useState(4);
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const updateZoom = useCallback(() => {
    if (!containerRef.current || !mapRef.current) return;
    
    const width = containerRef.current.clientWidth;
    
    // Define zoom levels for different breakpoints
    let newZoom;
    
    // Use higher zoom for export mode
    if (exportMode) {
      // For export, use a higher zoom level to fill the container
      newZoom = 5.8; // Higher zoom for export
    } else {
      // Regular zoom levels for dashboard
      if (width < 640) { // sm
        newZoom = 3.2;
      } else if (width < 768) { // md
        newZoom = 3.6;
      } else if (width < 1024) { // lg
        newZoom = 5;
      } else if (width < 1536) { // xl
        newZoom = 5.4;
      } else if (width < 1920) { // 2xl
        newZoom = 5.8;
      } else if (width < 2560) { // 3xl
        newZoom = 6.2;
      } else { // 4k and above
        newZoom = 6.6;
      }
    }

    setZoom(newZoom);
    
    // Ensure map fits bounds after zoom change with padding for export mode
    if (exportMode) {
      // Use the export-specific bounds that are wider
      mapRef.current.fitBounds(INDIA_EXPORT_BOUNDS, {
        padding: [-200, -200], // Even more negative padding for export
        animate: false
      });
      
      // Force a slightly higher zoom level
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.setZoom(newZoom + 0.5);
        }
      }, 100);
    } else {
      mapRef.current.fitBounds(INDIA_BOUNDS);
    }
  }, [exportMode]);

  useEffect(() => {
    // Initial update
    updateZoom();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateZoom);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [updateZoom]);

  // Initialize map when it's mounted
  useEffect(() => {
    if (mapRef.current) {
      if (exportMode) {
        // Use the export-specific bounds
        mapRef.current.fitBounds(INDIA_EXPORT_BOUNDS, {
          padding: [-200, -200], 
          animate: false
        });
        
        // Force a slightly higher zoom level after initial render
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.setZoom(zoom + 0.5);
          }
        }, 100);
      } else {
        mapRef.current.fitBounds(INDIA_BOUNDS);
      }
    }
  }, [exportMode, zoom]); 

  return { zoom, mapRef, containerRef };
}

export default function DiseaseMap({ 
  height = 700, 
  exportMode = false, 
  exportData, 
  onMapReady 
}: DiseaseMapProps) {
  const { zoom, mapRef, containerRef } = useResponsiveZoom(exportMode);
  
  // Move all useFilterStore calls out of conditionals
  const storeView = useFilterStore(state => state.view);
  const storeDisease = useFilterStore(state => state.disease);
  const storeMetric = useFilterStore(state => state.metric);
  const storeColorScheme = useFilterStore(state => state.colorScheme);
  const storeShowLabels = useFilterStore(state => state.showLabels);
  const storeTimeRange = useFilterStore(state => state.timeRange);
  const storeSelectedRegion = useFilterStore(state => state.selectedRegion);
  const setSelectedRegion = useFilterStore(state => state.setSelectedRegion);
  
  // Then use the values conditionally
  const view = exportMode && exportData ? exportData.view : storeView;
  const disease = exportMode && exportData ? exportData.disease : storeDisease;
  const metric = exportMode && exportData ? exportData.metric : storeMetric;
  const colorScheme = exportMode && exportData ? exportData.colorScheme : storeColorScheme;
  const showLabels = exportMode && exportData ? exportData.showLabels : storeShowLabels;
  const showLegend = exportMode && exportData ? exportData.showLegend !== false : true; // Default to true
  const showTop5 = exportMode && exportData ? exportData.showTop5 !== false : false; // Default to false in regular dashboard
  const timeRange = exportMode && exportData ? exportData.timeRange : storeTimeRange;
  
  const [diseaseData, setDiseaseData] = useState<DiseaseData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const processedGeoJSON = processGeoJSON(view);
  const [topRegions, setTopRegions] = useState<{name: string, value: number}[]>([]);

  const thresholds = useMemo(() =>
    calculateLegendRanges(diseaseData, metric),
    [diseaseData, metric]
  )

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({
      disease: encodeURIComponent(disease),
      view,
      start: timeRange.start,
      end: timeRange.end
    });

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
        setDiseaseData(data);
        setIsLoading(false);
        
        // Notify parent when map is ready (for export purposes)
        if (exportMode && onMapReady && !isMapInitialized) {
          // Small delay to ensure map is fully rendered
          setTimeout(() => {
            setIsMapInitialized(true);
            onMapReady();
          }, 1000);
        }
      })
      .catch(error => {
        console.error('Error fetching disease data:', error);
        setDiseaseData({});
        setIsLoading(false);
      });
  }, [view, disease, timeRange, exportMode, onMapReady, isMapInitialized]);

  useEffect(() => {
    // Calculate top regions when data changes
    if (Object.keys(diseaseData).length > 0) {
      const regionsArray = Object.entries(diseaseData)
        .map(([name, data]) => ({ 
          name, 
          value: data[metric] 
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      
      setTopRegions(regionsArray);
    }
  }, [diseaseData, metric]);

  const getColor = (value: number) => {
    // Return white for 0 values
    if (value === 0) {
      return '#ffffff'; // White color for 0 values
    }
    
    const colors = COLOR_SCHEMES[colorScheme]
    for (let i = 0; i < thresholds.length; i++) {
      if (value >= thresholds[i]) return colors[i]
    }
    return colors[colors.length - 1]
  }

  const style = (feature: GeoJSON.Feature) => {
    if (!feature.properties) {
      return {
        fillColor: COLOR_SCHEMES[colorScheme][COLOR_SCHEMES[colorScheme].length - 1],
        weight: 1,
        opacity: 1,
        color: '#0f172a',
        fillOpacity: 0.7
      };
    }
    
    const name = view === 'state' ? 
      (feature.properties.stateName as string) : 
      (feature.properties.name as string);
    
    const value = diseaseData[name]?.[metric] || 0;
    const isSelected = storeSelectedRegion === (view === 'state' ? 
      name : 
      `${feature.properties.stateName}|${name}`);

    return {
      fillColor: getColor(value),
      weight: isSelected ? 2 : 1,
      opacity: 1,
      color: '#0f172a',
      fillOpacity: 0.7
    };
  }

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    if (!feature.properties) return;
    
    const name = view === 'state' ? 
      (feature.properties.stateName as string) : 
      (feature.properties.name as string);
    
    const data = diseaseData[name] || { cases: 0, deaths: 0 };
    const value = data[metric];

    // Add hover and click events
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        
        // Highlight the layer
        layer.setStyle({
          weight: 2,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.9
        });
        
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
        }
        
        // Update info box
        if (mapRef.current && (mapRef.current as any).updateHoverInfo) {
          (mapRef.current as any).updateHoverInfo(feature.properties, metric, value);
        }
      },
      mouseout: (e) => {
        // Reset style
        const geoJsonLayer = e.target;
        geoJsonLayer.setStyle(style(feature) as L.PathOptions);
        
        // Hide info box
        if (mapRef.current && (mapRef.current as any).hideHoverInfo) {
          (mapRef.current as any).hideHoverInfo();
        }
      },
      click: (e) => {
        // Get the selected region
        const selectedRegion = view === 'state' ? 
          name : 
          feature.properties ? `${feature.properties.stateName}|${name}` : name;

        // Toggle selection
        if (storeSelectedRegion === selectedRegion) {
          // If clicking the same region, deselect it
          setSelectedRegion(null);
        } else {
          // Otherwise, select the new region
          setSelectedRegion(selectedRegion);
        }

        // Update style to show selection
        const layers = e.target;
        Object.values(layers._layers || {}).forEach((layer: any) => {
          const isSelected = layer.feature.properties?.name === name;
          layer.setStyle({
            weight: isSelected ? 3 : 1,
            color: isSelected ? '#000' : '#0f172a',
            fillOpacity: isSelected ? 0.9 : 0.7
          });
        });

        // Scroll to charts smoothly
        const chartsElement = document.querySelector('.chart-container');
        if (chartsElement) {
          chartsElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  }

  // Use effect to update external containers if they exist - for export mode
  useEffect(() => {
    if (exportMode && topRegions.length > 0) {
      // Try to find external containers for top 5 and legend
      const top5Container = document.getElementById('top-5-container');
      const legendContainer = document.getElementById('legend-container');
      
      // Populate top 5 container if it exists
      if (top5Container && showTop5) {
        const content = topRegions.map((region, index) => `
          <div class="flex items-center justify-between gap-1 py-2 border-b border-slate-200 last:border-0">
            <div class="flex items-center gap-2">
              <div class="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold text-sm">${index + 1}</div>
              <span class="text-base">${region.name}</span>
            </div>
            <span class="text-base font-semibold">${region.value.toLocaleString()}</span>
          </div>
        `).join('');
        
        top5Container.innerHTML = content;
      }
      
      // Populate legend container if it exists
      if (legendContainer && showLegend) {
        const content = thresholds.map((threshold, index) => {
          const colors = COLOR_SCHEMES[colorScheme];
          return `
            <div class="flex items-center gap-2 my-1.5">
              <div class="w-4 h-4 rounded-sm flex-shrink-0" style="background-color: ${colors[index]}"></div>
              <span class="text-sm">
                ${index === 0 ? `≥ ${formatNumber(threshold)}` :
                  index === thresholds.length - 1 ? `< ${formatNumber(thresholds[index - 1])}` :
                    `${formatNumber(threshold)} - ${formatNumber(thresholds[index - 1])}`}
              </span>
            </div>
          `;
        }).join('');
        
        legendContainer.innerHTML = content;
      }
    }
  }, [exportMode, topRegions, thresholds, showTop5, showLegend, colorScheme]);

  if (isLoading) {
    return <Loading height={height} />
  }

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden ${exportMode ? 'export-map-container' : 'map-container'}`} 
      style={{ height }}
    >
      <style jsx global>{`
        .hover-info {
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 4px;
          padding: 10px 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          font-size: 16px;
          pointer-events: none;
          text-align: center;
          min-width: 200px;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .hover-info strong {
          font-size: 18px;
          color: #333;
        }
        .state-label {
          background: none;
          border: none;
          box-shadow: none;
        }
        .state-label > div {
          background-color: rgba(255, 255, 255, 0.85);
          border-radius: 4px;
          padding: 4px 8px;
          font-size: ${exportMode ? '16px' : '10px'};
          text-align: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          pointer-events: none;
          white-space: nowrap;
        }
        .label-title {
          font-weight: bold;
          margin-bottom: 2px;
        }
        .label-value {
          font-size: ${exportMode ? '14px' : '9px'};
        }
        .export-map-container .leaflet-control-container .leaflet-top,
        .export-map-container .leaflet-control-container .leaflet-bottom {
          z-index: 1000;
        }
        .export-map-container .leaflet-control-zoom {
          display: none;
        }
      `}</style>
      
      <MapContainer
        ref={mapRef}
        style={{ height: '100%', background: 'transparent' }}
        zoomControl={!exportMode}
        dragging={true}
        attributionControl={!exportMode}
        center={[24.5937, 78.9629]}
        zoom={exportMode ? zoom + 1.6 : zoom + 0.6}
        minZoom={exportMode ? zoom + 1.0 : zoom + 0.6}
        maxZoom={exportMode ? zoom + 3.0 : zoom + 2}
        zoomSnap={0}
        zoomDelta={0.2} 
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        className={exportMode ? 'export-leaflet-container' : ''}
      >
        <GeoJSON
          key={`${view}-${metric}-${colorScheme}`}
          data={processedGeoJSON as GeoJSON.FeatureCollection}
          style={style as any}
          onEachFeature={exportMode ? undefined : onEachFeature}
        />
        {!exportMode && <HoverInfo />}
        {showLabels && view === 'state' && (
          <MapLabels 
            data={diseaseData}
            metric={metric}
          />
        )}
      </MapContainer>

      {/* Only show internal legend and top 5 if not in export mode or no external containers exist */}
      {showLegend && (!exportMode || !document.getElementById('legend-container')) && (
        <div className="absolute bottom-2 left-2 z-[400] bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm hidden sm:block">
          <div className="text-xs font-mono space-y-1">
            <div className="mb-2 font-semibold">
              {metric === 'cases' ? 'Cases' : 'Deaths'}
            </div>
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
      )}

      {exportMode && showTop5 && topRegions.length > 0 && (!exportMode || !document.getElementById('top-5-container')) && (
        <div className="absolute bottom-2 right-2 z-[400] bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm hidden sm:block max-w-[280px]">
          <div className="text-xs font-mono">
            <div className="mb-2 font-semibold">
              Top 5 {view === 'state' ? 'States' : 'Districts'} 
            </div>
            <div className="space-y-1">
              {topRegions.map((region, index) => (
                <div key={region.name} className="flex items-center justify-between gap-2">
                  <span>{index + 1}. {region.name}</span>
                  <span className="font-semibold">{region.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
