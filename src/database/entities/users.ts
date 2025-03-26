import { eq } from 'drizzle-orm';
import users from '../schemas/user';
import db from '..';

export const getOrCreateUser = async (userId: string) => {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .execute();

  if (existingUser[0]) return existingUser[0];

  return db
    .insert(users)
    .values({ id: userId })
    .returning()
    .execute()
    .then((data) => data[0]);
};

export class UserEntity {
  constructor(public data: typeof users.$inferSelect) {}

  async setLastFmSessionKey(sessionKey: string) {
    await db
      .update(users)
      .set({ lastFmSessionKey: sessionKey })
      .where(eq(users.id, this.data.id))
      .execute();
  }

  async toggleScrobblePreference() {
    const currentValue = this.data.scrobbleAutomatically ?? true;
    await db
      .update(users)
      .set({ scrobbleAutomatically: !currentValue })
      .where(eq(users.id, this.data.id))
      .execute();

    return !currentValue;
  }
}
