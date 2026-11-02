import type { TimetableSlot } from '@/db/types';
import { slotKey } from '@/utils/timetableConflicts';

export interface SlotAvailability {
  occupiedRoomIds: string[];
  freeRoomIds: string[];
}

export function buildRoomAvailability(
  slots: TimetableSlot[],
  roomIds: string[],
  days: number[],
  periods: number[],
): Map<string, SlotAvailability> {
  const roomSet = new Set(roomIds);
  const result = new Map<string, SlotAvailability>();
  for (const day of days) {
    for (const period of periods) {
      const occupied = new Set<string>();
      for (const slot of slots) {
        if (slot.day === day && slot.period === period && slot.roomId && roomSet.has(slot.roomId)) {
          occupied.add(slot.roomId);
        }
      }
      result.set(slotKey(day, period), {
        occupiedRoomIds: [...occupied],
        freeRoomIds: roomIds.filter((id) => !occupied.has(id)),
      });
    }
  }
  return result;
}
