import { PrismaClient } from '@prisma/client';
import districtsGeoJson from '@/lib/districts2.json';

const prisma = new PrismaClient();

interface MapDataParams {
  disease: string;
  metric: string;
  view: string;
  timeRange: { start: string; end: string };
}

export async function fetchMapData({ disease, metric, view, timeRange }: MapDataParams) {
  try {
    // Create a copy of the GeoJSON data
    const geoJsonData = JSON.parse(JSON.stringify(districtsGeoJson));
    
    // Prepare date range filter
    const dateFilter: { gte?: Date, lte?: Date } = {};
    if (timeRange.start) {
      dateFilter.gte = new Date(timeRange.start);
    }
    if (timeRange.end) {
      dateFilter.lte = new Date(timeRange.end);
    }
    
    // Find the disease ID first
    let diseaseId: number | undefined;
    if (disease) {
      const diseaseRecord = await prisma.disease.findFirst({
        where: { name: disease }
      });
      
      if (diseaseRecord) {
        diseaseId = diseaseRecord.id;
      }
    }
    
    // Fetch data from database
    const data = await prisma.diseaseData.groupBy({
      by: view === 'state' ? ['stateName'] : ['stateName', 'districtName'],
      _sum: {
        cases: true,
        deaths: true
      },
      where: {
        diseaseId: diseaseId, // Use the actual ID value instead of a filter object
        date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
      }
    });
    
    // Map the data to the GeoJSON features
    geoJsonData.features = geoJsonData.features.map((feature: any) => {
      const stateName = feature.properties.State_Name;
      const districtName = feature.properties.District_Name;
      
      let value = 0;
      
      if (view === 'state') {
        // Find state data
        const stateData = data.find(d => d.stateName === stateName);
        if (stateData) {
          value = metric === 'cases' ? stateData._sum.cases || 0 : stateData._sum.deaths || 0;
        }
      } else {
        // Find district data
        const districtData = data.find(d => 
          d.stateName === stateName && d.districtName === districtName
        );
        if (districtData) {
          value = metric === 'cases' ? districtData._sum.cases || 0 : districtData._sum.deaths || 0;
        }
      }
      
      // Add the value to the feature properties
      return {
        ...feature,
        properties: {
          ...feature.properties,
          value
        }
      };
    });
    
    return geoJsonData;
  } catch (error) {
    console.error('Error fetching map data:', error);
    // Return empty GeoJSON data in case of error
    return {
      ...districtsGeoJson,
      features: districtsGeoJson.features.map((feature: any) => ({
        ...feature,
        properties: {
          ...feature.properties,
          value: 0
        }
      }))
    };
  }
} 