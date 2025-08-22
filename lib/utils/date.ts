import { APIError } from '@/lib/api/errors';

export function validateDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    throw new APIError(400, 'Invalid start date');
  }

  if (isNaN(end.getTime())) {
    throw new APIError(400, 'Invalid end date');
  }

  if (start > end) {
    throw new APIError(400, 'Start date must be before end date');
  }

  if (end > new Date()) {
    throw new APIError(400, 'End date cannot be in the future');
  }
} 