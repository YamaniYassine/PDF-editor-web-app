const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

export const API_BASE_URL = configuredApiUrl || 'http://localhost:8000';
