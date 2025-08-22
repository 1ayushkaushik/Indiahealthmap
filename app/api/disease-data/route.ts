import { prisma, withPrisma } from '@/lib/api/db';
import { APIError, handleAPIError } from '@/lib/api/errors';
import { validateDateRange } from '@/lib/utils/date';
import { cache } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const diseaseName = searchParams.get('disease');
    const view = searchParams.get('view') || 'district';
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Validate inputs
    if (!diseaseName) {
      throw new APIError(400, 'Disease name is required');
    }

    if (!['district', 'state'].includes(view)) {
      throw new APIError(400, 'Invalid view type');
    }

    if (startDate && endDate) {
      validateDateRange(startDate, endDate);
    }

    // Create cache key
    const cacheKey = `disease-data:${diseaseName}:${view}:${startDate}:${endDate}`;
    
    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return Response.json(cachedData);
    }

    // If not in cache, fetch from database
    const data = await withPrisma(async (prisma) => {
      return prisma.diseaseData.findMany({
        where: {
          disease: {
            name: diseaseName
          },
          date: {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined
          }
        },
        select: {
          stateName: true,
          districtName: true,
          cases: true,
          deaths: true
        }
      });
    });

    // Aggregate data
    const aggregatedData = data.reduce((acc, record) => {
      const key = view === 'state' ? record.stateName : record.districtName;
      if (!acc[key]) {
        acc[key] = {
          cases: 0,
          deaths: 0
        };
      }
      acc[key].cases += record.cases;
      acc[key].deaths += record.deaths;
      return acc;
    }, {} as Record<string, { cases: number, deaths: number }>);

    // Cache the result
    await cache.set(cacheKey, aggregatedData, 60 * 60); // Cache for 1 hour

    return Response.json(aggregatedData);
  } catch (error) {
    return handleAPIError(error);
  }
} 