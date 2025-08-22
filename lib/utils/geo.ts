import stateGeoJson from '@/lib/states.json'
import districtGeoJson from '@/lib/districts2.json'

// Define more flexible types for GeoJSON data
interface GeoJSONGeometry {
  type: string
  coordinates: any
}

interface GeoJSONProperties {
  [key: string]: any
}

interface GeoJSONFeature {
  type: string
  properties: GeoJSONProperties
  geometry: GeoJSONGeometry
}

interface GeoJSONData {
  type: string
  features: GeoJSONFeature[]
  [key: string]: any // Allow for additional properties like 'crs'
}

// Define the expected output feature types
interface StateGeoJSONFeature {
  type: string
  properties: {
    State_Name: string
    stateName: string
    [key: string]: any
  }
  geometry: GeoJSONGeometry
}

interface DistrictGeoJSONFeature {
  type: string
  properties: {
    State_Name: string
    District_Name: string
    stateName: string
    name: string
    [key: string]: any
  }
  geometry: GeoJSONGeometry
}

export function processGeoJSON(view: 'state' | 'district'): { type: string; features: (StateGeoJSONFeature | DistrictGeoJSONFeature)[] } {
  if (view === 'state') {
    return {
      type: "FeatureCollection",
      features: (stateGeoJson as unknown as GeoJSONData).features.map((feature) => {
        // Cast to any first to avoid type errors
        const rawFeature = feature as any
        
        return {
          type: "Feature",
          properties: {
            State_Name: rawFeature.properties.NAME_1 || '',
            stateName: rawFeature.properties.NAME_1 || '',
          },
          geometry: rawFeature.geometry
        } as StateGeoJSONFeature
      })
    }
  } else {
    return districtGeoJson as unknown as { type: string; features: DistrictGeoJSONFeature[] }
  }
}

export const geoData = districtGeoJson

export function getStateFeature(stateName: string): StateGeoJSONFeature | undefined {
  const stateFeatures = processGeoJSON('state').features as StateGeoJSONFeature[];
  return stateFeatures.find(feature => feature.properties.stateName === stateName);
}

export function getDistrictFeature(stateName: string, districtName: string): DistrictGeoJSONFeature | undefined {
  const districtFeatures = processGeoJSON('district').features as DistrictGeoJSONFeature[];
  return districtFeatures.find(
    feature => feature.properties.stateName === stateName && feature.properties.name === districtName
  );
}