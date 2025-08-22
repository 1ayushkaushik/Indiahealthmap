import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateTotals() {
  try {
    // Get all diseases
    const diseases = await prisma.disease.findMany()

    for (const disease of diseases) {
      console.log(`Updating totals for ${disease.name}...`)

      // Get all disease data for this disease
      const data = await prisma.diseaseData.findMany({
        where: {
          diseaseId: disease.id
        }
      })

      // Calculate totals
      const totals = data.reduce(
        (acc, record) => ({
          cases: acc.cases + record.cases,
          deaths: acc.deaths + record.deaths
        }),
        { cases: 0, deaths: 0 }
      )

      // Update disease with new totals
      await prisma.disease.update({
        where: {
          id: disease.id
        },
        data: {
          totalCases: totals.cases,
          totalDeaths: totals.deaths
        }
      })

      console.log(`Updated ${disease.name}: ${totals.cases} cases, ${totals.deaths} deaths`)
    }

    console.log('All totals updated successfully')
  } catch (error) {
    console.error('Error updating totals:', error)
    throw error
  }
}

updateTotals()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  }) 