// Quick test script to verify API configuration
import { API_BASE_URL } from './lib/config';

console.log('='.repeat(60));
console.log('Momentum Web App - API Configuration Test');
console.log('='.repeat(60));
console.log('\nAPI_BASE_URL:', API_BASE_URL);
console.log('\nExpected:', 'https://momentum-api-vpkw.onrender.com/api/v1');
console.log('\nConfiguration is', API_BASE_URL === 'https://momentum-api-vpkw.onrender.com/api/v1' ? '✅ CORRECT' : '⚠️  NEEDS REVIEW');
console.log('\n' + '='.repeat(60));
