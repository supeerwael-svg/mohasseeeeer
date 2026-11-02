import type { AbsenceWorkspace } from '@/db/absences';
import type { Student } from '@/db/types';
import {
  canteenReport,
  isEnrolledOn,
  isSchoolDay,
  monthlyAbsenceRates,
  monthlyMovements,
  schoolDaysInMonth,
  teacherDayAbsences,
  type MonthlyClassRate,
  type MonthlyTotals,
} from '@/utils/absenceReports';
import { classLessonsForDay, summarizeStudentAbsences, weekdayOfDate, type StudentAbsenceTotals } from '@/utils/absences';

export interface DailyStudentLine extends StudentAbsenceTotals {
  studentId: string;
  name: string;
}

export interface DailyClassSection {
  classId: string;
  className: string;
  students: DailyStudentLine[];
}

export interface DailyTeacherLine {
  teacherId: string;
  name: string;
  hours: number;
  subjects: string[];
  classNames: string[];
}

export interface DailyReport {
  date: string;
  schoolDay: boolean;
  classes: DailyClassSection[];
  canteen: {
    halfBoarderCount: number;
    expectedCount: number;
    absentHalfBoarders: { name: string; className: string }[];
  };
  teachers: DailyTeacherLine[] | null;
}

export interface MonthlyClassLine extends MonthlyClassRate {
  className: string;
}

export interface MovementLine {
  studentId: string;
  name: string;
  className: string;
  date: string;
}

export interface MonthlyReport {
  month: string;
  schoolDayCount: number;
  rows: MonthlyClassLine[];
  total: MonthlyTotals;
  joined: MovementLine[];
  left: MovementLine[];
}

function fullName(student: { firstName: string; lastName: string }): string {
  return `${student.firstName} ${student.lastName}`;
}

function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name);
}

export function buildDailyReport(data: AbsenceWorkspace, date: string): DailyReport {
  const holidays = new Set(data.holidayDates);
  const day = weekdayOfDate(date);
  const classNameById = new Map(data.classes.map((item) => [item.id, item.name]));
  const totals = summarizeStudentAbsences(data.studentAbsences, date);
  const lessonCountByClass = new Map(data.classes.map((item) => [item.id, classLessonsForDay(data.slots, item.id, day).length]));

  const classes: DailyClassSection[] = data.classes
    .map((schoolClass) => {
      const students: DailyStudentLine[] = [];
      for (const student of data.students) {
        if (student.classId !== schoolClass.id || !isEnrolledOn(student, date)) continue;
        const row = totals.get(student.id);
        if (row) students.push({ studentId: student.id, name: fullName(student), ...row });
      }
      return { classId: schoolClass.id, className: schoolClass.name, students: students.sort(byName) };
    })
    .filter((section) => section.students.length > 0);

  const canteen = canteenReport({ students: data.students, date, totalsByStudent: totals, lessonCountByClass });
  const absentIds = new Set(canteen.absentHalfBoarderIds);
  const absentHalfBoarders = data.students
    .filter((student) => absentIds.has(student.id))
    .map((student) => ({ name: fullName(student), className: classNameById.get(student.classId) ?? '' }))
    .sort(byName);

  const teachers = data.access.isHead
    ? teacherDayAbsences(data.teacherAbsences, date)
        .map((item) => {
          const teacher = data.teachers.find((candidate) => candidate.id === item.teacherId);
          return {
            teacherId: item.teacherId,
            name: teacher?.name ?? '',
            hours: item.hours,
            subjects: [...new Set(item.lessons.map((lesson) => lesson.subject))],
            classNames: item.classIds.map((id) => classNameById.get(id) ?? ''),
          };
        })
        .sort(byName)
    : null;

  return {
    date,
    schoolDay: isSchoolDay(date, data.workingDays, holidays),
    classes,
    canteen: {
      halfBoarderCount: canteen.halfBoarderCount,
      expectedCount: canteen.expectedCount,
      absentHalfBoarders,
    },
    teachers,
  };
}

export function buildMonthlyReport(data: AbsenceWorkspace, month: string): MonthlyReport {
  const schoolDays = schoolDaysInMonth(month, data.workingDays, new Set(data.holidayDates));
  const classNameById = new Map(data.classes.map((item) => [item.id, item.name]));
  const { rows, total } = monthlyAbsenceRates({
    classIds: data.classes.map((item) => item.id),
    students: data.students,
    studentAbsences: data.studentAbsences,
    schoolDays,
    slots: data.slots,
  });
  const movements = monthlyMovements(data.students, month);
  const toLine = (student: Student, date: string): MovementLine => ({
    studentId: student.id,
    name: fullName(student),
    className: classNameById.get(student.classId) ?? '',
    date,
  });

  return {
    month,
    schoolDayCount: schoolDays.length,
    rows: rows.map((row) => ({ ...row, className: classNameById.get(row.classId) ?? '' })),
    total,
    joined: movements.joined.map((student) => toLine(student, student.joinDate ?? '')).sort(byName),
    left: movements.left.map((student) => toLine(student, student.leaveDate ?? '')).sort(byName),
  };
}
