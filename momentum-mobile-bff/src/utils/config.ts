// src/utils/config.ts
import dotenv from 'dotenv';
dotenv.config();

let apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
    if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL ERROR: API_BASE_URL environment variable must be set in production!');
        process.exit(1);
    } else {
        console.warn('WARNING: API_BASE_URL is not set. Falling back to http://localhost:3001/api/v1 for development.');
        apiBaseUrl = 'http://localhost:3001/api/v1';
    }
}

// Safety check: Prevent infinite proxy loop if API_BASE_URL points to the BFF itself
if (apiBaseUrl.includes('momentum-mobile-bff.onrender.com')) {
    console.error('CRITICAL ERROR: API_BASE_URL points to the BFF itself.');
    process.exit(1);
}

export const API_BASE_URL = apiBaseUrl;
export const PORT = process.env.PORT || 3002;
