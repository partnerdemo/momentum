import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer: MongoMemoryServer | null = null;

/**
 * Spin up an in-memory MongoDB and connect mongoose to it.
 * Call from `beforeAll` in each integration test file.
 */
export async function connectTestDb(): Promise<void> {
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  await mongoose.connect(uri);
}

/**
 * Tear down the in-memory MongoDB. Call from `afterAll`.
 */
export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

/**
 * Delete all documents from every collection. Call from `afterEach`
 * so tests don't bleed state into each other.
 */
export async function clearTestDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}
