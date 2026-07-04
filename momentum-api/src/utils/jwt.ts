import jwt, { SignOptions } from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/constants';

/**
 * Signs a JWT token containing user ID and household ID.
 */
export const signToken = (id: string, householdId: string): string => {
  const payload = { id, householdId };
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};
