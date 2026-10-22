import { db, isSqlConfigured } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  if (!isSqlConfigured()) {
    return {
      uid,
      email,
      name: name || '',
      role: 'admin',
    };
  }

  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || '',
        role: 'admin',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          name: name || '',
        },
      })
      .returning();

    return result[0];
  } catch (error: any) {
    console.warn('Could not sync user to SQL DB (fallback):', error?.message || error);
    return {
      uid,
      email,
      name: name || '',
      role: 'admin',
    };
  }
}

