import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  custom?: (value: any) => { valid: boolean; message?: string } | boolean;
  message?: string;
}

export interface ValidationSchema {
  body?: Record<string, ValidationRule>;
  query?: Record<string, ValidationRule>;
  params?: Record<string, ValidationRule>;
}

/**
 * Creates an Express middleware that validates the incoming request body, query, or params
 * against a lightweight, customizable validation schema.
 */
export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const locations: ('body' | 'query' | 'params')[] = ['body', 'query', 'params'];

    for (const loc of locations) {
      const rules = schema[loc];
      if (!rules) continue;

      const data = req[loc] || {};

      for (const [key, rule] of Object.entries(rules)) {
        const val = data[key];

        // 1. Check required fields
        if (rule.required && (val === undefined || val === null || val === '')) {
          return next(new AppError(rule.message || `${key} is required in request ${loc}`, 400));
        }

        if (val !== undefined && val !== null) {
          // 2. Check types
          if (rule.type) {
            let typeMatched = false;
            if (rule.type === 'array') {
              typeMatched = Array.isArray(val);
            } else {
              typeMatched = typeof val === rule.type;
            }

            if (!typeMatched) {
              return next(new AppError(rule.message || `${key} in ${loc} must be of type ${rule.type}`, 400));
            }
          }

          // 3. Run custom validation logic
          if (rule.custom) {
            const resVal = rule.custom(val);
            if (typeof resVal === 'object') {
              if (!resVal.valid) {
                return next(new AppError(resVal.message || `Invalid value for ${key} in ${loc}`, 400));
              }
            } else if (!resVal) {
              return next(new AppError(rule.message || `Invalid value for ${key} in ${loc}`, 400));
            }
          }
        }
      }
    }

    next();
  };
};
