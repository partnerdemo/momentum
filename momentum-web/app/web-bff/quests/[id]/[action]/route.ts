import { createProxyHandler } from '@/lib/bffProxy';

export const { GET, POST, PUT, PATCH, DELETE } = createProxyHandler();
