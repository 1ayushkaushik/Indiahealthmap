export class APIError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): Response {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return Response.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if (error instanceof Error && error.name === 'PrismaClientInitializationError') {
    return Response.json(
      { error: 'Database connection error', details: error.message },
      { status: 500 }
    );
  }

  if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
    return Response.json(
      { error: 'Database query error', details: error.message },
      { status: 500 }
    );
  }

  // Handle other errors
  return Response.json(
    { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
    { status: 500 }
  );
} 