import { prisma, withPrisma } from '@/lib/api/db'
import { APIError, handleAPIError } from '@/lib/api/errors'

export async function GET() {
  try {
    const diseases = await withPrisma(async (prisma) => {
      return prisma.disease.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              data: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })
    })

    if (!Array.isArray(diseases)) {
      throw new APIError(500, 'Invalid data format: expected array of diseases')
    }

    const formattedDiseases = diseases.map(disease => ({
      id: disease.id,
      name: disease.name,
      totalCases: disease._count.data,
      totalDeaths: 0 // You might want to calculate this from actual data
    }))

    return Response.json(formattedDiseases)
  } catch (error) {
    console.error('Error in diseases route:', error)
    return handleAPIError(error)
  }
} 