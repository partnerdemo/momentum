import request from 'supertest';
import { app } from '../../src/server';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/db';
import { signUpParent, withAuth } from '../helpers/auth';

describe('Tasks — CRUD', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/v1/tasks (Parent only)', () => {
    it('creates a task assigned to the parent themselves', async () => {
      const { token, userId } = await signUpParent(app);

      const res = await withAuth(
        request(app).post('/api/v1/tasks').send({
          title: 'Take out the trash',
          description: 'Tuesday and Friday',
          pointsValue: 10,
          assignedTo: [userId],
        }),
        token
      ).expect(201);

      expect(res.body.data.task.title).toBe('Take out the trash');
      expect(res.body.data.task.pointsValue).toBe(10);
      expect(res.body.data.task.status).toBe('Pending');
      expect(res.body.data.task.assignedTo).toContain(userId);
    });

    it('rejects task missing title with 400', async () => {
      const { token, userId } = await signUpParent(app);

      await withAuth(
        request(app).post('/api/v1/tasks').send({
          pointsValue: 10,
          assignedTo: [userId],
        }),
        token
      ).expect(400);
    });

    it('rejects task with empty assignedTo with 400', async () => {
      const { token } = await signUpParent(app);

      await withAuth(
        request(app).post('/api/v1/tasks').send({
          title: 'Nobody assigned',
          pointsValue: 10,
          assignedTo: [],
        }),
        token
      ).expect(400);
    });

    it('rejects unauthenticated request with 401', async () => {
      await request(app)
        .post('/api/v1/tasks')
        .send({ title: 'x', pointsValue: 10, assignedTo: ['507f1f77bcf86cd799439011'] })
        .expect(401);
    });
  });

  describe('GET /api/v1/tasks', () => {
    it('returns tasks scoped to the authenticated household', async () => {
      const { token, userId } = await signUpParent(app);
      await withAuth(
        request(app).post('/api/v1/tasks').send({
          title: 'Task A',
          pointsValue: 5,
          assignedTo: [userId],
        }),
        token
      ).expect(201);
      await withAuth(
        request(app).post('/api/v1/tasks').send({
          title: 'Task B',
          pointsValue: 7,
          assignedTo: [userId],
        }),
        token
      ).expect(201);

      const res = await withAuth(request(app).get('/api/v1/tasks'), token).expect(200);

      expect(res.body.results).toBe(2);
      const titles = res.body.data.tasks.map((t: any) => t.title);
      expect(titles).toContain('Task A');
      expect(titles).toContain('Task B');
    });

    it("does not leak tasks from another household", async () => {
      const a = await signUpParent(app, { email: 'household-a@example.test' });
      const b = await signUpParent(app, { email: 'household-b@example.test' });

      await withAuth(
        request(app).post('/api/v1/tasks').send({
          title: 'A-only task',
          pointsValue: 5,
          assignedTo: [a.userId],
        }),
        a.token
      ).expect(201);

      const res = await withAuth(request(app).get('/api/v1/tasks'), b.token).expect(200);
      expect(res.body.results).toBe(0);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('returns a single task by id', async () => {
      const { token, userId } = await signUpParent(app);
      const created = await withAuth(
        request(app).post('/api/v1/tasks').send({
          title: 'Find me',
          pointsValue: 3,
          assignedTo: [userId],
        }),
        token
      );

      const taskId = created.body.data.task._id;
      const res = await withAuth(request(app).get(`/api/v1/tasks/${taskId}`), token).expect(200);
      expect(res.body.data.task.title).toBe('Find me');
    });

    it("returns 404 for a task in another household", async () => {
      const a = await signUpParent(app, { email: 'a@example.test' });
      const b = await signUpParent(app, { email: 'b@example.test' });

      const created = await withAuth(
        request(app).post('/api/v1/tasks').send({
          title: 'Owned by A',
          pointsValue: 1,
          assignedTo: [a.userId],
        }),
        a.token
      );
      const taskId = created.body.data.task._id;

      await withAuth(request(app).get(`/api/v1/tasks/${taskId}`), b.token).expect(404);
    });
  });

  describe('PATCH /api/v1/tasks/:id (Parent only)', () => {
    it('updates allowed fields and ignores status', async () => {
      const { token, userId } = await signUpParent(app);
      const created = await withAuth(
        request(app).post('/api/v1/tasks').send({
          title: 'Original',
          pointsValue: 5,
          assignedTo: [userId],
        }),
        token
      );
      const taskId = created.body.data.task._id;

      const res = await withAuth(
        request(app).patch(`/api/v1/tasks/${taskId}`).send({
          title: 'Renamed',
          pointsValue: 15,
          status: 'Completed', // should be IGNORED — status transitions go through /complete
        }),
        token
      ).expect(200);

      expect(res.body.data.task.title).toBe('Renamed');
      expect(res.body.data.task.pointsValue).toBe(15);
      expect(res.body.data.task.status).toBe('Pending');
    });
  });

  describe('DELETE /api/v1/tasks/:id (Parent only)', () => {
    it('deletes a task and subsequent GET returns 404', async () => {
      const { token, userId } = await signUpParent(app);
      const created = await withAuth(
        request(app).post('/api/v1/tasks').send({
          title: 'To delete',
          pointsValue: 5,
          assignedTo: [userId],
        }),
        token
      );
      const taskId = created.body.data.task._id;

      await withAuth(request(app).delete(`/api/v1/tasks/${taskId}`), token).expect(204);
      await withAuth(request(app).get(`/api/v1/tasks/${taskId}`), token).expect(404);
    });
  });
});
