import { PrismaClient } from '@prisma/client';
import { diseases } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // Create diseases
  for (const disease of diseases) {
    const createdDisease = await prisma.disease.create({
      data: {
        name: disease.name,
        totalCases: disease.totalCases,
        totalDeaths: disease.totalDeaths,
        data: {
          create: disease.data.map(d => ({
            stateName: d.stateName,
            districtName: d.districtName,
            date: new Date(d.date),
            cases: d.cases,
            deaths: d.deaths
          }))
        }
      }
    });
    console.log(`Created disease: ${createdDisease.name}`);
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 