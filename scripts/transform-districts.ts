import fs from 'fs';
import path from 'path';

// Define types for the GeoJSON structures
interface Geometry {
  type: string;
  coordinates: any[];
}

interface FeatureProperties {
  s_name?: string;
  d_name?: string;
  [key: string]: any;
}

interface Feature {
  type: string;
  properties: FeatureProperties;
  geometry: Geometry;
}

interface FeatureCollection {
  type: string;
  features: Feature[];
  [key: string]: any;
}

interface TransformedFeature {
  type: string;
  properties: {
    Country_Name: string;
    State_ID: number;
    State_Name: string;
    District_ID: number;
    District_Name: string;
  };
  geometry: Geometry;
}

interface TransformedFeatureCollection {
  type: string;
  name: string;
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: TransformedFeature[];
}

// Read the original districts.json file
const districtsPath = path.join(process.cwd(), 'libs', 'districts.json');
const districtsData = JSON.parse(fs.readFileSync(districtsPath, 'utf8'));

// Create the new structure
const transformedData: TransformedFeatureCollection = {
  "type": "FeatureCollection",
  "name": "simplified_districts",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  "features": []
};

// Map state names to IDs for consistency
const stateMap = new Map<string, number>();
let stateId = 1;

// Map district names to IDs for consistency
const districtMap = new Map<string, number>();
let districtId = 1;

// Process each feature from the original data
if (Array.isArray(districtsData)) {
  // If it's already an array of features
  districtsData.forEach((feature: Feature) => processFeature(feature));
} else if (districtsData.features) {
  // If it has a features array
  (districtsData as FeatureCollection).features.forEach((feature: Feature) => processFeature(feature));
} else {
  // If it's a single feature
  processFeature(districtsData as Feature);
}

function processFeature(feature: Feature): void {
  if (feature.type !== 'Feature') return;
  
  const properties = feature.properties;
  if (!properties) return;
  
  // Get state name and normalize it
  const stateName = properties.s_name || '';
  
  // Get or create state ID
  let currentStateId: number;
  if (stateMap.has(stateName)) {
    currentStateId = stateMap.get(stateName) || stateId++;
  } else {
    currentStateId = stateId++;
    stateMap.set(stateName, currentStateId);
  }
  
  // Get district name and normalize it
  const districtName = properties.d_name || '';
  
  // Get or create district ID
  let currentDistrictId: number;
  const districtKey = `${stateName}-${districtName}`;
  if (districtMap.has(districtKey)) {
    currentDistrictId = districtMap.get(districtKey) || districtId++;
  } else {
    currentDistrictId = districtId++;
    districtMap.set(districtKey, currentDistrictId);
  }
  
  // Create transformed feature
  const transformedFeature: TransformedFeature = {
    "type": "Feature",
    "properties": {
      "Country_Name": "India",
      "State_ID": currentStateId,
      "State_Name": stateName,
      "District_ID": currentDistrictId,
      "District_Name": districtName
    },
    "geometry": feature.geometry
  };
  
  transformedData.features.push(transformedFeature);
}

// Write the transformed data to districts2.json
const outputPath = path.join(process.cwd(), 'libs', 'districts2.json');
fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));

console.log(`Transformation complete. Output saved to ${outputPath}`); 