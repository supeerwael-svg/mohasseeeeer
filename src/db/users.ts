import { DomainError } from '@/utils/errors';
import { db } from './database';
import { touchFields } from './records';
import { MODULE_IDS, type AccessLevel, type SupervisorPermissions, type User, type UserStatus } from './types';

export function toUsernameKey(value: string): string {
  return value.trim().toLowerCase();
}

export function defaultPermissions(): SupervisorPermissions {
  const modules = Object.fromEntries(MODULE_IDS.map((id) => [id, 'view' as AccessLevel])) as SupervisorPermissions['modules'];
  return { assignedClasses: [], searchScope: 'assigned', modules };
}

export async function assertUsernameAvailable(usernameKey: string): Promise<void> {
  const taken = await db.users
    .where('usernameKey')
    .equals(usernameKey)
    .filter((user) => user.deletedAt === null)
    .count();
  if (taken > 0) {
    throw new DomainError('auth.errors.usernameTaken');
  }
}

export async function getActiveUser(userId: string): Promise<User> {
  const user = await db.users.get(userId);
  if (!user || user.deletedAt !== null) {
    throw new DomainError('errors.notFound');
  }
  return user;
}

export async function assertHeadActor(actorId: string): Promise<void> {
  const actor = await getActiveUser(actorId);
  if (actor.role !== 'head') {
    throw new DomainError('errors.notAuthorized');
  }
}

export async function listSupervisors(institutionId: string): Promise<User[]> {
  const users = await db.users.where('institutionId').equals(institutionId).toArray();
  return users
    .filter((user) => user.role === 'supervisor' && user.deletedAt === null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getSupervisor(userId: string): Promise<User> {
  const user = await getActiveUser(userId);
  if (user.role !== 'supervisor') {
    throw new DomainError('errors.notFound');
  }
  return user;
}

export async function setSupervisorStatus(userId: string, status: UserStatus, actorId: string): Promise<void> {
  await assertHeadActor(actorId);
  const user = await getSupervisor(userId);
  await db.users.put({ ...user, status, ...touchFields(actorId) });
}

export async function updateSupervisorPermissions(
  userId: string,
  permissions: SupervisorPermissions,
  actorId: string,
): Promise<void> {
  await assertHeadActor(actorId);
  const user = await getSupervisor(userId);
  await db.users.put({ ...user, permissions, ...touchFields(actorId) });
}

export async function removeSupervisor(userId: string, actorId: string): Promise<void> {
  await assertHeadActor(actorId);
  const user = await getSupervisor(userId);
  const now = new Date().toISOString();
  await db.users.put({ ...user, deletedAt: now, ...touchFields(actorId) });
}
