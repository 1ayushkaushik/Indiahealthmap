import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import csvParser from 'csv-parser'

const prisma = new PrismaClient()

interface DiseaseRecord {
  'Name of State/UT': string
  'Name of District': string
  'Disease/ Illness': string
  'No. of Cases': string
  'No. of Deaths': string
  'Date of Start of Outbreak': string
  'week_number': string
}

async function importDiseaseData() {
  try {
    const diseaseDir = path.join(process.cwd(), 'public', 'data', 'disease')
    const files = fs.readdirSync(diseaseDir).filter(file => file.endsWith('.csv'))

    for (const file of files) {
      const diseaseName = path.basename(file, '.csv')
      console.log(`Processing ${diseaseName}...`)

      // Create or get disease
      const disease = await prisma.disease.upsert({
        where: { name: diseaseName },
        update: {},
        create: { name: diseaseName }
      })

      // Process CSV file
      const records: DiseaseRecord[] = []
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(path.join(diseaseDir, file))
          .pipe(csvParser())
          .on('data', (data: DiseaseRecord) => records.push(data))
          .on('end', () => resolve())
          .on('error', reject)
      })

      // Process records
      for (const record of records) {
        try {
          const date = record['Date of Start of Outbreak'] 
            ? new Date(record['Date of Start of Outbreak'].split('-').reverse().join('-'))
            : new Date()

          await prisma.diseaseData.upsert({
            where: {
              diseaseId_stateName_districtName_date: {
                diseaseId: disease.id,
                stateName: record['Name of State/UT'],
                districtName: record['Name of District'],
                date
              }
            },
            update: {
              cases: parseInt(record['No. of Cases']) || 0,
              deaths: parseInt(record['No. of Deaths']) || 0
            },
            create: {
              diseaseId: disease.id,
              stateName: record['Name of State/UT'],
              districtName: record['Name of District'],
              date,
              cases: parseInt(record['No. of Cases']) || 0,
              deaths: parseInt(record['No. of Deaths']) || 0
            }
          })

        } catch (error) {
          console.error(`Error processing record:`, record, error)
        }
      }
      console.log(`Completed processing ${diseaseName}`)
    }
  } catch (error) {
    console.error('Error importing disease data:', error)
    throw error
  }
}

importDiseaseData()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  }) 