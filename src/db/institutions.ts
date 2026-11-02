import { DomainError } from '@/utils/errors';
import { db } from './database';
import { touchFields } from './records';
import { assertHeadActor } from './users';
import type { Holiday, Institution } from './types';
import { generateInviteCode } from '@/utils/invite';

export const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4];

export async function getInstitution(institutionId: string): Promise<Institution> {
  const institution = await db.institutions.get(institutionId);
  if (!institution || institution.deletedAt !== null) {
    throw new DomainError('errors.notFound');
  }
  return institution;
}

export interface InstitutionSettingsInput {
  name: string;
  rooms: number;
  workingDays: number[];
  holidays: Holiday[];
}

export async function updateInstitutionSettings(
  institutionId: string,
  input: InstitutionSettingsInput,
  actorId: string,
): Promise<void> {
  await assertHeadActor(actorId);
  const institution = await getInstitution(institutionId);
  await db.institutions.put({
    ...institution,
    name: input.name.trim(),
    rooms: input.rooms,
    workingDays: [...input.workingDays].sort((a, b) => a - b),
    holidays: [...input.holidays].sort((a, b) => a.date.localeCompare(b.date)),
    ...touchFields(actorId),
  });
}

export async function renewInviteCode(institutionId: string, actorId: string): Promise<string> {
  await assertHeadActor(actorId);
  const institution = await getInstitution(institutionId);
  const inviteCode = generateInviteCode();
  await db.institutions.put({ ...institution, inviteCode, ...touchFields(actorId) });
  return inviteCode;
}
