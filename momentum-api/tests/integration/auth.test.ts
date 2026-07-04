import request from 'supertest';
import { app } from '../../src/server';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/db';
import { signUpParent, withAuth } from '../helpers/auth';
import FamilyMember from '../../src/models/FamilyMember';
import Household from '../../src/models/Household';

describe('Auth — signup, login, /me, JWT protection', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/v1/auth/signup', () => {
    it('creates a Parent and a placeholder Household, returns a JWT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          firstName: 'Alice',
          lastName: 'Doe',
          email: 'alice@example.test',
          password: 'password12345',
        })
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.data.parent.email).toBe('alice@example.test');
      expect(res.body.data.parent.role).toBe('Parent');
      expect(res.body.data.parent.password).toBeUndefined();
      expect(res.body.data.needsOnboarding).toBe(true);

      const household = res.body.data.household;
      expect(household.householdName).toBe("Alice's Household");
      expect(household.memberProfiles).toHaveLength(1);
      expect(household.memberProfiles[0].role).toBe('Parent');

      const dbUser = await FamilyMember.findOne({ email: 'alice@example.test' }).select('+password');
      expect(dbUser).not.toBeNull();
      expect(dbUser!.password).toBeDefined();
      expect(dbUser!.password).not.toBe('password12345');
    });

    it('rejects signup missing required fields with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'incomplete@example.test', password: 'password12345' })
        .expect(400);

      expect(res.body.message).toMatch(/missing mandatory fields/i);
    });

    it('rejects duplicate email with 409', async () => {
      await signUpParent(app, { email: 'dup@example.test' });

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          firstName: 'Other',
          lastName: 'Person',
          email: 'dup@example.test',
          password: 'password12345',
        })
        .expect(409);

      expect(res.body.message).toMatch(/already registered/i);
    });

    it('rejects invalid invite code with 404 and rolls back the user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          firstName: 'Joiner',
          lastName: 'Tester',
          email: 'joiner@example.test',
          password: 'password12345',
          inviteCode: 'NOTREALCODE',
        })
        .expect(404);

      expect(res.body.message).toMatch(/invalid invite code/i);
      const user = await FamilyMember.findOne({ email: 'joiner@example.test' });
      expect(user).toBeNull();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns a JWT for valid credentials', async () => {
      await signUpParent(app, { email: 'login@example.test', password: 'password12345' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'login@example.test', password: 'password12345' })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.data.parent.email).toBe('login@example.test');
      expect(res.body.data.primaryHouseholdId).toBeDefined();
    });

    it('rejects wrong password with 401', async () => {
      await signUpParent(app, { email: 'wrongpw@example.test', password: 'rightpassword12345' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'wrongpw@example.test', password: 'WRONG' })
        .expect(401);

      expect(res.body.message).toMatch(/incorrect email or password/i);
    });

    it('rejects unknown email with 401 (no user-enumeration leak)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.test', password: 'whatever12345' })
        .expect(401);

      expect(res.body.message).toMatch(/incorrect email or password/i);
    });

    it('rejects missing fields with 400', async () => {
      await request(app).post('/api/v1/auth/login').send({}).expect(400);
    });
  });

  describe('GET /api/v1/auth/me — JWT-protected', () => {
    it('returns the authenticated user with their household role', async () => {
      const { token, userId, householdId, email } = await signUpParent(app);

      const res = await withAuth(request(app).get('/api/v1/auth/me'), token).expect(200);

      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.user.role).toBe('Parent');
      expect(res.body.data.user._id).toBe(userId);
      expect(res.body.data.householdId.toString()).toBe(householdId.toString());
    });

    it('rejects missing Authorization header with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me').expect(401);
      expect(res.body.message).toMatch(/not logged in/i);
    });

    it('rejects malformed token with 401', async () => {
      const res = await withAuth(request(app).get('/api/v1/auth/me'), 'totally-not-a-jwt');
      expect(res.status).toBe(401);
    });

    it('rejects a token whose user has been deleted with 401', async () => {
      const { token, userId } = await signUpParent(app);
      await FamilyMember.findByIdAndDelete(userId);
      await Household.deleteMany({});

      const res = await withAuth(request(app).get('/api/v1/auth/me'), token);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/no longer exists/i);
    });
  });
});
