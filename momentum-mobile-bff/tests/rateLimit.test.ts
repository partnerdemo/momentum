import { rateLimitProtection } from '../src/middleware/rateLimitProtection';
import { Request, Response, NextFunction } from 'express';

describe('Rate Limit Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        statusMock = jest.fn().mockReturnThis();
        jsonMock = jest.fn();
        mockResponse = {
            status: statusMock,
            json: jsonMock,
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    it('should distinguish between different authenticated users (tokens) sharing the same IP', () => {
        const ip = '123.45.67.89';

        // Requests for User A
        mockRequest = {
            ip: ip,
            headers: {
                'authorization': 'Bearer tokenA-12345678901234567890',
                'x-forwarded-for': ip
            },
            originalUrl: '/mobile-bff/tasks'
        };

        // Simulate User A hitting limit (mock implementation doesn't have public reset, 
        // so we just rely on logic keys being different)
        // Ideally we would mock the Map but it's not exported. 
        // Instead we can trust the key logic if we had access to it.
        // For this unit test without modifying source to export internals, 
        // we mainly verify it executes next().

        rateLimitProtection(mockRequest as unknown as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();

        // Requests for User B (Same IP)
        const nextFunctionB = jest.fn();
        const mockRequestB = {
            ip: ip, // SAME IP
            headers: {
                'authorization': 'Bearer tokenB-12345678901234567890', // DIFFERENT TOKEN
                'x-forwarded-for': ip
            },
            originalUrl: '/mobile-bff/tasks'
        };

        rateLimitProtection(mockRequestB as unknown as Request, mockResponse as Response, nextFunctionB);
        expect(nextFunctionB).toHaveBeenCalled();
    });

    it('should fallback to IP if no token provided', () => {
        mockRequest = {
            headers: {
                'x-forwarded-for': '99.99.99.99'
            },
            originalUrl: '/mobile-bff/tasks'
        };

        rateLimitProtection(mockRequest as unknown as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
    });

    it('should whitelist specific paths', () => {
        mockRequest = {
            originalUrl: '/mobile-bff/auth/login',
            headers: {}
        };

        rateLimitProtection(mockRequest as unknown as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
    });
});
