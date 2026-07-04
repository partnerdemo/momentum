// src/utils/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import AppError from './AppError';

// Global error handler middleware
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

  // 1.5 Handle JWT Errors
  if ((err as any).name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again.',
    });
  }

  if ((err as any).name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Your token has expired! Please log in again.',
    });
  }

  // 2. Handle Mongoose/MongoDB Errors (CastError, ValidationError, DuplicateKey)
  const error = err as any;

  if (error.name === 'CastError') {
    return res.status(400).json({
      status: 'fail',
      message: `Invalid ${error.path}: ${error.value}.`,
    });
  }

  if (error.code === 11000) {
    const field = error.keyValue ? Object.keys(error.keyValue)[0] : '';
    const val = error.keyValue ? error.keyValue[field] : '';
    return res.status(400).json({
      status: 'fail',
      message: `Duplicate field value: "${val}" for field: "${field}". Please use another value!`,
    });
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((el: any) => el.message);
    return res.status(400).json({
      status: 'fail',
      message: `Invalid input data: ${errors.join('. ')}`,
    });
  }

  // 3. Handle Generic/Unknown Errors
  console.error('ERROR (Unhandled):', err);

  // Helper to safely serialize circular error structures
  const safeSerialize = (obj: unknown): unknown => {
    const seen = new WeakSet();
    return JSON.parse(
      JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      })
    );
  };

  // In development, send the full error details safely
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong on the server.',
      error: safeSerialize(err),
      stack: (err as any).stack || new Error().stack,
    });
  }

  // In production, send a generic message
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server.',
  });
};