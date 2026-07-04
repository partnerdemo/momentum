// Server-side API URL (used in BFF routes)
export const API_BASE_URL = process.env.INTERNAL_API_URL || 'http://localhost:3001/api/v1';

// Client-side API URL (if needed)
export const CLIENT_API_URL = process.env.NEXT_PUBLIC_INTERNAL_API_URL || 'http://localhost:3001/api/v1';
