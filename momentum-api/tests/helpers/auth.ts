import request from 'supertest';
import type { Application } from 'express';

interface SignedUpUser {
  token: string;
  userId: string;
  householdId: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Create a fresh Parent + Household via /api/v1/auth/signup and return the
 * JWT token plus IDs. Default field values are randomized so multiple calls
 * within one test don't collide on the unique email index.
 */
export async function signUpParent(
  app: Application,
  overrides: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    householdName: string;
  }> = {}
): Promise<SignedUpUser> {
  const unique = Math.random().toString(36).slice(2, 10);
  const body = {
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'Parent',
    email: overrides.email ?? `parent-${unique}@example.test`,
    password: overrides.password ?? 'password12345',
    householdName: overrides.householdName,
  };

  const res = await request(app).post('/api/v1/auth/signup').send(body).expect(201);

  return {
    token: res.body.token,
    userId: res.body.data.parent._id,
    householdId: res.body.data.household._id,
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
  };
}

/**
 * Convenience wrapper to attach a Bearer header to a supertest request.
 */
export function withAuth(req: request.Test, token: string): request.Test {
  return req.set('Authorization', `Bearer ${token}`);
}
