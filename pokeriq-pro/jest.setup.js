// Jest setup file
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8820/api';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-for-testing-only';
