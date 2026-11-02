import type { TimetableSlot } from '@/db/types';

export interface TimetableConflict {
  kind: 'teacher' | 'room';
  day: number;
  period: number;
  resourceId: string;
  classIds: string[];
}

export function slotKey(day: number, period: number): string {
  return `${day}-${period}`;
}

export function findTimetableConflicts(slots: TimetableSlot[]): TimetableConflict[] {
  const groups = new Map<string, TimetableConflict>();
  for (const slot of slots) {
    const resources = [
      { kind: 'teacher' as const, resourceId: slot.teacherId },
      { kind: 'room' as const, resourceId: slot.roomId },
    ];
    for (const { kind, resourceId } of resources) {
      if (!resourceId) continue;
      const key = `${kind}|${slot.day}|${slot.period}|${resourceId}`;
      const group = groups.get(key) ?? { kind, day: slot.day, period: slot.period, resourceId, classIds: [] };
      if (!group.classIds.includes(slot.classId)) group.classIds.push(slot.classId);
      groups.set(key, group);
    }
  }
  return [...groups.values()].filter((group) => group.classIds.length > 1);
}
