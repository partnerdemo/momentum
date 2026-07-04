// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler'; // Required for protect function
import { Types } from 'mongoose';
import FamilyMember, { IFamilyMember } from '../models/FamilyMember';
import Household from '../models/Household';
import AppError from '../utils/AppError';
import { JWT_SECRET } from '../config/constants'; // Import JWT_SECRET
import { setSentryUser } from '../config/sentry';

// Define the shape of the user payload stored in the JWT
interface JwtPayload extends jwt.JwtPayload {
  id: string;
  householdId: string; // The Household context ID
}

// CRITICAL FIX: Define the custom Request interface used in our controllers
// It extends Express's Request and adds the user document and household context
export interface AuthenticatedRequest extends Request {
  user?: IFamilyMember; // Adds the fetched user document to the request object
  householdId?: Types.ObjectId; // Adds the household context ID from the JWT
}

// Middleware function to protect routes
export const protect = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token;

    // 1. Get token and check if it exists
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401),
      );
    }

    // 2. Verification token
    const decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload;

    // 3. Check if user still exists
    // The decoded token ID is the FamilyMember ID
    const currentUser = await FamilyMember.findById(decoded.id);

    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token no longer exists.',
          401,
        ),
      );
    }

    // 4. Check if user changed password after the token was issued 
    if (currentUser.passwordChangedAt) {
      const passwordChangedTimestamp = currentUser.passwordChangedAt.getTime() / 1000;

      // JWT payload 'iat' (issued at) is in seconds
      if (passwordChangedTimestamp > (decoded.iat as number)) {
        return next(
          new AppError('User recently changed password! Please log in again.', 401)
        );
      }
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    // Attach the user document and household context to the request
    req.user = currentUser;
    req.householdId = new Types.ObjectId(decoded.householdId); // Attach household context

    // Tag the Sentry scope so any error captured during this request is
    // attributable to a specific user + household. No-op if SENTRY_DSN unset.
    setSentryUser(
      (currentUser._id as Types.ObjectId).toString(),
      decoded.householdId,
    );

    next();
  },
);

// Restrict routes to specific user roles
export const restrictTo = (...roles: Array<'Parent' | 'Child'>) => asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.householdId) {
    return next(new AppError('Role check failed: Missing user or household context from token.', 401));
  }

  const currentHousehold = await Household.findById(req.householdId);
  if (!currentHousehold) {
    return next(new AppError('Role check failed: The household associated with your token no longer exists.', 401));
  }

  const userHouseholdProfile = currentHousehold.memberProfiles.find(
    (member) => member.familyMemberId.equals(req.user!._id as Types.ObjectId)
  );

  if (!userHouseholdProfile || !roles.includes(userHouseholdProfile.role)) {
    return next(new AppError('You do not have permission to perform this action in this household.', 403));
  }

  next();
});