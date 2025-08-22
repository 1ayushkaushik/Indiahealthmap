import { prisma, withPrisma } from '@/lib/api/db'
import { APIError, handleAPIError } from '@/lib/api/errors'
import { validateDateRange } from '@/lib/utils/date'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const diseaseName = searchParams.get('disease')
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const stateName = searchParams.get('stateName')
    const districtName = searchParams.get('districtName')

    if (!diseaseName) {
      throw new APIError(400, 'Disease name is required')
    }

    if (startDate && endDate) {
      validateDateRange(startDate, endDate)
    }

    const data = await withPrisma(async (prisma) => {
      const where: any = {
        disease: {
          name: diseaseName
        },
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined
        }
      }

      if (stateName) where.stateName = stateName
      if (districtName) where.districtName = districtName

      return prisma.diseaseData.findMany({
        where,
        select: {
          date: true,
          cases: true,
          deaths: true
        },
        orderBy: {
          date: 'asc'
        }
      })
    })

    if (!Array.isArray(data)) {
      throw new APIError(500, 'Invalid data format from database')
    }

    // Log raw data for debugging
    // console.log('Raw data from database:', data)

    // Aggregate by date and convert to array format
    const aggregatedMap = data.reduce((acc, record) => {
      try {
        // Ensure we have a valid date
        if (!record.date) {
          console.error('Missing date in record:', record)
          return acc
        }

        const date = new Date(record.date).toISOString().split('T')[0] // YYYY-MM-DD format
        if (!acc[date]) {
          acc[date] = { 
            date,
            cases: 0,
            deaths: 0
          }
        }
        acc[date].cases += Math.max(0, record.cases || 0)
        acc[date].deaths += Math.max(0, record.deaths || 0)
        return acc
      } catch (error) {
        console.error('Error processing record:', record, error)
        return acc
      }
    }, {} as Record<string, { 
      date: string, 
      cases: number, 
      deaths: number
    }>)

    // Convert to array and sort by date
    const trendsArray = Object.values(aggregatedMap)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Log processed data for debugging
    // console.log('Processed trends data:', trendsArray)

    return Response.json(trendsArray)
  } catch (error) {
    console.error('Error in disease-trends route:', error)
    return handleAPIError(error)
  }
} 