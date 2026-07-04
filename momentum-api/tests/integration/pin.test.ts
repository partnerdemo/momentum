import request from 'supertest';
import { app } from '../../src/server';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/db';
import { signUpParent, withAuth } from '../helpers/auth';
import Household from '../../src/models/Household';

const VALID_PIN = '3729'; // not all same, not sequential
const ANOTHER_VALID_PIN = '5074';

async function getMemberProfileId(householdId: string, familyMemberId: string): Promise<string> {
  const household = await Household.findById(householdId);
  const profile = household!.memberProfiles.find(
    (p) => p.familyMemberId.toString() === familyMemberId
  );
  return profile!._id!.toString();
}

describe('PIN — setup, verify, change, status', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/v1/pin/setup-pin (auth required)', () => {
    it('sets a valid PIN and marks setup complete', async () => {
      const { token } = await signUpParent(app);

      const res = await withAuth(
        request(app).post('/api/v1/pin/setup-pin').send({ pin: VALID_PIN }),
        token
      ).expect(200);

      expect(res.body.data.pinSetupCompleted).toBe(true);
    });

    it('rejects PIN that is not 4 digits with 400', async () => {
      const { token } = await signUpParent(app);

      const res = await withAuth(
        request(app).post('/api/v1/pin/setup-pin').send({ pin: '123' }),
        token
      ).expect(400);

      expect(res.body.message).toMatch(/4 digits/i);
    });

    it('rejects all-same-digit PIN (e.g., 1111)', async () => {
      const { token } = await signUpParent(app);

      const res = await withAuth(
        request(app).post('/api/v1/pin/setup-pin').send({ pin: '1111' }),
        token
      ).expect(400);

      expect(res.body.message).toMatch(/same digit/i);
    });

    it('rejects ascending-sequential PIN (1234)', async () => {
      const { token } = await signUpParent(app);

      await withAuth(
        request(app).post('/api/v1/pin/setup-pin').send({ pin: '1234' }),
        token
      ).expect(400);
    });

    it('rejects descending-sequential PIN (4321)', async () => {
      const { token } = await signUpParent(app);

      await withAuth(
        request(app).post('/api/v1/pin/setup-pin').send({ pin: '4321' }),
        token
      ).expect(400);
    });

    it('rejects unauthenticated setup with 401', async () => {
      await request(app).post('/api/v1/pin/setup-pin').send({ pin: VALID_PIN }).expect(401);
    });
  });

  describe('POST /api/v1/pin/verify-pin (PUBLIC)', () => {
    it('verifies a correct PIN against a memberProfile and returns role + name', async () => {
      const { token, userId, householdId, firstName } = await signUpParent(app);
      await withAuth(
        request(app).post('/api/v1/pin/setup-pin').send({ pin: VALID_PIN }),
        token
      ).expect(200);

      const memberProfileId = await getMemberProfileId(householdId, userId);

      const res = await request(app)
        .post('/api/v1/pin/verify-pin')
        .send({ pin: VALID_PIN, memberId: memberProfileId, householdId })
        .expect(200);

      expect(res.body.data.verified).toBe(true);
      expect(res.body.data.role).toBe('Parent');
      expect(res.body.data.firstName).toBe(firstName); // displayName defaults to firstName
    });

    it('rejects wrong PIN with 401', async () => {
      const { token, userId, householdId } = await signUpParent(app);
      await withAuth(
        request(app).post('/api/v1/pin/setup-pin').send({ pin: VALID_PIN }),
        token
      ).expect(200);

      const memberProfileId = await getMemberProfileId(householdId, userId);

      await request(app)
        .post('/api/v1/pin/verify-pin')
        .send({ pin: '9999', memberId: memberProfileId, householdId })
        .expect(401);
    });

    it('rejects when PIN was never set up with 400', async () => {
      const { userId, householdId } = await signUpParent(app);
      const memberProfileId = await getMemberProfileId(householdId, userId);

      const res = await request(app)
        .post('/api/v1/pin/verify-pin')
        .send({ pin: VALID_PIN, memberId: memberProfileId, householdId })
        .expect(400);

      expect(res.body.requiresSetup).toBe(true);
    });

    it('rejects when householdId is missing with 400', async () => {
      await request(app)
        .post('/api/v1/pin/verify-pin')
        .send({ pin: VALID_PIN, memberId: 'abc' })
        .expect(400);
    });

    it('rejects when household does not exist with 404', async () => {
      await request(app)
        .post('/api/v1/pin/verify-pin')
        .send({
          pin: VALID_PIN,
          memberId: '507f1f77bcf86cd799439011',
          householdId: '507f1f77bcf86cd799439012',
        })
        .expect(404);
    });
  });

  describe('PUT /api/v1/pin/change-pin (auth required)', () => {
    it('changes PIN when oldPin is correct', async () => {
      const { token } = await signUpParent(app);
      await withAuth(
        request(app).post('/api/v1/pin/setup-pin').send({ pin: VALID_PIN }),
        token
      ).expect(200);

      await withAuth(
        request(app)
          .put('/api/v1/pin/change-pin')
          .send({ oldPin: VALID_PIN, newPin: ANOTHER_VALID_PIN }),
        token
      ).expect(200);
    });

    it('rejects when oldPin is wrong with 401', async () => {
      const { token } = await signUpParent(app);
      await withAuth(
        request(app).post('/api/v1/pin/setup-pin').send({ pin: VALID_PIN }),
        token
      ).expect(200);

      await withAuth(
        request(app)
          .put('/api/v1/pin/change-pin')
          .send({ oldPin: '9999', newPin: ANOTHER_VALID_PIN }),
        token
      ).expect(401);
    });

    it('rejects invalid newPin format with 400', async () => {
      const { token } = await signUpParent(app);
      await withAuth(
        request(app).post('/api/v1/pin/setup-pin').send({ pin: VALID_PIN }),
        token
      ).expect(200);

      await withAuth(
        request(app)
          .put('/api/v1/pin/change-pin')
          .send({ oldPin: VALID_PIN, newPin: '1111' }),
        token
      ).expect(400);
    });
  });

  describe('GET /api/v1/pin/pin-status (auth required)', () => {
    it('reports pinSetupCompleted=false initially, true after setup', async () => {
      const { token } = await signUpParent(app);

      const before = await withAuth(request(app).get('/api/v1/pin/pin-status'), token).expect(200);
      expect(before.body.data.pinSetupCompleted).toBe(false);

      await withAuth(
        request(app).post('/api/v1/pin/setup-pin').send({ pin: VALID_PIN }),
        token
      ).expect(200);

      const after = await withAuth(request(app).get('/api/v1/pin/pin-status'), token).expect(200);
      expect(after.body.data.pinSetupCompleted).toBe(true);
    });
  });
});
