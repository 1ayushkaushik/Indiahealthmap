import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }

    const client = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // Test the connection
    client.$connect().catch((error) => {
      console.error('Failed to connect to database:', error);
      throw error;
    });

    return client;
  } catch (error) {
    console.error('Error initializing Prisma client:', error);
    throw error;
  }
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

// Add indexes to schema.prisma
/*
model DiseaseData {
  id           Int      @id @default(autoincrement())
  disease      Disease  @relation(fields: [diseaseId], references: [id])
  diseaseId    Int
  stateName    String
  districtName String
  date         DateTime
  cases        Int      @default(0)
  deaths       Int      @default(0)

  @@index([diseaseId, date])
  @@index([stateName])
  @@index([districtName])
}
*/

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Add connection management helper
export async function withPrisma<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  try {
    return await fn(prisma);
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
} 