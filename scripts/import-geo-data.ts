const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

interface ProcessedState {
  name: string
  geometry: any
}

interface ProcessedDistrict {
  name: string
  stateName: string
  geometry: any
}

interface ProcessedData {
  states: ProcessedState[]
  districts: ProcessedDistrict[]
}

async function importGeoData() {
  try {
    // Read processed data
    const filePath = path.join(__dirname, '..', 'prisma', 'processed_geo_data.json')
    const rawData = fs.readFileSync(filePath, 'utf-8')
    const data: ProcessedData = JSON.parse(rawData)

    // Import states
    for (const state of data.states) {
      await prisma.state.upsert({
        where: { name: state.name },
        update: {
          geometry: JSON.stringify(state.geometry)
        },
        create: {
          name: state.name,
          geometry: JSON.stringify(state.geometry)
        }
      })
      console.log(`Processed state: ${state.name}`)
    }

    // Import districts
    for (const district of data.districts) {
      const state = await prisma.state.findUnique({
        where: { name: district.stateName }
      })

      if (!state) {
        console.error(`State not found: ${district.stateName}`)
        continue
      }

      await prisma.district.upsert({
        where: {
          name_stateId: {
            name: district.name,
            stateId: state.id
          }
        },
        update: {
          geometry: JSON.stringify(district.geometry)
        },
        create: {
          name: district.name,
          stateId: state.id,
          geometry: JSON.stringify(district.geometry)
        }
      })
      console.log(`Processed district: ${district.name} (${district.stateName})`)
    }

    console.log('Data import completed successfully')
  } catch (error) {
    console.error('Error importing data:', error)
    throw error
  }
}

importGeoData()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })