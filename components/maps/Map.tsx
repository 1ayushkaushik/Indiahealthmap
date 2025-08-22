"use client"

import { useEffect, useState, useMemo, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, GeoJSON, useMap } from 'react-leaflet'
import { processGeoJSON } from '@/lib/utils/geo'
import { Loading } from '@/components/shared/loading'
import L from 'leaflet'
import { COLOR_SCHEMES, type ColorScheme } from '@/lib/constants/color-schemes'

interface DiseaseData {
  [key: string]: {
    cases: number
    deaths: number
  }
}

interface MapProps {
  disease: string;
  metric: 'cases' | 'deaths';
  view: 'district' | 'state';
  colorScheme: ColorScheme;
  timeRange: { start: string; end: string };
  showLabels: boolean;
  onMapReady?: () => void;
  height?: number;
  exportMode?: boolean;
  comparisonMode?: boolean;
}

interface MapInstance extends L.Map {
  _thresholds?: number[];
  diseaseData?: DiseaseData;
}

interface FeatureProperties {
  State_Name: string;
  District_Name: string;
  stateName: string;
  name: string;
  value?: number;
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

      // Create label with value for export mode
      const labelHtml = `<div class="export-label">
          <div class="state-value">${value > 0 ? value : ''}</div>
          <div class="state-name">${value > 0 ? name : ''}</div>
        </div>`;

      const label = L.divIcon({
        className: 'state-label',
        html: labelHtml,
        iconSize: [100, 80],
        iconAnchor: [50, 40]
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

// Component to signal when map is ready
function MapReadySignal({ onMapReady }: { onMapReady: () => void }) {
  const map = useMap();
  
  useEffect(() => {
    // Wait for the map to be fully rendered
    setTimeout(() => {
      if (onMapReady) {
        onMapReady();
      }
    }, 2000);
  }, [map, onMapReady]);
  
  return null;
}

// Component to add export overlay with title and legend
function ExportOverlay({ 
  disease, 
  metric, 
  timeRange, 
  colorScheme,
  totalCount,
  view,
  comparisonMode
}: { 
  disease: string; 
  metric: 'cases' | 'deaths'; 
  timeRange: { start: string; end: string };
  colorScheme: string;
  totalCount: number;
  view: 'district' | 'state';
  comparisonMode?: boolean;
}) {
  const map = useMap() as MapInstance;
  const colors = COLOR_SCHEMES[colorScheme as keyof typeof COLOR_SCHEMES];
  
  useEffect(() => {
    // Skip adding controls in comparison mode
    if (comparisonMode) return;
    
    // Create title control
    const titleControl = new L.Control({ position: 'topright' });
    titleControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'map-export-title');
      
      // Format the time range for display
      let timeRangeText = '';
      if (timeRange.start && timeRange.end) {
        const startDate = new Date(timeRange.start).toLocaleDateString();
        const endDate = new Date(timeRange.end).toLocaleDateString();
        timeRangeText = `${startDate} to ${endDate}`;
      } else if (timeRange.start) {
        const startDate = new Date(timeRange.start).toLocaleDateString();
        timeRangeText = `since ${startDate}`;
      } else if (timeRange.end) {
        const endDate = new Date(timeRange.end).toLocaleDateString();
        timeRangeText = `until ${endDate}`;
      } else {
        timeRangeText = 'all time';
      }
      
      const metricText = metric === 'cases' ? 'Cases' : 'Deaths';
      const capitalizedDisease = disease.charAt(0).toUpperCase() + disease.slice(1);
      const viewLevel = view === 'state' ? 'state' : 'district';
      
      div.innerHTML = `
        <h1>What is the distribution of ${capitalizedDisease}?</h1>
        <h2>${metricText} by ${viewLevel} in ${timeRangeText}</h2>
      `;
      return div;
    };
    titleControl.addTo(map);
    
    // Create legend control
    const legendControl = new L.Control({ position: 'topright' });
    legendControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'map-export-legend');
      
      // Get thresholds from the map's parent component
      const thresholds = map._thresholds || [2000, 1000, 500, 200, 100, 50, 20, 0];
      
      div.innerHTML = `
        <div class="legend-items">
          ${thresholds.map((threshold: number, index: number) => `
            <div class="legend-item">
              <div class="legend-color" style="background-color: ${colors[index]}"></div>
              <div class="legend-label">
                ${index === 0 ? `≥ ${threshold}` :
                  index === thresholds.length - 1 ? `< ${thresholds[index - 1]}` :
                  `${threshold} - ${thresholds[index - 1]}`}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      return div;
    };
    legendControl.addTo(map);
    
    // Create total count control - position it at bottom right but higher up
    const totalCountControl = new L.Control({ position: 'bottomright' });
    totalCountControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'map-export-total');
      div.innerHTML = `
        <div class="total-count">${totalCount.toLocaleString()}</div>
        <div class="total-label">Total ${metric === 'cases' ? 'Cases' : 'Deaths'}</div>
      `;
      return div;
    };
    totalCountControl.addTo(map);
    
    // Create attribution control - position it at bottom right but lower
    const attributionControl = new L.Control({ position: 'bottomright' });
    attributionControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'map-export-attribution');
      div.innerHTML = '@disease_visualization_dashboard_kcdh_iitb';
      return div;
    };
    attributionControl.addTo(map);
    
    return () => {
      map.removeControl(titleControl);
      map.removeControl(legendControl);
      map.removeControl(totalCountControl);
      map.removeControl(attributionControl);
    };
  }, [map, disease, metric, timeRange, colorScheme, totalCount, colors, view, comparisonMode]);
  
  return null;
}

export default function Map({ 
  disease, 
  metric, 
  view, 
  colorScheme, 
  timeRange,
  showLabels,
  onMapReady,
  height = 700,
  exportMode = false,
  comparisonMode = false
}: MapProps) {
  const [diseaseData, setDiseaseData] = useState<DiseaseData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const processedGeoJSON = processGeoJSON(view)
  const mapRef = useRef<MapInstance | null>(null);

  const thresholds = useMemo(() => {
    return calculateLegendRanges(diseaseData, metric)
  }, [diseaseData, metric])

  useEffect(() => {
    setIsLoading(true)

    // Construct query parameters
    const params = new URLSearchParams({
      view,
      metric,
      disease,
      start: timeRange.start,
      end: timeRange.end
    })

    fetch(`/api/disease-data?${params}`)
      .then(res => res.json())
      .then(data => {
        setDiseaseData(data)
        
        // Calculate total count - FIX THE TYPE ERROR HERE
        const total = Object.values(data).reduce((sum: number, item: any) => {
          // Ensure item is properly typed and has the metric property
          const value = item && typeof item === 'object' && metric in item ? 
            (item[metric] as number) || 0 : 0;
          return sum + value;
        }, 0);
        
        setTotalCount(total);
        
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error fetching disease data:', error)
        setIsLoading(false)
      })
  }, [view, disease, timeRange, metric])

  // Store thresholds in the map instance for the legend to access
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current._thresholds = thresholds;
    }
  }, [thresholds, mapRef]);

  const getColor = (value: number) => {
    // Return white for 0 values
    if (value === 0) {
      return '#ffffff'; // White color for 0 values
    }
    
    const colors = COLOR_SCHEMES[colorScheme as keyof typeof COLOR_SCHEMES]
    for (let i = 0; i < thresholds.length; i++) {
      if (value >= thresholds[i]) return colors[i]
    }
    return colors[colors.length - 1]
  }

  const style = (feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProperties>) => {
    const name = view === 'state' ? feature.properties.stateName : feature.properties.name
    const value = diseaseData[name]?.[metric] || 0

    return {
      fillColor: getColor(value),
      weight: 1.5,
      opacity: 1,
      color: '#0f172a',
      fillOpacity: 0.8
    }
  }

  const onEachFeature = (feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProperties>, layer: L.Layer) => {
    const name = view === 'state' ? feature.properties.stateName : feature.properties.name
    const data = diseaseData[name] || { cases: 0, deaths: 0 }

    const popupContent = `
      <div class="text-sm">
        <p class="font-semibold">${name}</p>
        <p class="mt-1">${metric === 'cases' ? 'Cases' : 'Deaths'}: ${data[metric].toLocaleString()}</p>
      </div>
    `
    if ('bindPopup' in layer) {
      (layer as L.Layer & { bindPopup: (content: string) => void }).bindPopup(popupContent);
    }
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="relative h-full w-full overflow-hidden map-container" style={{ height }}>
      <style jsx global>{`
        .export-label .state-name {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          color: #000;
          text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff;
        }
        .export-label .state-value {
          font-size: 34px;
          font-weight: bold;
          text-align: center;
          color: #000;
          text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff;
        }
        .map-export-title {
          background-color: transparent;
          padding: 20px;
          margin: 20px;
          max-width: 600px;
        }
        .map-export-title h1 {
          font-size: 70px;
          font-weight: bold;
          margin: 0;
          padding: 0;
          color: #000;
        }
        .map-export-title h2 {
          font-size: 24px;
          margin: 10px 0 0 0;
          padding: 0;
          color: #333;
        }
        .map-export-legend {
          padding: 15px;
          margin: 20px;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
        }
        .legend-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .legend-color {
          width: 24px;
          height: 24px;
          border-radius: 4px;
        }
        .legend-label {
          font-size: 18px;
          font-weight: bold;
        }
        .map-export-total {
          background-color: transparent;
          padding: 20px;
          padding-bottom: 80px;
          line-height: 1;
          text-align: right;
        }
        .total-count {
          font-size: 100px;
          font-weight: bold;
          text-align: right;
          color: #ff6b00;
        }
        .total-label {
          font-size: 40px;
          font-weight: bold;
          color: #333;
        }
        .map-export-attribution {
          background-color: transparent;
          padding: 10px;
          margin: 10px;
          font-size: 20px;
          font-weight: bold;
          color: #333;
          position: absolute;
          bottom: 10px;
          right: 20px;
        }
        .leaflet-container {
          background: transparent !important;
        }
      `}</style>
      <MapContainer
        ref={mapRef as React.RefObject<L.Map>}
        style={{ height: '100%', width: '100%', background: 'transparent' }}
        zoomControl={false}
        attributionControl={false}
        center={[23.2937, 84.9629]}
        zoom={comparisonMode ? 4.2 : 6.2}
        maxZoom={comparisonMode ? 4.2 : 6.2}
        minZoom={comparisonMode ? 4.2 : 6.2}
        dragging={false}
        scrollWheelZoom={false}
        className="map-container"
      >
        <GeoJSON
          key={`${view}-${metric}-${colorScheme}`}
          data={processedGeoJSON as GeoJSON.FeatureCollection}
          style={style as any}
          onEachFeature={onEachFeature}
          bubblingMouseEvents={false}
        />
        {view === 'state' && showLabels && !comparisonMode && (
          <StateLabels data={diseaseData} metric={metric} />
        )}
        <ExportOverlay 
          disease={disease} 
          metric={metric} 
          timeRange={timeRange} 
          colorScheme={colorScheme}
          totalCount={totalCount}
          view={view}
          comparisonMode={comparisonMode}
        />
        {onMapReady && (
          <MapReadySignal onMapReady={onMapReady} />
        )}
      </MapContainer>
    </div>
  )
}
