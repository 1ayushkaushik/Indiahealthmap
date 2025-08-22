import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Initialize Prisma client
const prisma = new PrismaClient();

// Define types for the GeoJSON structures
interface DistrictProperties {
  Country_Name: string;
  State_ID: number;
  State_Name: string;
  District_ID: number;
  District_Name: string;
}

interface DistrictFeature {
  type: string;
  properties: DistrictProperties;
  geometry: any;
}

interface DistrictCollection {
  type: string;
  name: string;
  features: DistrictFeature[];
  [key: string]: any;
}

// List of diseases to use for random data
const diseases = [
  'Malaria', 'Dengue', 'Tuberculosis', 'Cholera', 'Typhoid',
  'Hepatitis', 'Influenza', 'COVID-19', 'Chikungunya', 'Measles'
];

// Function to generate a random date between 2012 and 2025
// with higher probability for recent dates
function getRandomDate(): Date {
  // Current year
  const currentYear = new Date().getFullYear();
  
  // Generate random year between 2012 and current year+1 (up to 2025)
  let year: number;
  
  // Bias towards more recent years (70% chance for last 3 years)
  const recentYearBias = Math.random();
  if (recentYearBias < 0.7) {
    // Recent years (last 3 years)
    const minRecentYear = Math.max(2012, currentYear - 3);
    year = Math.floor(Math.random() * (currentYear + 1 - minRecentYear)) + minRecentYear;
  } else {
    // Any year between 2012 and current year
    year = Math.floor(Math.random() * (currentYear + 1 - 2012)) + 2012;
  }
  
  // Cap at 2025
  year = Math.min(year, 2025);
  
  // Random month and day
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1; // Avoid invalid dates
  
  return new Date(year, month, day);
}

// Function to generate random number of cases (higher for recent dates)
function getRandomCases(date: Date): number {
  const currentYear = new Date().getFullYear();
  const yearDiff = currentYear - date.getFullYear();
  
  // Base range for number of cases
  let minCases = 5;
  let maxCases = 500;
  
  // Adjust based on recency
  if (yearDiff <= 2) {
    // More recent years have potentially higher case counts
    maxCases = 1000;
  } else if (yearDiff >= 8) {
    // Older years have potentially lower case counts
    maxCases = 300;
  }
  
  return Math.floor(Math.random() * (maxCases - minCases)) + minCases;
}

// Function to generate random number of deaths (based on cases)
function getRandomDeaths(cases: number): number {
  // Mortality rate between 0.5% and 5%
  const mortalityRate = 0.005 + (Math.random() * 0.045);
  return Math.floor(cases * mortalityRate);
}

async function main() {
  try {
    // Read the district data
    const districtsPath = path.join(process.cwd(), 'libs', 'districts2.json');
    const districtsData: DistrictCollection = JSON.parse(fs.readFileSync(districtsPath, 'utf8'));
    
    console.log(`Loaded ${districtsData.features.length} districts`);
    
    // First, ensure all diseases exist in the database
    for (const diseaseName of diseases) {
      await prisma.disease.upsert({
        where: { name: diseaseName },
        update: {},
        create: { name: diseaseName }
      });
    }
    
    console.log('Diseases added to database');
    
    // Get all diseases from DB to use their IDs
    const dbDiseases = await prisma.disease.findMany();
    
    // Create a map of disease names to IDs
    const diseaseMap = new Map(dbDiseases.map(d => [d.name, d.id]));
    
    // Process each district
    let recordsCreated = 0;
    
    for (const feature of districtsData.features) {
      const { State_Name, District_Name } = feature.properties;
      
      // Skip if state or district name is empty
      if (!State_Name || !District_Name) continue;
      
      // Generate random disease occurrences for this district
      const numDiseaseOccurrences = Math.floor(Math.random() * 15) + 5; // 5-20 occurrences per district
      
      for (let i = 0; i < numDiseaseOccurrences; i++) {
        // Pick a random disease
        const randomDiseaseIndex = Math.floor(Math.random() * diseases.length);
        const diseaseName = diseases[randomDiseaseIndex];
        const diseaseId = diseaseMap.get(diseaseName)!;
        
        // Generate random date and cases
        const occurrenceDate = getRandomDate();
        const cases = getRandomCases(occurrenceDate);
        const deaths = getRandomDeaths(cases);
        
        // Create the disease data record
        try {
          await prisma.diseaseData.create({
            data: {
              diseaseId,
              stateName: State_Name,
              districtName: District_Name,
              date: occurrenceDate,
              cases,
              deaths
            }
          });
          
          recordsCreated++;
          if (recordsCreated % 100 === 0) {
            console.log(`Created ${recordsCreated} disease data records...`);
          }
        } catch (error) {
          // Skip duplicate entries (same disease, state, district, date)
          console.log(`Skipping duplicate entry: ${diseaseName}, ${State_Name}, ${District_Name}, ${occurrenceDate.toISOString()}`);
        }
      }
    }
    
    console.log(`Successfully created ${recordsCreated} disease data records`);
    
    // Update disease totals
    console.log('Updating disease totals...');
    const allDiseases = await prisma.disease.findMany();
    
    for (const disease of allDiseases) {
      const totals = await prisma.diseaseData.aggregate({
        where: { diseaseId: disease.id },
        _sum: {
          cases: true,
          deaths: true
        }
      });
      
      await prisma.disease.update({
        where: { id: disease.id },
        data: {
          totalCases: totals._sum.cases || 0,
          totalDeaths: totals._sum.deaths || 0
        }
      });
    }
    
    console.log('Disease totals updated');
    
  } catch (error) {
    console.error('Error generating random data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Data generation complete'))
  .catch(e => {
    console.error('Error in data generation script:', e);
    process.exit(1);
  }); 