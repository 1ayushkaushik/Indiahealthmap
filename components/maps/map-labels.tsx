import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

interface LabelConfig {
  name: string;
  displayName: string;
  lat: number;
  long: number;
  labelSize?: number;
  valueSize?: number;
  color?: string;
  value?: number;
}

// Default label positions for states with shorter display names
export const STATE_LABELS: LabelConfig[] = [
  { name: "Ladakh", displayName: "Ladakh", lat: 34.1526, long: 77.5770, labelSize: 12, valueSize: 10 },
  { name: "Jammu and Kashmir", displayName: "J&K", lat: 33.5782, long: 74.7762, labelSize: 12, valueSize: 10 },
  { name: "Himachal Pradesh", displayName: "Himachal", lat: 31.6568, long: 77.449, labelSize: 9, valueSize: 10 },
  { name: "Punjab", displayName: "Punjab", lat: 30.5471, long: 75.5612, labelSize: 9.5, valueSize: 11 },
  { name: "Uttarakhand", displayName: "Uttarakhand", lat: 29.8668, long: 79.2193, labelSize: 7, valueSize: 11 },
  { name: "Haryana", displayName: "Haryana", lat: 29.188, long: 76.2056, labelSize: 7.5, valueSize: 11 },
  { name: "Delhi", displayName: "Delhi", lat: 28.7041, long: 78.1025, labelSize: 9, valueSize: 10 },
  { name: "Rajasthan", displayName: "Rajasthan", lat: 26.5238, long: 73.7179, labelSize: 16, valueSize: 12 },
  { name: "Uttar Pradesh", displayName: "Uttar Pradesh", lat: 26.4467, long: 81.1462, labelSize: 11, valueSize: 14 },
  { name: "Bihar", displayName: "Bihar", lat: 25.6961, long: 85.8131, labelSize: 12, valueSize: 13 },
  { name: "Sikkim", displayName: "Sikkim", lat: 28.8330, long: 88.5122, labelSize: 12, valueSize: 10 },
  { name: "Arunachal Pradesh", displayName: "Arunachal", lat: 28.1480, long: 94.5278, labelSize: 8, valueSize: 9 },
  { name: "Nagaland", displayName: "Nagaland", lat: 25.6584, long: 96.6624, labelSize: 9, valueSize: 10 },
  { name: "Manipur", displayName: "Manipur", lat: 24.0637, long: 95.763, labelSize: 9, valueSize: 10 },
  { name: "Mizoram", displayName: "Mizoram", lat: 21.345, long: 92.9376, labelSize: 9, valueSize: 10 },
  { name: "Tripura", displayName: "Tripura", lat: 22.3408, long: 91.2882, labelSize: 9, valueSize: 10 },
  { name: "Meghalaya", displayName: "Meghalaya", lat: 24.4670, long: 90.8662, labelSize: 9, valueSize: 10 },
  { name: "Assam", displayName: "Assam", lat: 26.2506, long: 92.9376, labelSize: 9, valueSize: 11 },
  { name: "West Bengal", displayName: "Bengal", lat: 22.9868, long: 87.6550, labelSize: 9, valueSize: 11 },
  { name: "Jharkhand", displayName: "Jharkhand", lat: 23.6102, long: 85.2799, labelSize: 9, valueSize: 11 },
  { name: "Odisha", displayName: "Odisha", lat: 20.9517, long: 85.0985, labelSize: 9, valueSize: 11 },
  { name: "Chhattisgarh", displayName: "Chhattisgarh", lat: 21.4787, long: 82.131, labelSize: 7, valueSize: 11 },
  { name: "Madhya Pradesh", displayName: "Madhya Pradesh", lat: 22.9734, long: 78.6569, labelSize: 12, valueSize: 12 },
  { name: "Gujarat", displayName: "Gujarat", lat: 23.2587, long: 71.6924, labelSize: 12, valueSize: 11 },
  { name: "Maharashtra", displayName: "Maharashtra", lat: 19.4515, long: 75.7139, labelSize: 12, valueSize: 12 },
  { name: "Telangana", displayName: "Telangana", lat: 17.6231, long: 79.188, labelSize: 10, valueSize: 11 },
  { name: "Andhra Pradesh", displayName: "Andhra", lat: 14.9129, long: 78.7400, labelSize: 12, valueSize: 11 },
  { name: "Karnataka", displayName: "Karnataka", lat: 14.9173, long: 75.6569, labelSize: 9, valueSize: 11 },
  { name: "Goa", displayName: "Goa", lat: 15.2993, long: 72.9240, labelSize: 12, valueSize: 10 },
  { name: "Kerala", displayName: "Kerala", lat: 9.5505, long: 74.7711,  labelSize: 14, valueSize: 11 },
  { name: "Tamil Nadu", displayName: "Tamil Nadu", lat: 10.6271, long: 78.3569, labelSize: 9, valueSize: 11 },
];

interface MapLabelsProps {
  data: { [key: string]: { cases: number; deaths: number } };
  metric: 'cases' | 'deaths';
  labelConfigs?: LabelConfig[];
}

export default function MapLabels({ data, metric, labelConfigs = STATE_LABELS }: MapLabelsProps) {
  const map = useMap();
  const labelsRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Clear existing labels
    if (labelsRef.current) {
      labelsRef.current.clearLayers();
    } else {
      labelsRef.current = L.layerGroup().addTo(map);
    }

    // Function to update labels based on zoom
    function updateLabels() {
      if (!labelsRef.current) return;
      
      labelsRef.current.clearLayers();
      
      const currentZoom = map.getZoom();
      const baseZoom = 5; // The zoom level we're targeting for the base size
      const scaleFactor = Math.pow(2, currentZoom - baseZoom);

      // Add new labels
      labelConfigs.forEach(config => {
        const value = data[config.name]?.[metric] || 0;
        
        // Scale the font sizes based on zoom level
        const scaledLabelSize = (config.labelSize || 12) * scaleFactor;
        const scaledValueSize = (config.valueSize || 10) * scaleFactor;
        
        // Create label
        const label = L.divIcon({
          className: 'map-label',
          html: `
            <div class="label-container" style="
              color: ${config.color || '#000'};
              transform: translate(-50%, -50%);
            ">
              <div class="label-name" style="font-size: ${scaledLabelSize}px;">
                ${config.displayName}
              </div>
              <div class="label-value" style="font-size: ${scaledValueSize}px;">
                ${value.toLocaleString()}
              </div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        L.marker([config.lat, config.long], { 
          icon: label,
          interactive: false,
          zIndexOffset: 1000
        }).addTo(labelsRef.current!);
      });
    }

    // Initial update
    updateLabels();

    // Update on zoom
    map.on('zoomend', updateLabels);

    return () => {
      map.off('zoomend', updateLabels);
      if (labelsRef.current) {
        labelsRef.current.clearLayers();
      }
    };
  }, [map, data, metric, labelConfigs]);

  return (
    <style jsx global>{`
      .map-label {
        background: none;
        border: none;
        width: auto !important;
        height: auto !important;
      }
      .label-container {
        position: relative;
        text-align: center;
        pointer-events: none;
        white-space: nowrap;
        display: inline-block;
      }
      .label-name {
        font-weight: 600;
        line-height: 1.2;
      }
      .label-value {
        font-weight: 500;
        line-height: 1.2;
        opacity: 0.9;
      }
    `}</style>
  );
} 