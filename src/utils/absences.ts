import type { StudentAbsence, TeacherAbsenceLesson, TimetableSlot } from '@/db/types';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function weekdayOfDate(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export type LessonSlot = Pick<TimetableSlot, 'classId' | 'day' | 'period' | 'subject' | 'teacherId'>;

export interface ClassLesson {
  period: number;
  subject: string;
  teacherId: string | null;
}

export function classLessonsForDay(slots: LessonSlot[], classId: string, day: number): ClassLesson[] {
  return slots
    .filter((slot) => slot.classId === classId && slot.day === day)
    .sort((a, b) => a.period - b.period)
    .map((slot) => ({ period: slot.period, subject: slot.subject, teacherId: slot.teacherId }));
}

export function teacherLessonsForDay(slots: LessonSlot[], teacherId: string, day: number): TeacherAbsenceLesson[] {
  return slots
    .filter((slot) => slot.teacherId === teacherId && slot.day === day)
    .sort((a, b) => a.period - b.period)
    .map((slot) => ({ period: slot.period, classId: slot.classId, subject: slot.subject }));
}

export function affectedClassIds(lessons: TeacherAbsenceLesson[]): string[] {
  return [...new Set(lessons.map((lesson) => lesson.classId))].sort();
}

export function teacherAbsenceHours(lessons: TeacherAbsenceLesson[]): number {
  return lessons.length;
}

export interface StudentAbsenceTotals {
  hours: number;
  justifiedHours: number;
  unjustifiedHours: number;
}

export function summarizeStudentAbsences(
  records: Pick<StudentAbsence, 'studentId' | 'justified' | 'date'>[],
  date?: string,
): Map<string, StudentAbsenceTotals> {
  const totals = new Map<string, StudentAbsenceTotals>();
  for (const record of records) {
    if (date !== undefined && record.date !== date) continue;
    const current = totals.get(record.studentId) ?? { hours: 0, justifiedHours: 0, unjustifiedHours: 0 };
    current.hours += 1;
    if (record.justified) current.justifiedHours += 1;
    else current.unjustifiedHours += 1;
    totals.set(record.studentId, current);
  }
  return totals;
}
