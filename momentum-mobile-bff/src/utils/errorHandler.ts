import { Request, Response, NextFunction } from 'express';
import AppError from './AppError';
import logger from './logger';

export const globalErrorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    // 1. Handle AppError (Operational, trusted errors)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
    }

    // 2. Handle Generic/Unknown Errors
    logger.error('Unhandled error in BFF', { error: err });

    // In development, send the full error details
    if (process.env.NODE_ENV === 'development') {
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong on the BFF.',
            error: err,
            stack: (err as Error).stack,
        });
    }

    // In production, send a generic message
    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong on the BFF.',
    });
};
