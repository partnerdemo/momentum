// src/controllers/googleAuthController.ts
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import asyncHandler from 'express-async-handler';
import { google } from 'googleapis';
import FamilyMember from '../models/FamilyMember';
import Household, { IHouseholdMemberProfile } from '../models/Household';
import AppError from '../utils/AppError';
import { createNewCalendar } from '../services/googleCalendarService';
import { signToken } from '../utils/jwt';

interface CalendarTokens {
    accessToken: string;
    refreshToken?: string;
    expiryDate?: number;
    error?: boolean;
}

// Lazy load client to ensure env vars are loaded
const getOAuthClient = () => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables must be set');
    }
    return new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
};

/**
 * Shared helper to find or create a FamilyMember based on Google OAuth payload.
 */
const findOrCreateGoogleUser = async (
    googleId: string,
    email: string,
    firstName: string,
    lastName: string,
    calendarTokens: CalendarTokens | null
) => {
    let familyMember = await FamilyMember.findOne({
        $or: [{ googleId }, { email }]
    });

    let isNewUser = false;

    if (familyMember) {
        // Update googleId if not set (for users who signed up with email first)
        if (!familyMember.googleId) {
            familyMember.googleId = googleId;
        }

        // Update calendar tokens if we got new ones
        if (calendarTokens) {
            if (!familyMember.googleCalendar) {
                familyMember.googleCalendar = {
                    accessToken: '',
                    refreshToken: '',
                    expiryDate: 0,
                };
            }

            if (calendarTokens.error) {
                familyMember.googleCalendar.accessToken = '';
                familyMember.googleCalendar.refreshToken = '';
                familyMember.googleCalendar.expiryDate = 0;
            } else {
                familyMember.googleCalendar.accessToken = calendarTokens.accessToken;
                if (calendarTokens.refreshToken) {
                    familyMember.googleCalendar.refreshToken = calendarTokens.refreshToken;
                }
                if (calendarTokens.expiryDate) {
                    familyMember.googleCalendar.expiryDate = calendarTokens.expiryDate;
                }
            }
        }
        await familyMember.save();
    } else {
        isNewUser = true;

        const newMemberData: any = {
            firstName: firstName || 'User',
            lastName: lastName || '',
            email,
            googleId,
            onboardingCompleted: false,
        };

        if (calendarTokens && !calendarTokens.error) {
            newMemberData.googleCalendar = {
                accessToken: calendarTokens.accessToken,
                refreshToken: calendarTokens.refreshToken || '',
                expiryDate: calendarTokens.expiryDate || Date.now() + 3600000,
            };
        }

        familyMember = await FamilyMember.create(newMemberData);
    }

    return { familyMember, isNewUser };
};

/**
 * Shared helper to find or create a default household for a Parent user.
 */
const findOrCreateDefaultHousehold = async (
    familyMemberId: Types.ObjectId,
    displayName: string
) => {
    let household = await Household.findOne({
        'memberProfiles.familyMemberId': familyMemberId,
        'memberProfiles.role': 'Parent',
    });

    if (!household) {
        const creatorProfile: IHouseholdMemberProfile = {
            familyMemberId,
            displayName: displayName || 'User',
            profileColor: '#6366f1',
            role: 'Parent',
            pointsTotal: 0,
        };

        household = await Household.create({
            householdName: `${displayName || 'User'}'s Household`,
            memberProfiles: [creatorProfile],
        });
    }

    return household;
};

/**
 * Main Google Sign-In Auth handler for mobile/native clients.
 */
export const googleAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { idToken, serverAuthCode } = req.body;

    if (!idToken) {
        return next(new AppError('ID token is required', 400));
    }

    try {
        const client = getOAuthClient();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            return next(new AppError('Invalid Google token', 401));
        }

        const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload;
        if (!email || !googleId) {
            return next(new AppError('Invalid Google account data', 400));
        }

        let calendarTokens: CalendarTokens | null = null;
        if (serverAuthCode) {
            try {
                const exchangeClient = new OAuth2Client(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET,
                    ''
                );
                const { tokens } = await exchangeClient.getToken(serverAuthCode);
                if (tokens.access_token) {
                    calendarTokens = {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token || undefined,
                        expiryDate: tokens.expiry_date || Date.now() + 3600000,
                    };
                }
            } catch (tokenError: any) {
                calendarTokens = {
                    accessToken: '',
                    refreshToken: '',
                    expiryDate: 0,
                    error: true
                };
            }
        }

        const { familyMember, isNewUser } = await findOrCreateGoogleUser(
            googleId,
            email,
            firstName || 'User',
            lastName || '',
            calendarTokens
        );

        const household = (await findOrCreateDefaultHousehold(
            familyMember._id as Types.ObjectId,
            firstName || 'User'
        )) as any;

        // Recovery check: if user onboarding completed is true, but they needed default household creation, reset onboarding
        if (isNewUser) {
            familyMember.onboardingCompleted = false;
            await familyMember.save();
        }

        const token = signToken((familyMember._id as Types.ObjectId).toString(), household._id.toString());
        const userWithRole = {
            ...familyMember.toObject(),
            role: 'Parent',
        };

        res.status(isNewUser ? 201 : 200).json({
            status: 'success',
            token,
            data: {
                parent: userWithRole,
                primaryHouseholdId: household._id,
                isNewUser,
                needsOnboarding: isNewUser || !familyMember.onboardingCompleted,
            },
        });

    } catch (err: any) {
        return next(new AppError(`Google authentication failed: ${err.message}`, 500));
    }
});

/**
 * Main Google OAuth handler for web/external clients exchanging auth code.
 */
export const googleOAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { code, redirectUri } = req.body;

    if (!code) {
        return next(new AppError('Authorization code is required', 400));
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            redirectUri || 'http://localhost:3000/auth/google/callback'
        );

        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.access_token || !tokens.id_token) {
            return next(new AppError('Failed to get tokens from Google', 500));
        }

        oauth2Client.setCredentials(tokens);

        const client = getOAuthClient();
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            return next(new AppError('Invalid Google token', 401));
        }

        const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload;
        if (!email || !googleId) {
            return next(new AppError('Invalid Google account data', 400));
        }

        const calendarTokens: CalendarTokens = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || undefined,
            expiryDate: tokens.expiry_date || Date.now() + 3600000,
        };

        const { familyMember, isNewUser } = await findOrCreateGoogleUser(
            googleId,
            email,
            firstName || 'User',
            lastName || '',
            calendarTokens
        );

        const household = (await findOrCreateDefaultHousehold(
            familyMember._id as Types.ObjectId,
            firstName || 'User'
        )) as any;

        const token = signToken((familyMember._id as Types.ObjectId).toString(), household._id.toString());
        const userWithRole = {
            ...familyMember.toObject(),
            role: 'Parent',
        };

        res.status(isNewUser ? 201 : 200).json({
            status: 'success',
            token,
            data: {
                parent: userWithRole,
                primaryHouseholdId: household._id,
                isNewUser,
                needsOnboarding: isNewUser || !familyMember.onboardingCompleted,
            },
        });

    } catch (err: any) {
        return next(new AppError(`Google authentication failed: ${err.message}`, 500));
    }
});

/**
 * Handles completing the onboarding flow for a parent user.
 */
export const completeOnboarding = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const {
        userId,
        householdId,
        householdName,
        inviteCode,
        displayName,
        profileColor,
        familyColor,
        calendarChoice,
        selectedCalendarId,
        familyCalendarChoice,
        selectedFamilyCalendarId,
        pin
    } = req.body;

    if (!userId || !displayName || !profileColor || !pin) {
        return next(new AppError('Missing required fields', 400));
    }

    if (!householdId && !householdName) {
        return next(new AppError('Either householdId or householdName is required', 400));
    }

    if (!/^\d{4}$/.test(pin)) {
        return next(new AppError('PIN must be exactly 4 digits', 400));
    }

    try {
        const familyMember = await FamilyMember.findById(userId).select('+googleCalendar');
        if (!familyMember) {
            return next(new AppError('User not found', 404));
        }

        // Set PIN and mark onboarding completed cleanly
        familyMember.pin = pin;
        familyMember.pinSetupCompleted = true;
        familyMember.onboardingCompleted = true;
        await familyMember.save();

        let household: any;
        let actualHouseholdId = householdId;
        const currentContextHouseholdId = (req as any).householdId;

        if (inviteCode) {
            household = await Household.findOne({ inviteCode: inviteCode.toUpperCase() });
            if (!household) {
                return next(new AppError('Invalid invite code', 404));
            }

            const isMember = household.memberProfiles.some(
                (p: any) => p.familyMemberId.toString() === userId.toString()
            );

            if (!isMember) {
                const newProfile: IHouseholdMemberProfile = {
                    familyMemberId: userId,
                    displayName,
                    profileColor,
                    role: 'Parent',
                    pointsTotal: 0,
                };
                household.memberProfiles.push(newProfile);
                await household.save();

                // Clean up zombie placeholder household
                if (currentContextHouseholdId && currentContextHouseholdId.toString() !== household._id.toString()) {
                    try {
                        const oldHousehold = await Household.findById(currentContextHouseholdId);
                        if (oldHousehold && oldHousehold.memberProfiles.length <= 1) {
                            await Household.findByIdAndDelete(currentContextHouseholdId);
                        }
                    } catch (cleanupErr) {
                        console.error('[Onboarding] Failed to cleanup placeholder household:', cleanupErr);
                    }
                }
            } else {
                const memberProfile = household.memberProfiles.find(
                    (p: any) => p.familyMemberId.toString() === userId.toString()
                );
                if (memberProfile) {
                    memberProfile.displayName = displayName;
                    memberProfile.profileColor = profileColor;
                    await household.save();
                }
            }
            actualHouseholdId = household._id.toString();

        } else if (householdId) {
            household = await Household.findById(householdId);
            if (household) {
                if (householdName) household.householdName = householdName;
                if (familyColor) household.familyColor = familyColor;

                const memberProfile = household.memberProfiles.find(
                    (p: any) => p.familyMemberId.toString() === userId
                );

                if (memberProfile) {
                    memberProfile.displayName = displayName;
                    memberProfile.profileColor = profileColor;
                } else {
                    household.memberProfiles.push({
                        familyMemberId: userId,
                        displayName,
                        profileColor,
                        role: 'Parent',
                        pointsTotal: 0,
                    });
                }
                await household.save();
                actualHouseholdId = household._id.toString();
            }
        }

        if (!household) {
            const safeHouseholdName = householdName || `${displayName || 'Family'}'s Household`;
            const parentId = familyMember._id as Types.ObjectId;

            const creatorProfile: IHouseholdMemberProfile = {
                familyMemberId: parentId,
                displayName,
                profileColor,
                role: 'Parent',
                pointsTotal: 0,
            };

            household = await Household.create({
                householdName: safeHouseholdName,
                familyColor: familyColor || '#8B5CF6',
                memberProfiles: [creatorProfile],
            });

            actualHouseholdId = household._id.toString();

            // Clean up zombie placeholder household
            if (currentContextHouseholdId && currentContextHouseholdId.toString() !== actualHouseholdId) {
                try {
                    const oldHousehold = await Household.findById(currentContextHouseholdId);
                    if (oldHousehold && oldHousehold.memberProfiles.length <= 1) {
                        await Household.findByIdAndDelete(currentContextHouseholdId);
                    }
                } catch (cleanupErr) {
                    console.error('[Onboarding] Failed to cleanup placeholder household:', cleanupErr);
                }
            }
        }

        // Handle calendar creation/sync based on calendarChoice
        if (calendarChoice && familyMember.googleCalendar?.accessToken) {
            try {
                if (calendarChoice === 'create') {
                    const newCalendar = await createNewCalendar(
                        familyMember.googleCalendar.accessToken,
                        {
                            summary: 'Momentum Family Calendar',
                            description: 'Calendar for family tasks and events',
                        },
                        familyMember.googleCalendar.refreshToken
                    );

                    if (!familyMember.googleCalendar) {
                        familyMember.googleCalendar = {
                            accessToken: '',
                            refreshToken: '',
                            expiryDate: 0,
                        };
                    }
                    familyMember.googleCalendar.selectedCalendarId = newCalendar.calendarId;
                    await familyMember.save();

                } else if (calendarChoice === 'sync' && selectedCalendarId) {
                    if (!familyMember.googleCalendar) {
                        familyMember.googleCalendar = {
                            accessToken: '',
                            refreshToken: '',
                            expiryDate: 0,
                        };
                    }
                    familyMember.googleCalendar.selectedCalendarId = selectedCalendarId;
                    await familyMember.save();
                }
            } catch (calendarError: any) {
                console.error('Calendar setup error:', calendarError);
            }
        }

        // Handle FAMILY calendar creation/sync
        if (familyCalendarChoice && familyMember.googleCalendar?.accessToken && household) {
            try {
                const { accessToken, refreshToken } = familyMember.googleCalendar;

                if (familyCalendarChoice === 'create') {
                    const familyCalName = `${householdName || 'Family'} Calendar`;
                    const newFamilyCalendar = await createNewCalendar(
                        accessToken,
                        {
                            summary: familyCalName,
                            description: 'Shared family events and activities',
                        },
                        refreshToken
                    );

                    household.familyCalendarId = newFamilyCalendar.calendarId;
                    await household.save();

                } else if (familyCalendarChoice === 'sync' && selectedFamilyCalendarId) {
                    household.familyCalendarId = selectedFamilyCalendarId;
                    await household.save();
                }
            } catch (familyCalendarError: any) {
                console.error('Family calendar setup error:', familyCalendarError);
            }
        }

        const newToken = signToken(userId, actualHouseholdId);

        res.status(200).json({
            status: 'success',
            token: newToken,
            data: {
                user: familyMember,
                household,
            },
        });

    } catch (err: any) {
        return next(new AppError(`Failed to complete onboarding: ${err.message}`, 500));
    }
});
